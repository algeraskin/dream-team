---
description: Token usage statistics from tokens.log (read-only)
agent: team-lead
---

# /team-tokens-used

Agent: team-lead only.

Find the workspace. Read `tokens.log` (JSONL written by the team-tokens plugin).

No journal or accounting disabled → say the journal has not been created yet or accounting is off; offer `/team-setup`.

Show:
- totals by session;
- totals by role;
- totals by task `T<N>`;
- grand total;
- average usage per launch;
- top-5 most expensive launches;
- anomalies (launches far above average).

The journal is read-only: never modify `tokens.log`.
