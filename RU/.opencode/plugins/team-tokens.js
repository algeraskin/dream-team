// team-tokens plugin — maintains team-workspace/<active-project>/tokens.log
// The journal is read-only for agents; /team-tokens-used reads it.
//
// OpenCode V2 uses session.step.ended/session.step.failed events; the legacy
// OpenCode 1.x plugin API keeps using message.updated. The module exports both:
//   - default { id, setup }          for OpenCode V2
//   - hidden  { server }             for OpenCode 1.x
// so one deployed file works on both runtimes.

import { existsSync, mkdirSync, appendFileSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const MAX_SEEN = 10000

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
    const statePath = join(root, slug, "state.json")
    try {
      const state = JSON.parse(readFileSync(statePath, "utf8"))
      if (state?.phase && state.phase !== "done") return join(root, slug)
    } catch {}
  }
  return null
}

function tokensLogEnabled(workspace) {
  try {
    const state = JSON.parse(readFileSync(join(workspace, "state.json"), "utf8"))
    return state?.settings?.tokens_log !== false
  } catch {
    return true
  }
}

function normalizeTokens(tokens) {
  return {
    input: tokens?.input ?? 0,
    output: tokens?.output ?? 0,
    cache_read: tokens?.cache?.read ?? 0,
    cache_write: tokens?.cache?.write ?? 0,
    reasoning: tokens?.reasoning ?? 0,
  }
}

function hasUsage(tokens) {
  return Boolean(tokens.input || tokens.output || tokens.cache_read || tokens.cache_write || tokens.reasoning)
}

function appendRecord(directory, record) {
  try {
    const workspace = findActiveWorkspace(directory)
    if (!workspace || !tokensLogEnabled(workspace)) return
    if (!existsSync(workspace)) mkdirSync(workspace, { recursive: true })
    appendFileSync(join(workspace, "tokens.log"), JSON.stringify(record) + "\n")
  } catch {
    // never break the session because of accounting
  }
}

function record(directory, input) {
  const tokens = normalizeTokens(input.tokens)
  if (!hasUsage(tokens)) return
  appendRecord(directory, {
    ts: new Date().toISOString(),
    session: input.session ?? null,
    message: input.message ?? null,
    role: input.role ?? null,
    model: input.model ?? null,
    provider: input.provider ?? null,
    task: input.task ?? null,
    tokens,
    cost: input.cost ?? null,
  })
}

function remember(set, value) {
  if (!value) return
  set.add(value)
  if (set.size > MAX_SEEN) set.delete(set.values().next().value)
}

// OpenCode 1.x / legacy API: message.updated with a cumulative assistant message.
function legacyPlugin({ directory }) {
  const seen = new Set()
  return {
    event: async ({ event }) => {
      try {
        if (event?.type !== "message.updated") return
        const info = event.properties?.info
        if (!info || info.role !== "assistant") return
        // Only the completed message carries final usage; intermediate updates
        // repeat the same message with growing cumulative counts.
        if (info.time?.completed === undefined && info.finish === undefined) return
        const key = info.id ?? `${info.sessionID}:${info.time?.created}`
        if (!key || seen.has(key)) return
        remember(seen, key)
        record(directory, {
          session: info.sessionID,
          message: info.id,
          role: info.agent ?? info.mode,
          model: info.modelID,
          provider: info.providerID,
          task: info.metadata?.task,
          tokens: info.tokens,
          cost: info.cost,
        })
      } catch {
        // never break the session because of accounting
      }
    },
  }
}

// OpenCode V2: session.step.started carries agent/model, step.ended/failed carries usage.
function startV2(ctx) {
  const directory = ctx?.location?.directory
  if (!directory) return
  const abort = new AbortController()
  const steps = new Map()
  const sessions = new Map()
  const seen = new Set()

  const keyOf = (data) => `${data?.sessionID ?? ""}\u0000${data?.assistantMessageID ?? ""}`

  const run = async () => {
    try {
      const events = ctx.event.subscribe({
        types: [
          "session.created",
          "session.deleted",
          "session.agent.selected",
          "session.model.selected",
          "session.step.started",
          "session.step.ended",
          "session.step.failed",
        ],
        signal: abort.signal,
      })
      for await (const event of events) {
        try {
          if (!event || event.type === "server.connected") continue
          const data = event.data ?? {}
          const key = keyOf(data)

          if (event.type === "session.created") {
            sessions.set(data.sessionID, { agent: data.agent ?? null, model: data.model ?? null })
            continue
          }
          if (event.type === "session.deleted") {
            sessions.delete(data.sessionID)
            continue
          }
          if (event.type === "session.agent.selected") {
            const session = sessions.get(data.sessionID) ?? {}
            sessions.set(data.sessionID, { ...session, agent: data.agent ?? null })
            continue
          }
          if (event.type === "session.model.selected") {
            const session = sessions.get(data.sessionID) ?? {}
            sessions.set(data.sessionID, { ...session, model: data.model ?? null })
            continue
          }
          if (event.type === "session.step.started") {
            steps.set(key, { agent: data.agent ?? null, model: data.model ?? null })
            continue
          }

          if (event.type !== "session.step.ended" && event.type !== "session.step.failed") continue
          if (event.id && seen.has(event.id)) continue
          remember(seen, event.id)

          const meta = steps.get(key) ?? sessions.get(data.sessionID) ?? {}
          steps.delete(key)
          record(directory, {
            session: data.sessionID,
            message: data.assistantMessageID,
            role: meta.agent,
            model: meta.model?.id,
            provider: meta.model?.providerID,
            task: event.metadata?.task,
            tokens: data.tokens,
            cost: data.cost,
          })
        } catch {
          // ignore malformed events; keep the subscription alive
        }
      }
    } catch {
      // the server connection closed; the plugin will be disposed with the session
    }
  }

  void run()
  return () => abort.abort()
}

const plugin = {
  id: "team-tokens",
  setup: startV2,
}

// OpenCode 1.x detects the legacy plugin through `server`; keep it
// non-enumerable so the V2 plugin schema sees a clean { id, setup } object.
Object.defineProperty(plugin, "server", {
  value: legacyPlugin,
  enumerable: false,
})

export default plugin
export const TeamTokens = legacyPlugin
