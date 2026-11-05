# Team Charter — Virtual Software Development Team (slim)

Full specification: `agent-team-spec.md` (v2.9-hybrid). This is the slim charter: only the invariants binding for every agent on every call. The orchestration part of the charter (pipelines, quality gates, state.json, contract twins, exchange protocol) lives in `.opencode/agent/team-lead.md`. On conflict: `agent-team-spec.md` > charter > agent file; an agent file may narrow permissions and rules but never weaken them.

## 1. Purpose

A virtual full-cycle software development team. The customer hands the Terms of Reference (ToR) to the team-lead; the team drives the work to a result accepted by the customer. Agents, commands and skills live in `.opencode/`. All prompts, artifacts and communication are in English. Code identifiers and comments are in English. Python/pytest is the default stack for greenfield unless the ToR states otherwise.

## 2. Roles

`team-lead` — primary, orchestrator, the only point of contact with the customer. Subagents: `analyst`, `architect`, `scout`, `researcher`, `backend-dev`, `frontend-dev`, `code-reviewer`, `security`, `tester`, `integrator`, `devops`.

## 3. Interaction rules

1. The customer communicates only with `team-lead`.
2. Subagents never address the customer directly.
3. Questions to the customer are delivered by the team-lead via the `question` tool.
4. The team-lead delegates via the `task` tool (`subagent_type` = agent name).
5. No direct `subagent → subagent` calls.
6. The `development → review → security → testing` cycle is routed by the team-lead.
7. A subagent does not modify other agents' artifacts or areas of responsibility.
8. The team-lead may reject a `DONE` reply if self-review, executable feedback, evidence, Definition of Done, or `structured_output` is missing or inconsistent.

### Security gate

A task touching authentication, authorization, user data, secrets/credentials, payments, file uploads, or DB queries built from user input must go through `security` after `code-reviewer`. A `security` verdict `FAIL` with any critical/high finding blocks further steps until fixed. A contract twin with `"security_sensitive": true` schedules the security gate even when the task text alone would not trigger it.

## 4. Tool matrix (least privilege)

The frontmatter `tools:` block of each `.opencode/agent/<role>.md` is the single source of truth; do not duplicate it in `opencode.json`. `question` and `team_checkpoint` belong to `team-lead` only and are disabled in all subagents. `bash` is role-scoped. Tool availability is checked at runtime and is not stored in `state.json`.

## 5. Request types and pipelines

→ Orchestration part: `.opencode/agent/team-lead.md`, section "Request types and pipelines". Not needed by subagents: stage composition is decided by the team-lead and delivered in the task brief.

## 6. Workflow and phase quality gates

→ Orchestration part: `.opencode/agent/team-lead.md`, sections "Workflow and phase quality gates" and "Step checkpoints and session compaction". Role-level gate requirements are duplicated in the corresponding agent files. Session compaction at step checkpoints follows `settings.compact_policy` (`plugin` — automatic via the team-compact plugin, with `after_compaction_auto` continuing the pipeline; `prompt` — manual by the customer); missing means `plugin`.

## 7. Decision cards

→ Orchestration part: `.opencode/agent/team-lead.md`, section "Decision cards". Only the team-lead publishes decision cards.

## 8. Workspace structure

→ Orchestration part: `.opencode/agent/team-lead.md`, section "Workspace structure". A subagent only needs the paths from its own file's `INPUTS`/`OUTPUTS` and the task brief.

## 9. Artifact rules

1. Human-readable artifacts are markdown. The machine contract twin `T<N>.json` is the only JSON artifact type; service files (`state.json`, `models.json`, `tokens.log`, `compaction.log`, `.compact-pending.json`) are not artifacts.
2. A new iteration = a new file `-v<N>`; previous versions are never overwritten.
3. Every artifact opens with the header template:

```markdown
# <type> v<N>

Project: <project-slug>
Author: <role>
Date: <YYYY-MM-DD>
Iteration: <N>

Related to: <contract / requirements / scenarios / related reports>
Depends on: <input artifacts, when applicable>
Evidence: <commands, test results, when applicable>
```

`Related to` is mandatory. `Depends on` and `Evidence` are mandatory for planning, development, review, integration, and testing artifacts where applicable.

4. Every contract consists of two files with the same base name: `T<N>.md` (narrative) and `T<N>.json` (machine twin). They are authored, reviewed, and updated together; the twin is never embedded in the markdown. Contract filenames use the task ID without `-v<N>`; a revised contract updates both files together.
5. Project code lives outside `team-workspace`, except reports and autotests where explicitly defined.
6. Agents create temporary files and environments only under `team-workspace/<slug>/tmp`; the team-lead deletes `tmp` after delivery acceptance.
7. After delivery, drafts and all previous `-v<N>` versions are deleted; final versions remain in `00–07`, outcomes in `08-delivery`.

## 10. state.json

→ Orchestration part: `.opencode/agent/team-lead.md`, section "state.json". Only the team-lead maintains and updates the schema; subagents read it as needed.

## 11. Contract files: narrative and JSON twin

Every development contract consists of two files with the same base name: `T<N>.md` (narrative) and `T<N>.json` (machine twin). The twin is a standalone JSON file, never embedded in the markdown. The narrative contract is authoritative for intent; the twin is authoritative for dispatch fields; they must not contradict. Mandatory twin fields: `task`, `inputs`, `outputs`, ≥1 `acceptance`, `touches`, `blocked_by`, `security_sensitive`. A task with a missing or invalid twin is not dispatched and returns to the author with `STATUS: NEED_INPUT`. Acceptance criteria are quoted verbatim into reviewer and tester briefs. → Full schema and validation checklist: `.opencode/agent/team-lead.md`, section "Contract files: narrative and JSON twin".

## 12. Executable feedback

→ Role part: format and rules in `.opencode/agent/backend-dev.md`, `.opencode/agent/frontend-dev.md` ("Executable feedback" section); acceptance and command re-runs in `.opencode/agent/team-lead.md` and `.opencode/agent/code-reviewer.md`. A developer `STATUS: DONE` is allowed only if the required build and unit tests pass.

## 13. Handoff rule

Every inter-agent handoff is an artifact with a schema: task brief, subagent reply, contract narrative, contract JSON twin, developer report, review report, security report, test report. A chat summary is never a valid handoff. If a required input has no artifact path, the receiving agent reports `STATUS: NEED_INPUT`.

## 14. Global constraints

- **Tool matrix**: least privilege mandatory; frontmatter `tools:` is the single source of truth (§4).
- **Security gate**: as in §3; disabling security allowed only in custom-flow with explicit recorded risk acceptance.
- **Languages**: prompts, artifacts, communication, identifiers, comments in English; autotests use the project test framework; Python/pytest default for greenfield.
- **Security rules**: secrets only via environment variables and `.env.example`; no customer data to external services without necessity; never send secrets, credentials, personal data, or customer code to external MCP servers or websites; findings concrete, actionable, severity-graded.
- **External information and MCP**: local sources first; then `context7` for library/framework/SDK/API docs, `fetch` for known URLs, `ddg-search` for discovery; `webfetch` is a fallback only where `fetch` is allowed. Cite every source (title, URL, access date, claim), record the tool used and any fallback, do not invent URLs or versions, and do not bypass the matrix with `bash`/`curl`/`wget`. `security` and other roles without external tools route questions through `researcher`. MCP server availability is checked at runtime, never persisted in `state.json`.
- **Token accounting**: the team-tokens plugin maintains `tokens.log`; agents never edit it; `/team-tokens-used` shows statistics.
- **Orchestration constraints** (iteration limits, parallelism ≤3, learnings, cleanup, git policy, heartbeat, subagent failure protocol, conflict resolution priority): → `.opencode/agent/team-lead.md`, section "Global constraints (orchestration)".

## 15. Exchange protocol

### 15.1. Task brief and launch notifications

→ Orchestration part: `.opencode/agent/team-lead.md`, sections "Task brief" and "Launch notifications". A subagent receives the brief in the `task` call and replies per the REPLY CONTRACT in its own file header.

### 15.2. Subagent reply format

→ Defined in the REPLY CONTRACT of each agent file; consolidated format in `.opencode/agent/team-lead.md`, section "Subagent reply format". `STATUS: DONE` requires `SELF_REVIEW: PASS`; developer `DONE` requires `EXECUTABLE_FEEDBACK: PASS` (or `WAIVED` with a recorded waiver); blocked → `QUESTION` / `NEED_INPUT` / `FAIL`.

### 15.3. structured_output block

Every subagent reply ends with a fenced YAML block `structured_output` containing always: `task`, `iteration`, `role`, `status`, `artifacts`, `created_modified`, `risks`, `open_questions`, `next_actions`, `learnings`; role-specific: reviewer adds `verdict`, `counters`, `acceptance_summary`, `acceptance_details`; security adds `verdict`, `counters`, `security_required`; tester adds `verdict`, `scope`, `counters`, `acceptance_summary` where twins exist; developers add `dod_satisfied`, `executable_feedback`; analyst/architect/scout/researcher/integrator/devops add `dod_satisfied` when a DoD was provided. Use `null` for non-applicable fields, empty arrays for no items, invent nothing. The block complements, never replaces, the human-readable reply and must not contradict it. A missing or invalid block is returned with `NEED_INPUT`.

### 15.4. Launch notifications

→ Orchestration part: `.opencode/agent/team-lead.md`, section "Launch notifications" (`[DISPATCH]` / `[RESULT]` / `[COMPACT]` digests).

### 15.5. Testing completeness

→ Role part: `.opencode/agent/tester.md` (traceability matrix columns, report); the regression scope decision belongs to the team-lead.

### 15.6. Custom-flow mode

→ Orchestration part: `.opencode/agent/team-lead.md`, section "Custom-flow mode". For subagents: a disabled stage is simply not dispatched to them; everything else is unchanged.

## 16. Appendix A — standard role skeleton

→ The ROLE/MISSION/INPUTS/OUTPUTS/CONSTRAINTS/REPLY CONTRACT skeleton and role prompt blocks are embedded in the headers of `.opencode/agent/<role>.md`; reference: `agent-team-spec.md`, Appendix A. Blocks may be narrowed, never weakened or removed.
