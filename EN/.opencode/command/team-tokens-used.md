---
description: Token usage statistics from tokens.log (read-only)
agent: team-lead
---

# /team-tokens-used

Agent: team-lead only.

Find the workspace. Read `tokens.log` (JSONL written by the team-tokens plugin).

No journal or accounting disabled → say the journal has not been created yet or accounting is off; offer `/team-setup`.

Show:
- totals by session (the closest available proxy for a launch);
- totals by role, model, and provider;
- totals by task `T<N>` when the journal has task IDs; otherwise group by session/launch and state that task IDs are absent;
- grand total;
- average usage per session/launch;
- top-5 most expensive sessions/launches;
- anomalies (sessions/launches far above average).

The journal is read-only: never modify `tokens.log`.
