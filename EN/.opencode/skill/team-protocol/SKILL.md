---
name: team-protocol
description: Navigator for the team charter and spec. Use to map any team task or question to the right section of AGENTS.md or agent-team-spec.md.
---

# team-protocol

This skill is a navigator: it contains no rules or schemas itself — it maps tasks to sections.

| Need | Go to |
|---|---|
| Roles, hierarchy, interaction rules, security gate | AGENTS.md §2–3 (invariants); spec §2 |
| Tool matrix (who may use what) | AGENTS.md §4; spec §2.1 |
| External information, MCP preference, webfetch fallback | AGENTS.md §4, §14; spec §2.1, §5.22 |
| Request types and pipelines | `.opencode/agent/team-lead.md` (charter orchestration part); spec §2.2 |
| Pipeline steps and quality gates | `.opencode/agent/team-lead.md` (charter orchestration part); spec §3 |
| Step checkpoints and session compaction | `.opencode/agent/team-lead.md` (charter orchestration part); spec §3.5, §5.21 |
| Decision cards | `.opencode/agent/team-lead.md` (charter orchestration part); spec §3.4, §6.7 |
| Workspace and artifact rules, header template | `.opencode/agent/team-lead.md` (charter orchestration part) (workspace); AGENTS.md §9 (artifacts); spec §4 |
| state.json schema and field semantics | `.opencode/agent/team-lead.md` (charter orchestration part); spec §4.1 |
| Contract narrative + JSON twin files and validation checklist | `.opencode/agent/team-lead.md` (charter orchestration part); AGENTS.md §11 (invariants); spec §4.2 |
| Routing hints | spec §4.3 |
| Global constraints (iterations, parallelism, git, security, learnings, cleanup) | `.opencode/agent/team-lead.md` (charter orchestration part) (orchestration); AGENTS.md §14 (common); spec §5 |
| Task brief format | `.opencode/agent/team-lead.md` (charter orchestration part); spec §6.1 |
| Subagent reply format | agent file REPLY CONTRACT; AGENTS.md §15.2; spec §6.2 |
| structured_output block | AGENTS.md §15.3; spec §6.3 |
| Launch notifications and digests | `.opencode/agent/team-lead.md` (charter orchestration part); spec §6.4 |
| Testing completeness and traceability | `.opencode/agent/tester.md`; spec §6.5 |
| Custom-flow mode | `.opencode/agent/team-lead.md` (charter orchestration part); spec §6.6 |
| Standard role skeleton and prompt blocks | headers of `.opencode/agent/<role>.md`; spec Appendix A |
| Role specifications | spec §8 |
| Command specifications | spec §9 |
| Skill specifications | spec §10 |
| System acceptance criteria | spec §13 |
