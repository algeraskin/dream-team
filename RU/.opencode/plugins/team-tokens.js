// team-tokens plugin — maintains team-workspace/<active-project>/tokens.log
// The journal is read-only for agents; /team-tokens-used reads it.
// Records are appended per assistant message that carries token usage.

import { existsSync, mkdirSync, appendFileSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

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

export const TeamTokens = async ({ directory }) => {
  return {
    event: async ({ event }) => {
      try {
        if (event?.type !== "message.updated") return
        const info = event.properties?.info
        if (!info || info.role !== "assistant") return
        const tokens = info.tokens
        if (!tokens || (!tokens.input && !tokens.output)) return

        const workspace = findActiveWorkspace(directory)
        if (!workspace || !tokensLogEnabled(workspace)) return
        if (!existsSync(workspace)) mkdirSync(workspace, { recursive: true })

        const record = {
          ts: new Date().toISOString(),
          session: info.sessionID ?? null,
          role: info.agent ?? info.mode ?? null,
          model: info.modelID ?? null,
          provider: info.providerID ?? null,
          task: null,
          tokens: {
            input: tokens.input ?? 0,
            output: tokens.output ?? 0,
            cache_read: tokens.cache?.read ?? 0,
            cache_write: tokens.cache?.write ?? 0,
            reasoning: tokens.reasoning ?? 0,
          },
          cost: info.cost ?? null,
        }

        appendFileSync(join(workspace, "tokens.log"), JSON.stringify(record) + "\n")
      } catch {
        // never break the session because of accounting
      }
    },
  }
}
