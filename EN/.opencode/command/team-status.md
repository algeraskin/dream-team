---
description: Show current pipeline state — phase, gates, tasks, learnings, open question
agent: team-lead
---

# /team-status

Agent: team-lead only.

Find the active project: search `team-workspace/*/state.json`, phase != done.

If no `state.json` exists → say so and offer `/team-setup`.

Show:
- project;
- request_type;
- phase;
- step;
- iteration counters;
- heartbeat mode;
- launch mode;
- token accounting;
- regression mode;
- compaction policy (`compact_policy`) and auto-continuation (`after_compaction_auto`);
- last compaction (last record of `compaction.log`: phase, step, ts) and any pending checkpoint marker (`.compact-pending.json`);
- quality gate status (all 8 gates: passed/checked_at/note);
- routing hints if present;
- learnings (common issues, user preferences, project patterns);
- task table (id, title, status, assignee, parallel group, contract path, contract twin path, contract twin status, executable feedback status, review status);
- open customer question;
- latest artifact paths.

Read-only command: do not modify state.json or artifacts.
