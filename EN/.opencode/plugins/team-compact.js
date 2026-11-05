// team-compact plugin — checkpoint-based session compaction for the team pipeline.
// The team-lead calls the team_checkpoint tool as the LAST action of every pipeline
// step (after state.json is updated). The plugin schedules a session compaction on
// the next session.idle and injects a state.json snapshot into the compaction prompt.
// Policy and continuation are configured in state.json -> settings:
//   compact_policy: "plugin" | "prompt"   (default "plugin")
//   after_compaction_auto: true | false   (default true; plugin policy only)
//   context_guard: { enabled, threshold_pct, min_interval_min }
//     Subagent sessions only: after every completed assistant message the plugin
//     checks context fill against the model context limit (throttled to one check
//     per min_interval_min, default 3) and requests compaction with auto=true
//     when fill >= threshold_pct (default 60). The lead is compacted at step
//     checkpoints instead.
// Files it maintains in team-workspace/<slug>/:
//   .compact-pending.json — transient checkpoint marker (created and consumed by this plugin)
//   compaction.log        — JSONL journal (read-only for agents); events: checkpoint,
//     summarize_requested, summarize_failed, skipped, compacted,
//     context_guard_compact_requested, context_guard_compact_failed, context_guard_skipped

import { existsSync, readFileSync, writeFileSync, appendFileSync, unlinkSync, readdirSync } from "node:fs"
import { join } from "node:path"

const PENDING = ".compact-pending.json"
const LOG = "compaction.log"
const STALE_MS = 15 * 60 * 1000

function findActiveWorkspace(directory) {
  const root = join(directory, "team-workspace")
  if (!existsSync(root)) return null
  let slugs = []
  try {
    slugs = readdirSync(root, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
  } catch {
    return null
  }
  for (const slug of slugs) {
    const state = readState(join(root, slug))
    if (state?.phase && state.phase !== "done") return join(root, slug)
  }
  return null
}

function readState(workspace) {
  try {
    return JSON.parse(readFileSync(join(workspace, "state.json"), "utf8"))
  } catch {
    return null
  }
}

function readSettings(state) {
  const s = (state && state.settings) || {}
  const guard = s.context_guard && typeof s.context_guard === "object" ? s.context_guard : {}
  const pct = Number(guard.threshold_pct)
  const min = Number(guard.min_interval_min)
  return {
    policy: s.compact_policy === "prompt" ? "prompt" : "plugin",
    auto: s.after_compaction_auto !== false,
    guard: {
      enabled: guard.enabled !== false,
      thresholdPct: Number.isFinite(pct) ? Math.min(100, Math.max(1, pct)) : 60,
      minIntervalMs: (Number.isFinite(min) && min > 0 ? min : 3) * 60 * 1000,
    },
  }
}

function projectOf(workspace) {
  const state = readState(workspace)
  return state?.project ?? null
}

function readPending(workspace) {
  try {
    return JSON.parse(readFileSync(join(workspace, PENDING), "utf8"))
  } catch {
    return null
  }
}

function logLine(workspace, record) {
  try {
    appendFileSync(join(workspace, LOG), JSON.stringify(record) + "\n")
  } catch {
    // never break the session because of logging
  }
}

function oneLine(value, fallback) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim()
  return text || fallback
}

// Deterministic snapshot of state.json injected into the compaction prompt.
function buildSnapshot(state, pending) {
  const lines = []
  lines.push("ACTIVE TEAM STATE (authoritative snapshot taken at compaction time):")
  lines.push(
    "project=" + oneLine(state.project, "?") +
    " request_type=" + oneLine(state.request_type, "?") +
    " phase=" + oneLine(state.phase, "?") +
    " step=" + oneLine(state.step, "?"),
  )
  const iterations = state.iterations && typeof state.iterations === "object"
    ? Object.entries(state.iterations).map(([k, v]) => k + "=" + v).join(" ")
    : ""
  if (iterations) lines.push("iterations: " + iterations)
  if (state.git && (state.git.base || state.git.branch)) {
    lines.push("git: base=" + oneLine(state.git.base, "?") + " branch=" + oneLine(state.git.branch, "?"))
  }
  const gates = state.quality_gates && typeof state.quality_gates === "object"
    ? Object.entries(state.quality_gates)
        .map(([name, gate]) => name + "=" + (gate && gate.passed ? "PASS" : "not-passed") + "(" + oneLine(gate?.checked_at, "-") + ")")
        .join(" ")
    : ""
  if (gates) lines.push("quality_gates: " + gates)
  const tasks = Array.isArray(state.tasks) ? state.tasks : []
  if (tasks.length) {
    lines.push("tasks (" + tasks.length + "):")
    const shown = tasks.slice(0, 20)
    for (const task of shown) {
      lines.push(
        "  " + oneLine(task.id, "?") +
        " | status=" + oneLine(task.status, "?") +
        " | assignee=" + oneLine(task.assignee, "?") +
        " | group=" + (task.parallel_group ?? "-") +
        " | twin=" + oneLine(task.contract_twin_status, "-") +
        " | feedback=" + oneLine(task.executable_feedback_status, "-") +
        " | review=" + oneLine(task.review_status, "-"),
      )
    }
    if (tasks.length > shown.length) lines.push("  ... " + (tasks.length - shown.length) + " more tasks (see state.json)")
  }
  if (state.customer_question && state.customer_question.question) {
    lines.push("customer_question: " + oneLine(state.customer_question.question, "?"))
  }
  if (pending) {
    lines.push(
      "pending_checkpoint: phase=" + oneLine(pending.phase, "?") +
      " step=" + oneLine(pending.step, "?") +
      " next_action=" + oneLine(pending.next_action, "N/A"),
    )
  }
  lines.push(
    "RULES: state.json is authoritative over this summary. After compaction, re-read " +
    "team-workspace/" + oneLine(state.project, "<slug>") + "/state.json and the artifacts it references " +
    "before acting. Continue the pipeline from the recorded step.",
  )
  return lines.join("\n")
}

export const TeamCompact = async ({ client, directory }) => {
  const busy = new Set()
  const providerLimitCache = new Map()
  const unknownLimitLogged = new Set()
  const lastGuardCheck = new Map()

  function contextTokens(tokens) {
    return (
      (tokens?.input ?? 0) +
      (tokens?.cache?.read ?? 0) +
      (tokens?.cache?.write ?? 0) +
      (tokens?.output ?? 0) +
      (tokens?.reasoning ?? 0)
    )
  }

  async function contextLimit(providerID, modelID) {
    const cacheKey = providerID + "/" + modelID
    if (providerLimitCache.has(cacheKey)) return providerLimitCache.get(cacheKey)
    let limit = null
    try {
      const res = await client.provider.list({ query: { directory } })
      const providers = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
      const provider =
        providers.find((p) => p?.id === providerID) ??
        providers.find((p) => typeof p?.id === "string" && p.id.toLowerCase() === String(providerID).toLowerCase())
      const model =
        provider?.models?.[modelID] ??
        (provider?.models ? Object.values(provider.models).find((m) => m?.id === modelID) : null)
      const value = Number(model?.limit?.context)
      if (Number.isFinite(value) && value > 0) limit = value
    } catch {
      // leave the limit unknown; the guard will skip
    }
    providerLimitCache.set(cacheKey, limit)
    return limit
  }

  async function requestCompaction(sessionID, body) {
    let result = null
    try {
      result = await client.session.summarize({ path: { id: sessionID }, body, query: { directory } })
    } catch (error) {
      result = { error }
    }
    if (result && result.error) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      try {
        result = await client.session.summarize({ path: { id: sessionID }, body, query: { directory } })
      } catch (error) {
        result = { error }
      }
    }
    return result
  }

  // Context guard: subagent sessions only. Runs after every completed assistant
  // message, throttled to one check per settings.guard.minIntervalMs.
  async function runContextGuard(info) {
    try {
      const role = info.agent ?? info.mode ?? null
      if (!role || role === "team-lead" || role === "primary") return
      const sessionID = info.sessionID
      if (!sessionID || busy.has(sessionID)) return
      const workspace = findActiveWorkspace(directory)
      if (!workspace) return
      if (existsSync(join(workspace, PENDING))) return // checkpoint compaction in flight
      const state = readState(workspace)
      if (!state || state.phase === "done") return
      const settings = readSettings(state)
      if (!settings.guard.enabled) return
      const now = Date.now()
      if (now - (lastGuardCheck.get(sessionID) ?? 0) < settings.guard.minIntervalMs) return
      lastGuardCheck.set(sessionID, now)
      const tokens = contextTokens(info.tokens)
      if (!tokens) return
      const limit = await contextLimit(info.providerID, info.modelID)
      if (!limit) {
        const modelKey = info.providerID + "/" + info.modelID
        if (!unknownLimitLogged.has(modelKey)) {
          unknownLimitLogged.add(modelKey)
          logLine(workspace, {
            ts: new Date().toISOString(),
            event: "context_guard_skipped",
            project: state.project,
            session: sessionID,
            reason: "unknown_context_limit",
            model: modelKey,
          })
        }
        return
      }
      const pct = Math.round((tokens / limit) * 100)
      if (pct < settings.guard.thresholdPct) return
      busy.add(sessionID)
      try {
        const body = { providerID: info.providerID, modelID: info.modelID, auto: true }
        const base = {
          project: state.project,
          session: sessionID,
          tokens,
          context_limit: limit,
          fill_pct: pct,
          threshold_pct: settings.guard.thresholdPct,
          auto: true,
        }
        const result = await requestCompaction(sessionID, body)
        if (result && result.error) {
          logLine(workspace, {
            ts: new Date().toISOString(),
            event: "context_guard_compact_failed",
            ...base,
            ok: false,
            error: result.error?.message ?? String(result.error),
          })
        } else {
          logLine(workspace, {
            ts: new Date().toISOString(),
            event: "context_guard_compact_requested",
            ...base,
            ok: true,
          })
        }
      } finally {
        busy.delete(sessionID)
      }
    } catch {
      // never break the session because of the context guard
    }
  }

  async function resolveModel(sessionID, workspace) {
    try {
      const res = await client.session.messages({ path: { id: sessionID }, query: { directory } })
      const list = Array.isArray(res?.data) ? res.data : []
      for (let i = list.length - 1; i >= 0; i--) {
        const info = list[i]?.info
        if (info && info.role === "assistant" && info.providerID && info.modelID) {
          return { providerID: info.providerID, modelID: info.modelID }
        }
      }
    } catch {
      // fall through to models.json
    }
    try {
      const models = JSON.parse(readFileSync(join(workspace, "models.json"), "utf8"))
      const model = models?.["team-lead"]
      if (typeof model === "string" && model.includes("/")) {
        const idx = model.indexOf("/")
        return { providerID: model.slice(0, idx), modelID: model.slice(idx + 1) }
      }
    } catch {
      // no fallback available
    }
    return null
  }

  return {
    tool: {
      team_checkpoint: {
        description:
          "Record a pipeline step checkpoint (team-lead only). Call it as the LAST action of a pipeline step, " +
          "after state.json has been updated. With compact_policy=plugin the session is compacted automatically " +
          "when the turn ends; with compact_policy=prompt it returns a manual compaction instruction for the customer.",
        args: {
          phase: { type: "string", description: "Current phase from state.json, e.g. analysis." },
          step: { type: "string", description: "Short step id, e.g. 3-analysis, 6-development, 8-review." },
          next_action: {
            type: "string",
            description: "What the team should do after compaction; empty string when nothing special.",
          },
        },
        async execute(args, ctx) {
          try {
            if (ctx?.agent !== "team-lead") {
              return "ERROR: team_checkpoint may be called only by team-lead."
            }
            const phase = String(args?.phase ?? "").trim()
            const step = String(args?.step ?? "").trim()
            const next = String(args?.next_action ?? "").trim()
            if (!phase || !step) return "ERROR: phase and step are required."
            const workspace = findActiveWorkspace(ctx.directory ?? directory)
            if (!workspace) {
              return "ERROR: no active workspace found (team-workspace/<slug>/state.json with phase != done)."
            }
            const state = readState(workspace)
            if (!state) return "ERROR: state.json is unreadable. Fix it first, then retry."
            if (state.phase !== phase) {
              return 'ERROR: state.json phase is "' + state.phase + '" but the checkpoint declares "' +
                phase + '". Update state.json first, then retry.'
            }
            if (!state.step) {
              return "ERROR: state.json step is empty. Update state.json first, then retry."
            }
            const settings = readSettings(state)
            const digest =
              "[COMPACT] phase=" + state.phase +
              " step=" + step +
              " policy=" + settings.policy +
              " auto=" + (settings.policy === "plugin" ? settings.auto : false) +
              " next=" + (next || "N/A")
            if (settings.policy === "prompt") {
              return [
                digest,
                "Compaction policy is prompt: no automatic compaction.",
                "Ask the customer to compact the session: press ctrl+x c (Compact session).",
                "End your turn now. Do not start the next step.",
                "After the customer compacts, re-read state.json and continue the pipeline from the committed step.",
              ].join("\n")
            }
            const pending = {
              session_id: ctx.sessionID,
              project: state.project ?? null,
              phase: state.phase,
              step,
              next_action: next || null,
              requested_at: new Date().toISOString(),
              auto: settings.auto,
            }
            writeFileSync(join(workspace, PENDING), JSON.stringify(pending, null, 2) + "\n")
            logLine(workspace, {
              ts: new Date().toISOString(),
              event: "checkpoint",
              project: pending.project,
              session: ctx.sessionID,
              phase: pending.phase,
              step: pending.step,
              policy: "plugin",
              auto: pending.auto,
            })
            return [
              digest,
              "Checkpoint recorded. Session compaction starts automatically when this turn ends.",
              settings.auto
                ? "After compaction, re-read state.json first, then continue the pipeline."
                : "After compaction, wait for the customer before continuing.",
              "Do not start the next step in this turn.",
            ].join("\n")
          } catch (error) {
            return "ERROR: team_checkpoint failed: " + (error?.message ?? String(error))
          }
        },
      },
    },

    event: async ({ event }) => {
      try {
        if (event?.type === "session.compacted") {
          const sessionID = event.properties?.sessionID
          const workspace = findActiveWorkspace(directory)
          if (workspace && sessionID) {
            logLine(workspace, {
              ts: new Date().toISOString(),
              event: "compacted",
              project: projectOf(workspace),
              session: sessionID,
            })
          }
          return
        }
        if (event?.type === "message.updated") {
          // context guard: subagent sessions only, throttled inside runContextGuard
          const info = event.properties?.info
          if (
            info &&
            info.role === "assistant" &&
            info.providerID &&
            info.modelID &&
            (info.time?.completed !== undefined || info.finish !== undefined)
          ) {
            await runContextGuard(info)
          }
          return
        }
        if (event?.type !== "session.idle") return
        const sessionID = event.properties?.sessionID
        if (!sessionID) return
        const workspace = findActiveWorkspace(directory)
        if (!workspace) return
        const pendingPath = join(workspace, PENDING)
        if (!existsSync(pendingPath)) return
        const pending = readPending(workspace)
        if (pending && pending.session_id !== sessionID) return
        try {
          unlinkSync(pendingPath)
        } catch {
          // already gone
        }
        if (!pending) return
        const state = readState(workspace)
        if (!state || state.phase === "done") {
          logLine(workspace, {
            ts: new Date().toISOString(),
            event: "skipped",
            project: projectOf(workspace),
            session: sessionID,
            reason: "no active pipeline",
          })
          return
        }
        const settings = readSettings(state)
        if (settings.policy !== "plugin") {
          logLine(workspace, {
            ts: new Date().toISOString(),
            event: "skipped",
            project: state.project,
            session: sessionID,
            phase: pending.phase,
            step: pending.step,
            policy: settings.policy,
            reason: "compact_policy is not plugin",
          })
          return
        }
        if (busy.has(sessionID)) return
        busy.add(sessionID)
        try {
          const model = await resolveModel(sessionID, workspace)
          if (!model) {
            logLine(workspace, {
              ts: new Date().toISOString(),
              event: "summarize_failed",
              project: state.project,
              session: sessionID,
              phase: pending.phase,
              step: pending.step,
              policy: "plugin",
              auto: pending.auto === true,
              ok: false,
              error: "could not resolve providerID/modelID",
            })
            return
          }
          const body = { providerID: model.providerID, modelID: model.modelID, auto: pending.auto === true }
          let result = null
          try {
            result = await client.session.summarize({ path: { id: sessionID }, body, query: { directory } })
          } catch (error) {
            result = { error }
          }
          if (result && result.error) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            try {
              result = await client.session.summarize({ path: { id: sessionID }, body, query: { directory } })
            } catch (error) {
              result = { error }
            }
          }
          if (result && result.error) {
            const message = result.error?.message ?? String(result.error)
            logLine(workspace, {
              ts: new Date().toISOString(),
              event: "summarize_failed",
              project: state.project,
              session: sessionID,
              phase: pending.phase,
              step: pending.step,
              policy: "plugin",
              auto: pending.auto === true,
              ok: false,
              error: message,
            })
          } else {
            logLine(workspace, {
              ts: new Date().toISOString(),
              event: "summarize_requested",
              project: state.project,
              session: sessionID,
              phase: pending.phase,
              step: pending.step,
              policy: "plugin",
              auto: pending.auto === true,
              ok: true,
            })
          }
        } finally {
          busy.delete(sessionID)
        }
      } catch {
        // never break the session because of compaction bookkeeping
      }
    },

    "experimental.session.compacting": async (input, output) => {
      try {
        const workspace = findActiveWorkspace(directory)
        if (!workspace) return
        const state = readState(workspace)
        if (!state) return
        const pending = readPending(workspace)
        output.context.push(buildSnapshot(state, pending))
      } catch {
        // never break compaction because of snapshot injection
      }
    },
  }
}
