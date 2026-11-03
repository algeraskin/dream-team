VIRTUAL SOFTWARE DEVELOPMENT TEAM
Multi-agent SDLC system for opencode, based on agent-team-spec.md (v2.6-hybrid)

================================================================================
WHAT THIS IS
================================================================================

A virtual full-cycle development team living inside opencode. You hand a Terms
of Reference (ToR) to the team-lead (the primary agent and the only point of
contact with you); the team drives the work to a result you accept.

12 agents: team-lead (orchestrator), analyst, architect, scout (codebase
explorer), researcher (external knowledge with sources), backend-dev,
frontend-dev, code-reviewer, security (auditor with PASS/FAIL verdict),
tester, integrator, devops.

Key mechanisms:
  - pipelines per request type (full-project / increment / bugfix / question);
  - phase quality gates — a phase transition is allowed only when the gate
    passes;
  - contract JSON twins — every development task gets a machine-checkable
    contract (inputs, outputs, acceptance criteria, touched paths,
    security sensitivity) validated before dispatch;
  - security gate — auth, user data, secrets, payments, uploads, user-input
    DB queries go through the security auditor;
  - least-privilege tool matrix — each agent can use only its role's tools;
    only the team-lead talks to the customer;
  - handoff by artifact — all exchanges go through versioned markdown
    artifacts in the workspace, never chat-only;
  - token accounting plugin and git policy (own working branch per request,
    merge into base only after your acceptance).

Layout:
  opencode.json            opencode configuration (default agent: team-lead)
  AGENTS.md                team charter (loaded as instructions)
  agent-team-spec.md       full technical specification
  .opencode/agent/         12 agent files (team-lead is primary, rest are subagents)
  .opencode/command/       /team-setup, /team-status, /team-resume, /team-tokens-used
  .opencode/plugins/       team-tokens plugin (maintains tokens.log)
  .opencode/skill/         10 role skills
  team-workspace/<slug>/   per-project artifacts, state.json, models.json, tokens.log

Quick start:
  1. Start opencode from this directory (EN/).
  2. Run /team-setup — it polls models for all 12 roles and creates the workspace.
  3. Restart opencode to apply the assigned models.
  4. Hand your ToR to the team-lead.

All team communication, artifacts and prompts are in English.

================================================================================
TYPICAL SCENARIOS
================================================================================

1. New project from scratch (full-project)
   Paste the ToR to team-lead. Pipeline: requirements -> analysis ->
   architecture -> planning (atomic tasks + contract twins) -> parallel
   development (<=3 tasks, each code -> review -> security if triggered ->
   isolated testing) -> integration -> review of the common solution ->
   final testing -> delivery. Decision cards are published at every phase
   boundary; you confirm transitions.

2. Increment on an existing codebase
   "Add <feature> to <service>". Pipeline: scout explores the codebase ->
   developer -> code-reviewer -> security if triggered -> tester (SCOPE:
   changed). A minimal contract twin is still required.

3. Bugfix with a known cause
   "Function X throws Y when Z". scout -> developer (fix only) ->
   code-reviewer -> security if triggered -> tester.

4. Bugfix with an unknown cause
   "It crashes somewhere". scout -> developer in diagnose mode (symptom ->
   reproduction -> execution-path trace -> verified root cause with file:line
   -> minimal fix) -> code-reviewer -> security if triggered -> tester.

5. Question to the team
   "How should X be implemented?" — team-lead answers directly, dispatching
   scout/researcher if the codebase or external sources must be checked.

6. Interrupted session
   Run /team-resume in a new session: the pipeline continues from the state
   recorded in state.json without re-running completed steps.

7. Cost audit
   Run /team-tokens-used to see token spending by session, role, task and
   model, plus the most expensive launches and anomalies.

================================================================================
COMMANDS
================================================================================

/team-setup [slug | --settings]
    Project onboarding. Creates team-workspace/<slug>/ (00-requirements ...
    08-delivery, state.json, models.json), polls a model for each of the 12
    roles, writes the assignment into agent files and models.json (canonical
    source), asks about the modes (see below), initializes git if needed.
    With --settings: re-configures modes only, without re-polling models.

/team-status
    Read-only snapshot of the current project: phase, request type, quality
    gate statuses, task table, open customer question, learnings, latest
    artifacts.

/team-resume
    Finds the active project, summarizes where the team stopped, and
    continues the pipeline from the committed step. No re-run of completed
    steps; models are verified against models.json.

/team-tokens-used
    Statistics from tokens.log (written by the plugin): totals by session,
    role, task; average per launch; top-5 most expensive launches; anomalies.
    Read-only — the log is never edited by agents.

================================================================================
CONFIGURABLE PARAMETERS
================================================================================

Models per role (set by /team-setup)
    One model for each of the 12 agents; stored in agent file frontmatters
    and in team-workspace/<slug>/models.json (canonical source; wins on
    mismatch with state.json).

settings.launch_mode — how subagent launches are shown to you
    auto         one-line [DISPATCH]/[RESULT] digests; no confirmations
                 (recommended).
    confirm      full prompts/replies; every launch asks: launch / launch and
                 don't ask until this task's verdict / edit / cancel.
    custom-flow  full control: the stage composition is agreed with you before
                 the first launch and recorded in state.json -> flow; disabled
                 stages are skipped in pipeline, gates and validation;
                 disabling security requires a prior risk warning and an
                 explicit recorded decision, and is mentioned in the final
                 report.

settings.heartbeat (on/off)
    When on, long-running developer reports are created as skeletons at task
    start and updated as sections complete — you see progress while the
    subagent works (recommended on).

settings.tokens_log (on/off)
    Token accounting; the plugin appends one JSONL record per assistant
    message to team-workspace/<slug>/tokens.log.

settings.regression_mode (changed/full)
    Final-testing scope. Default is changed (only affected behavior);
    full regression runs only after your explicit decision.

state.json -> learnings
    Accumulated session knowledge (common_issues, user_preferences,
    project_patterns); injected into developer prompts as KNOWN ISSUES.
    Grows automatically; not directly editable.

Git policy (agreed per request)
    Base branch main (else master or your named branch); one working branch
    per request off the up-to-date base; the team-lead proposes the branch
    name, you accept; commits prefixed "[team]: <phase> — <what>"; merge
    into base only after your acceptance of delivery.
