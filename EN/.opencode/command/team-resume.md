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
- Summarize where the team stopped (phase, step, active tasks, pending questions).
- Continue the pipeline from the committed step.
- Do not re-run completed steps.
- Verify models match `models.json` (canonical source).
- On mismatch, remind the customer to restart opencode after /team-setup.
