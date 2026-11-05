---
description: Project onboarding — poll models by tier (A/Dev/B/C), configure modes, create the workspace
agent: team-lead
---

# /team-setup — project onboarding

Agent: team-lead only. Arguments: $ARGUMENTS (project slug, or `--settings` for modes-only reconfiguration).

## Standard mode

1. Project slug from arguments or by asking the customer via the `question` tool.
2. Repeat-onboarding check: if `team-workspace/<slug>/models.json` exists, show it and ask whether to keep or reconfigure.
3. Available models list: run `opencode models` via bash; fallback — known provider list.
4. Ask via `question`: "Configure models by tier or individually?" — options: "By tier (recommended)" / "Individually (12 questions)".
5. Configure models:

   **By tier** — one question per tier via `question`; an individual role can be redefined later by editing `models.json` (the canonical source):

   | Tier | Roles | Recommendation | Profile |
   |---|---|---|---|
   | A — flagship | team-lead, architect | the top (flagship) of the available models | Heavy reasoning: orchestration, design |
   | Dev — code generation | backend-dev, frontend-dev | the top (flagship) of the available models | Code generation + executable feedback (build/tests) |
   | B — mid | tester, analyst, code-reviewer, security | the top of the available models; a light one is acceptable | Structured text, autotests; review and vulnerability findings against acceptance criteria |
   | C — small | scout, researcher, integrator, devops | a light (small/fast) one of the available models | Search, summarization, git/CI mechanics; the most frequent calls |

   **Individually** — one question per role for all 12 roles via `question`: team-lead, analyst, architect, scout, researcher, backend-dev, frontend-dev, code-reviewer, security, tester, integrator, devops. Question: "Model for role `<role>`" with a hint — the tier recommendation for that role from the table above and its profile.

   Propose only models from the available list (`opencode models`; fallback — known provider list); concrete model names are not hard-coded in this command and are never invented — the recommendation is always picked from the actual list.
6. Write `model: <provider/model>` into the frontmatter of each `.opencode/agent/<role>.md` and into `team-workspace/<slug>/models.json` (canonical source).
7. Ask about progress mode (heartbeat): on (recommended) / off.
8. Ask about subagent launch mode: `auto` (recommended) / `confirm` / `custom-flow`.
9. Ask about token accounting: on (recommended) / off.
10. Ask about step-checkpoint compaction (`compact_policy`): `plugin` (recommended — the team-compact plugin compacts the session automatically after every pipeline step) / `prompt` (the team-lead publishes a `[COMPACT]` line and the customer compacts manually with ctrl+x c).
11. Ask about auto-continuation after compaction (`after_compaction_auto`): on (recommended — the pipeline continues by itself after each step compaction; the team-lead re-reads state.json first) / off (the team-lead waits for the customer after each compaction). Ask only when `compact_policy` is `plugin`; with `prompt` write `false` (manual compaction never auto-continues).
12. Create `team-workspace/<slug>/` with directories 00-requirements … 08-delivery, `state.json` (schema — the charter orchestration part in `.opencode/agent/team-lead.md`, state.json section; settings filled from steps 7–11), and `models.json`.
13. `git init` + initial commit if there is no repository.
14. Report to the customer: heartbeat mode; launch mode; token accounting; compaction policy; auto-continuation; reminder to restart opencode to apply models.
15. Hand over the ToR.

## `--settings` mode

- No model poll. No workspace re-creation.
- Only mode questions: heartbeat, launch_mode, tokens_log, compact_policy, after_compaction_auto.
- Update `state.json → settings`; remove legacy `custom_flow` / `show_subagent_prompt` fields.
- `settings.regression_mode` is NOT configured here (the team-lead asks before final testing).
