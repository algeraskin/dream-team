---
description: Project onboarding — poll models for all 12 roles, configure modes, create the workspace
agent: team-lead
---

# /team-setup — project onboarding

Agent: team-lead only. Arguments: $ARGUMENTS (project slug, or `--settings` for modes-only reconfiguration).

## Standard mode

1. Project slug from arguments or by asking the customer via the `question` tool.
2. Repeat-onboarding check: if `team-workspace/<slug>/models.json` exists, show it and ask whether to keep or reconfigure.
3. Available models list: run `opencode models` via bash; fallback — known provider list.
4. Poll for all 12 roles one at a time via `question`:
   team-lead, analyst, architect, scout, researcher, backend-dev, frontend-dev, code-reviewer, security, tester, integrator, devops.
   Question: "Model for role `<role>`" with hints and recommendations.
5. Write `model: <provider/model>` into the frontmatter of each `.opencode/agent/<role>.md` and into `team-workspace/<slug>/models.json` (canonical source).
6. Ask about progress mode (heartbeat): on (recommended) / off.
7. Ask about subagent launch mode: `auto` (recommended) / `confirm` / `custom-flow`.
8. Ask about token accounting: on (recommended) / off.
9. Ask about step-checkpoint compaction (`compact_policy`): `plugin` (recommended — the team-compact plugin compacts the session automatically after every pipeline step) / `prompt` (the team-lead publishes a `[COMPACT]` line and the customer compacts manually with ctrl+x c).
10. Ask about auto-continuation after compaction (`after_compaction_auto`): on (recommended — the pipeline continues by itself after each step compaction; the team-lead re-reads state.json first) / off (the team-lead waits for the customer after each compaction). Ask only when `compact_policy` is `plugin`; with `prompt` write `false` (manual compaction never auto-continues).
11. Create `team-workspace/<slug>/` with directories 00-requirements … 08-delivery, `state.json` (schema per AGENTS.md §10, settings filled from steps 6–10), and `models.json`.
12. `git init` + initial commit if there is no repository.
13. Report to the customer: heartbeat mode; launch mode; token accounting; compaction policy; auto-continuation; reminder to restart opencode to apply models.
14. Hand over the ToR.

## `--settings` mode

- No model poll. No workspace re-creation.
- Only mode questions: heartbeat, launch_mode, tokens_log, compact_policy, after_compaction_auto.
- Update `state.json → settings`; remove legacy `custom_flow` / `show_subagent_prompt` fields.
- `settings.regression_mode` is NOT configured here (the team-lead asks before final testing).
