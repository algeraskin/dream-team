---
description: Resume an interrupted project from state.json and continue the pipeline
agent: team-lead
---

# /team-resume

Agent: team-lead only.

Find the active project (`team-workspace/*/state.json`, phase != done). If none, offer `/team-setup`.

Read:
- `state.json`;
- flow configuration if `settings.launch_mode: custom-flow`;
- quality gates;
- routing hints;
- current step artifacts.

Then:
- Check the checkpoint marker `team-workspace/<slug>/.compact-pending.json`: if a fresh marker (younger than 15 minutes) exists, compact the session before continuing — with `compact_policy: plugin` the compaction starts automatically on session idle, so simply end the turn; with `compact_policy: prompt` ask the customer to press ctrl+x c. A stale marker is deleted without action.
- Summarize where the team stopped (phase, step, active tasks, pending questions).
- After any compaction, re-read state.json before acting on the summary.
- Continue the pipeline from the committed step.
- Do not re-run completed steps.
- Verify models match `models.json` (canonical source).
- On mismatch, remind the customer to restart opencode after /team-setup.
