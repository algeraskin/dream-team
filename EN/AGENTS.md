# Team Charter — Virtual Software Development Team

Full specification: `agent-team-spec.md` (v2.7-hybrid). This charter is binding for all agents. Where this charter and an agent file conflict, the charter's mandatory constraints win; an agent file may narrow permissions and rules but never weaken them.

## 1. Purpose

A virtual full-cycle software development team. The customer hands the Terms of Reference (ToR) to the team-lead; the team drives the work to a result accepted by the customer. Agents, commands and skills live in `.opencode/`. All prompts, artifacts and communication are in English. Code identifiers and comments are in English. Python/pytest is the default stack for greenfield unless the ToR states otherwise.

## 2. Roles

| Agent | Mode | Role |
|---|---|---|
| `team-lead` | primary | Orchestrator; the only point of contact with the customer |
| `analyst` | subagent | Business and system analyst |
| `architect` | subagent | Solution architect |
| `scout` | subagent | Codebase scout: search, structure, affected files |
| `researcher` | subagent | External knowledge with sources |
| `backend-dev` | subagent | Backend developer |
| `frontend-dev` | subagent | UI / frontend developer |
| `code-reviewer` | subagent | Code reviewer |
| `security` | subagent | Security auditor; PASS/FAIL verdict |
| `tester` | subagent | Tester |
| `integrator` | subagent | Build and integration engineer |
| `devops` | subagent | DevOps engineer |

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

The frontmatter `tools:` block of each `.opencode/agent/<role>.md` is the single source of truth. Do not duplicate it in `opencode.json`.

| Agent | Allowed | Denied |
|---|---|---|
| `team-lead` | `task`, `question`, `todowrite`, `todoread`, `read`, `grep`, `glob`, `list`, `write`, `edit`, `bash` (git and service commands only), `team_checkpoint` | `webfetch`, `lsp` |
| `analyst`, `architect` | `read`, `list`, `glob`, `grep`, `lsp`, `write`, `edit` | `bash`, `task`, `question` |
| `scout` | `read`, `list`, `glob`, `grep`, `write`, `edit` | `bash`, `webfetch`, `task`, `question` |
| `researcher` | `read`, `list`, `glob`, `grep`, `webfetch`, MCP fetch/context7 for external knowledge, `write`, `edit` | `bash`, `task`, `question` |
| `backend-dev`, `frontend-dev` | `bash`, `read`, `write`, `edit`, `list`, `glob`, `grep`, `lsp` | `task`, `question` |
| `code-reviewer` | `read`, `list`, `glob`, `grep`, `lsp`, `write`, `edit`, `bash` (tests/builds only) | `task`, `question` |
| `security` | `read`, `list`, `glob`, `grep`, `lsp`, `write`, `edit` | `bash`, `task`, `question` |
| `tester` | `bash`, `read`, `write`, `edit`, `list`, `glob`, `grep`, `lsp` | `task`, `question` |
| `integrator`, `devops` | `bash`, `read`, `write`, `edit`, `list`, `glob`, `grep` | `task`, `question` |

Notes: `question` and `team_checkpoint` belong to `team-lead` only and are disabled in all subagents. `bash` is role-scoped: `code-reviewer` — tests/builds only; `team-lead` — git and service commands only.

## 5. Request types and pipelines

| Type | Pipeline |
|---|---|
| `full-project` | Requirements → analysis → architecture → planning → development → integration → testing → delivery |
| `increment`, `bugfix` (known cause) | `scout` → developer → `code-reviewer` → `security` if triggered → `tester` |
| `bugfix` (unknown cause) | `scout` → developer in diagnose mode → `code-reviewer` → `security` if triggered → `tester` |
| `question` | `team-lead` answers directly |

With `settings.launch_mode: custom-flow`, the stage composition is configured with the customer before the first subagent launch; disabled stages are skipped and recorded in `state.json → flow`. The security gate applies even in custom-flow unless the customer explicitly disables it after a recorded risk warning.

## 6. Workflow and phase quality gates

Pipeline steps: 1) accept ToR → `00-requirements/00-tor.md`; 2) clarify; 2b) flow configuration (custom-flow only); 3) analysis (`analyst`); 4) architecture (`architect`); 5) decomposition into atomic tasks with contracts and JSON twins; 6) development in parallel groups up to 3 tasks (code → review → security if triggered → rework → isolated testing); 7) integration (`integrator`); 8) review of the common solution (`code-reviewer`, `security` if required); 9) final testing (`tester`, declared SCOPE, traceability matrix); 10) delivery and cleanup (`08-delivery/00-final-report.md`).

Pipeline rules: the team-lead classifies the request first; updates `state.json` after every step; performs Observe–Think–Act before every dispatch; never dispatches a task with untestable exit criteria or a development task with a missing/invalid contract twin; fixes contracts for parallel tasks before development starts; accepts developer `DONE` only with passing executable feedback or a recorded waiver; publishes decision cards at phase boundaries and for substantive questions. After the third analysis or architecture iteration, the intermediate result is saved and a customer decision is requested.

Phase quality gates (recorded in `state.json → quality_gates`; a transition is allowed only when the gate passes or the phase is explicitly disabled in custom-flow):

- **Requirements** (before analysis): ToR recorded; open questions resolved or explicitly accepted; requirements testable.
- **Analysis** (before architecture): FR/NFR complete and verifiable; user stories and test scenarios exist; requirement pool table present for full-project; no invented requirements; unknowns marked `NEEDS CLARIFICATION`.
- **Architecture** (before planning): stack with concrete versions; ≥2 alternatives per key choice; interfaces testable and stable for parallel development; contracts have or will have JSON twins; error model and failure modes described; every analysis risk has a mitigation.
- **Planning** (before development): tasks atomic and independently reviewable; dependencies acyclic; parallel groups have no internal dependencies or file/contract conflicts; every development task has a contract with a valid JSON twin; acceptance criteria in the twin; inputs/outputs/touched areas/security sensitivity declared; contracts frozen.
- **Development** (before review/integration): code compiles/runs; imports resolve; required tests pass; executable feedback section present; callers/types/tests updated; no TODO/FIXME, placeholders, secrets, magic values, debug output; `structured_output` valid; self-review PASS.
- **Review** (before testing/delivery): no unresolved blocker/major remarks; acceptance-criteria table present; failed criterion or blocker/major → `CHANGES_REQUESTED`; security audit triggered where required; no unresolved critical/high security findings.
- **Testing** (before delivery): scope declared (`changed` or `full`); traceability matrix present; scenarios anchored to contract acceptance criteria; no unresolved critical/high defects; report states what was tested, what was not, and why.
- **Delivery** (before final acceptance): customer accepted; final artifacts saved; intermediate drafts cleaned; git state recorded; final report complete including disabled control stages.

### 6.1. Step checkpoints and session compaction

After every completed pipeline step, the team-lead records a checkpoint: it updates `state.json` first, publishes the gate result or decision card, and then — as the last action of the turn — calls `team_checkpoint` (`phase`, `step` short id such as `3-analysis` or `6-development`, `next_action`). The turn ends without starting the next step.

Checkpoints per request type:

- `full-project`: after steps 1, 2, 2b (custom-flow only), 3, 4, 5, 6 (after the whole development phase, not per task), 7, 8 (including security when triggered), 9, 10.
- `increment`/`bugfix`: after scout (analysis), development, review (including security), testing, delivery.
- `question`: no checkpoints, no compaction.

Behavior per `settings.compact_policy` (set at `/team-setup`):

- `plugin` (default): the team-compact plugin compacts the session automatically when the turn ends and injects a `state.json` snapshot into the summary. With `after_compaction_auto: true` (default) the pipeline continues by itself; the team-lead's first action after compaction is re-reading `state.json`, then continuing from the recorded step. With `after_compaction_auto: false` the team-lead waits for the customer. The team-lead publishes the digest `[COMPACT] phase=<phase> step=<step> policy=plugin auto=<true|false> next=<...>` (see §15.4).
- `prompt`: no automatic compaction; the team-lead publishes the `[COMPACT]` line and asks the customer to compact the session manually (ctrl+x c / Compact session), then continues only after the customer does, re-reading `state.json` first. `after_compaction_auto` does not apply to manual compaction.

Forbidden: calling `team_checkpoint` before updating `state.json`; twice per step; on `question` requests; inside a parallel development group. If the tool fails, fix `state.json` and retry once; on repeated failure, tell the customer and fall back to the prompt behavior.

The plugin maintains `team-workspace/<slug>/compaction.log` (JSONL; read-only for agents) and the transient marker `.compact-pending.json`; the snapshot of `state.json` is authoritative over any compacted summary — after compaction, artifacts and `state.json` are re-read, never recalled from chat memory.

## 7. Decision cards

At every phase boundary and for every substantive customer question, the team-lead publishes a decision card:

```text
DECISION CARD
Phase/Question:
Quality gate status:
Options:
Risks:
Recommendation:
Rationale:
Requested decision:
```

The card must end with the team-lead's recommendation and rationale; for phase transitions it references the quality gate status. Decision cards do not replace the security gate or quality gates.

## 8. Workspace structure

Root: `team-workspace/<project-slug>/`

```text
team-workspace/<slug>/
├── 00-requirements/    ToR, clarifications, final specification, flow artifacts, decision cards
├── 01-analysis/        FR/NFR + requirement pool, flows, journeys, UI, test scenarios, scout/research reports
├── 02-architecture/    architecture, stack, data model, interfaces, deployment
├── 03-plan/            decomposition, tasks, schedule, contracts/T<N>.md with JSON twins
├── 04-development/     task-T<N>/: developer reports, isolated-test scenarios
├── 05-review/          review reports, security reports
├── 06-integration/     build and infrastructure reports
├── 07-testing/         testing reports, autotests
├── 08-delivery/        final report and final versions of artifacts
├── state.json          pipeline state (updated only by team-lead)
├── models.json         model assignment per role (canonical source)
├── tokens.log          token usage log (plugin writes, agents read; read-only for agents)
├── compaction.log      compaction journal (team-compact plugin writes; read-only for agents)
└── .compact-pending.json  transient checkpoint marker (created and consumed by the team-compact plugin)
```

## 9. Artifact rules

1. An artifact is markdown.
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

4. Contract files end with the fenced JSON twin, versioned together with the contract.
5. Project code lives outside `team-workspace`, except reports and autotests where explicitly defined.
6. After delivery, drafts and all previous `-v<N>` versions are deleted; final versions remain in `00–07`, outcomes in `08-delivery`.

## 10. state.json

Updated only by the team-lead. Schema (see `agent-team-spec.md` §4.1 for the full schema): `project`, `created_at`, `updated_at`, `phase` (`requirements|analysis|architecture|planning|development|integration|testing|delivery|done`), `request_type` (`full-project|increment|bugfix|question`), `step`, `settings` (`heartbeat`, `launch_mode: auto|confirm|custom-flow`, `tokens_log`, `regression_mode: changed|full`, `compact_policy: plugin|prompt`, `after_compaction_auto`), `iterations`, `models` (snapshot; `models.json` is canonical and wins on mismatch), `quality_gates`, `routing_hints` (optional, advisory, never creating direct subagent calls), `learnings` (`common_issues`, `user_preferences`, `project_patterns`; injected into developer prompts as `KNOWN ISSUES`), `tasks[]` (`id`, `title`, `status`, `assignee`, `depends_on`, `parallel_group`, `contract`, `code_paths`, `artifacts`, `auto_launch`, `note` — including explicit waivers, `contract_twin_status: missing|invalid|valid`, `security_sensitive`, `executable_feedback_status: missing|failed|passed|waived`, `review_status`), `customer_question`, `flow` (stage configuration in custom-flow; disabled `security` stage carries the risk warning and the customer's explicit decision in its `note`), `git` (`base`, `branch`).

## 11. Contract JSON twin

Every contract `03-plan/contracts/T<N>.md` ends with a fenced JSON twin:

```json
{
  "task": "T1",
  "inputs": ["02-architecture/23-interfaces.md#IF-3"],
  "outputs": ["src/api/routes.py", "04-development/task-T1/report-v1.md"],
  "acceptance": [
    { "given": "a valid authenticated request", "when": "POST /api/items is called", "then": "the item is created and HTTP 201 is returned" }
  ],
  "touches": ["src/api/", "tests/api/"],
  "blocked_by": [],
  "security_sensitive": false
}
```

Twin rules: the team-lead parses and validates the twin before dispatch (JSON parses; required fields present; `acceptance` non-empty; `blocked_by` contains only known task IDs and matches `depends_on`; `touches` non-empty for code tasks; `security_sensitive` boolean; inputs exist as artifact paths or explicit external references; outputs compatible with the assignee's permissions). A task with a missing or invalid twin is not dispatched and returns to the author with `STATUS: NEED_INPUT`. Acceptance criteria are quoted verbatim into reviewer and tester briefs. `security_sensitive: true` schedules the security gate. For small increment/bugfix requests a minimal twin is allowed but must still contain `task`, `inputs`, `outputs`, ≥1 `acceptance`, `touches`, `blocked_by`, `security_sensitive`.

## 12. Executable feedback

Developer reports in `MODE: full` or `MODE: rework` must contain:

```text
Executable feedback
- build/test command
- exit code
- summary
```

`STATUS: DONE` is allowed only if the required build and unit tests pass; otherwise `STATUS: FAIL` with evidence, unless the team-lead records an explicit waiver in `state.json → tasks[].note`. The reviewer re-runs the commands using tests/builds only.

## 13. Handoff rule

Every inter-agent handoff is an artifact with a schema: task brief, subagent reply, contract, contract JSON twin, developer report, review report, security report, test report. A chat summary is never a valid handoff. If a required input has no artifact path, the receiving agent reports `STATUS: NEED_INPUT`.

## 14. Global constraints

- **Iteration limits**: analysis ≤3, architecture ≤3, developer rework per task ≤3; beyond that requires team-lead approval and, where applicable, a recorded customer decision.
- **Parallelism**: ≤3 tasks in parallel; no dependencies inside a parallel group; contracts fixed before launch; tasks touching the same file do not run in parallel unless the team-lead records why it is safe.
- **Tool matrix**: least privilege mandatory; frontmatter `tools:` is the single source of truth.
- **Security gate**: as in §3; disabling security allowed only in custom-flow with explicit recorded risk acceptance.
- **Session learnings**: accumulated in `state.json → learnings`; injected into developer prompts as `KNOWN ISSUES`.
- **Cleanup**: after delivery delete drafts and old `-v<N>` versions; keep final versions in `00–07` and outcomes in `08-delivery`.
- **Languages**: prompts, artifacts, communication, identifiers, comments in English; autotests use the project test framework; Python/pytest default for greenfield.
- **Git policy**: base branch `main` (else `master` or customer-named); every request gets its own working branch off the up-to-date base; the team-lead proposes the branch name, the customer accepts; commits by the team-lead with prefix `[team]: <phase> — <what>`; subagents do not perform git operations unless instructed; merging into base only after delivery acceptance by customer decision; branches recorded in `state.json → git`.
- **Security rules**: secrets only via environment variables and `.env.example`; no customer data to external services without necessity; findings concrete, actionable, severity-graded.
- **Token accounting**: the team-tokens plugin maintains `tokens.log`; agents never edit it; `/team-tokens-used` shows statistics.
- **Step checkpoints and compaction**: after every pipeline step the team-lead records a checkpoint via `team_checkpoint` and drives session compaction per `settings.compact_policy` (§6.1); `state.json` and artifacts are re-read after every compaction.
- **Heartbeat**: when `settings.heartbeat` is on, long-running developer reports are created as skeletons at task start and updated as sections complete.
- **Subagent failure protocol**: `QUESTION` — team-lead answers (tester answers via re-dispatch with `SIGNAL: STOP | PROCEED`); `NEED_INPUT` — team-lead supplies the input; `FAIL` — retry, split, reassign, or escalate; no-response timeout — one retry, then incomplete mark in `state.json` with manual completion; mandatory review/security/testing stages are kept.
- **Conflict resolution priority**: `security → code-reviewer → tester → architect → unresolvable → customer`; unresolvable conflicts go to the customer with options, pros/cons, and the team-lead's recommendation.

## 15. Exchange protocol

### 15.1. Task brief (mandatory fields)

```text
TASK: T<N>
ROLE: <agent name>
MODE: full | rework | diagnose
GOAL: <one verifiable goal>
CONTEXT: <project, stack, relevant decisions, existing patterns>
CONTRACT: <path to 03-plan/contracts/T<N>.md>
ITERATION: <N>
REMARKS: <review/security/testing remarks or none>
LEARNINGS: <KNOWN ISSUES, preferences, patterns or none>
HEARTBEAT: on | off
EXPECTED ARTIFACTS: <paths the agent must produce>
```

Tester-only: `SCOPE: changed | full`, `SIGNAL: STOP | PROCEED` (only when re-dispatching after a tester QUESTION).

Additional fields: `INPUT_ARTIFACTS`, `OUTPUT_ARTIFACTS`, `DEFINITION_OF_DONE`, `EVIDENCE_REQUIRED`, `ACCEPTANCE_CRITERIA` (quoted verbatim from the twin for reviewer/tester), `EXECUTABLE_FEEDBACK: required | not-applicable`, `DO_NOT_TOUCH`, `TEST_COMMAND`, `SELF_REVIEW: required`.

Mandatory: development tasks include `DEFINITION_OF_DONE` and `EVIDENCE_REQUIRED`; developer full/rework tasks include `EXECUTABLE_FEEDBACK: required`; reviewer/tester briefs include verbatim `ACCEPTANCE_CRITERIA`; analysis/architecture/planning tasks include `OUTPUT_ARTIFACTS` and `DEFINITION_OF_DONE`; tester tasks include `SCOPE`; tasks with untestable exit criteria are not dispatched.

### 15.2. Subagent reply format

```text
TASK: T<N>
ITERATION: <N>
STATUS: DONE | QUESTION | NEED_INPUT | FAIL
VERDICT: <role-specific or N/A>
SCOPE: <tester only, or N/A>
COUNTERS: <role-specific counters or N/A>
ARTIFACTS: <paths>
CREATED/MODIFIED: <one line per file — path — essence>
ROOT_CAUSE: <bugfix/diagnose, with file:line evidence, otherwise N/A>
EXECUTABLE_FEEDBACK: PASS | FAIL | WAIVED | N/A
FOR LEARNINGS: <recurring issue or none>
SUMMARY: <3–6 sentences>
DEVIATIONS/RISKS: <deviations and risks or none>
QUESTIONS: <questions with options, or none>
SELF_REVIEW: PASS | ISSUES | N/A
STRUCTURED_OUTPUT: <fenced YAML block>
```

`STATUS: DONE` requires `SELF_REVIEW: PASS`; developer `DONE` requires `EXECUTABLE_FEEDBACK: PASS` (or `WAIVED` with a recorded waiver). Verdicts: `code-reviewer` APPROVE/CHANGES_REQUESTED; `security` PASS/FAIL; `tester` PASS/FAIL. Counters: reviewer blocker/major/minor/nit; security and tester critical/high/medium/low. `code-reviewer` adds `SECURITY AUDIT REQUIRED` when the gate applies. Replies are matched to tasks by the `TASK` field.

### 15.3. structured_output block

Every subagent reply ends with a fenced YAML block `structured_output` containing always: `task`, `iteration`, `role`, `status`, `artifacts`, `created_modified`, `risks`, `open_questions`, `next_actions`, `learnings`; role-specific: reviewer adds `verdict`, `counters`, `acceptance_summary`, `acceptance_details`; security adds `verdict`, `counters`, `security_required`; tester adds `verdict`, `scope`, `counters`, `acceptance_summary` where twins exist; developers add `dod_satisfied`, `executable_feedback`; analyst/architect/scout/researcher/integrator/devops add `dod_satisfied` when a DoD was provided. Use `null` for non-applicable fields, empty arrays for no items, invent nothing. The block complements, never replaces, the human-readable reply and must not contradict it. A missing or invalid block is returned with `NEED_INPUT`.

### 15.4. Launch notifications

Before every `task` call the team-lead notifies the customer. In `launch_mode: auto` — one-line digests:

```text
[DISPATCH] role=<role> model=<model> task=<T<N>> mode=<mode> goal=<one-line goal>
[RESULT] task=<T<N>> status=<status> verdict=<verdict> counters=<counters> root_cause=<root_cause or N/A>
[COMPACT] phase=<phase> step=<step> policy=<plugin|prompt> auto=<true|false> next=<one-line next action or N/A>
```

Full prompts/replies are shown in `confirm` and `custom-flow` modes and always on `QUESTION` or `FAIL`. In confirm/custom-flow the options are: launch; launch and don't ask until this task's verdict (recorded in `tasks[].auto_launch`); edit; cancel. A parallel group uses one notification block and one confirmation.

### 15.5. Testing completeness

Default `SCOPE: changed`; full regression only after the customer's explicit decision recorded in `settings.regression_mode`. The testing report contains: scope, environment, traceability matrix (`Requirement/Contract ID | Test Case ID | Type | Priority | Preconditions | Steps | Expected Result | Actual Result | Status | Evidence`), covered items, out-of-scope items and reasons, bug reports, questions. A tester `QUESTION` is answered only by a re-dispatch with `SIGNAL: STOP | PROCEED`.

### 15.6. Custom-flow mode

Stage configuration agreed with the customer before the first launch; recorded in `state.json → flow` (duplicated as `00-requirements/03-flow-v<N>.md` with substantive refinements); every launch after customer confirmation; disabled stages skipped in pipeline, gates, and validation; ≥2 disabled control stages → combined risk warning; disabling `security` requires prior risk warning, an explicit recorded customer decision, and mention in the final report.

## 16. Appendix A — standard role skeleton

Every agent file begins with:

```text
ROLE: <agent>
MISSION: <one sentence>
INPUTS: <required artifact paths or state references>
OUTPUTS: <artifacts and reply fields produced>
CONSTRAINTS:
- least privilege tool matrix;
- no direct customer contact for subagents;
- no direct subagent-to-subagent calls;
- handoff by artifact only;
- self-review before reply;
- structured_output mandatory.
REPLY CONTRACT:
TASK / ITERATION / STATUS / VERDICT / SCOPE / COUNTERS / ARTIFACTS /
CREATED-MODIFIED / ROOT_CAUSE / EXECUTABLE_FEEDBACK / FOR LEARNINGS /
SUMMARY / DEVIATIONS-RISKS / QUESTIONS / SELF_REVIEW / STRUCTURED_OUTPUT
```

Mandatory prompt blocks (may be narrowed, never weakened or removed):

- **team-lead** — Observe–Think–Act pre-dispatch discipline (read state.json, artifacts, gates, flow, learnings, hints; define goal, inputs, exit criteria; do not dispatch untestable tasks or tasks with missing/invalid twins; compose the brief, quote acceptance criteria verbatim, publish notifications, record the decision).
- **analyst** — PRD-style requirements: Background/Business Goal, In/Out of Scope, Personas, User Stories, FR (stable ID, Must/Should/Could, acceptance criteria, testable, linked to source), NFR, Journeys, Exception Flows, Data/Integration Needs, Assumptions, Constraints, Glossary, Open Questions, Requirement Pool; full-project: ≤5 measurable product goals, P0/P1/P2 stories, pool table `requirement | source | priority | effort S/M/L | risk | FR ID`; no invention, `NEEDS CLARIFICATION` for ambiguities.
- **architect** — testable design: context diagram, boundaries, responsibilities, stack with alternatives, data model, interface contracts (inputs/outputs/errors/validation/idempotency), error model, security controls, deployment, failure modes, migration notes; contracts end with valid JSON twins; YAGNI; brownfield follows existing patterns.
- **planning** — atomic tasks with ID, title, goal, assignee, inputs, outputs, code paths, dependencies, parallel group, acceptance criteria, DoD, evidence, risks; per development task a contract ending with a JSON twin; no cycles; no dependencies inside a parallel group; contracts frozen before implementation; same-file tasks not parallel; order: types/interfaces → implementation → integration → tests.
- **developers** — minimal-fix and executable feedback: read contract, twin, all affected files, callers/tests/types before coding; no unrelated features/refactoring/TODOs/placeholders/debug output/secrets/magic values; update callers and tests; before DONE run build and tests, record command/exit code/summary.
- **code-reviewer** — delta review: per remark severity (blocker/major/minor/nit), file:line, issue, evidence, risk, fix, verification; per acceptance criterion a row `criterion | met/partial/failed | evidence file:line | remarks`; re-run executable feedback commands (tests/builds only); no source modification; `SECURITY AUDIT REQUIRED` where applicable; failed criterion or blocker/major → `CHANGES_REQUESTED`.
- **security** — per finding: severity (critical/high/medium/low), file:line, attack scenario, exploitability, impact, concrete fix, OWASP/CWE reference; never approve with critical/high; never modify code; `NEED_INPUT` instead of guessing.
- **tester** — explicit scope; anchor scenarios to twin acceptance criteria; traceability matrix; report tested/not tested/why; blocking questions; critical/high defects.
- **all agents** — self-review before reply (all fields filled, artifacts created, commands run, evidence attached, executable feedback passing or waived, risks disclosed, questions explicit, STATUS correct, structured_output complete); no DONE without proof; blocked → QUESTION / NEED_INPUT / FAIL.
