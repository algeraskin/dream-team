VIRTUAL SOFTWARE DEVELOPMENT TEAM
Multi-agent SDLC system for opencode, based on agent-team-spec.md (v2.9-hybrid)

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
  - narrative contract + JSON twin — every development task gets
    `03-plan/contracts/T<N>.md` (readable contract) and a separate
    `T<N>.json` machine twin (inputs, outputs, acceptance criteria, touched
    paths, security sensitivity) validated before dispatch;
  - security gate — auth, user data, secrets, payments, uploads, user-input
    DB queries go through the security auditor;
  - least-privilege tool matrix — each agent can use only its role's tools;
    only the team-lead talks to the customer;
  - MCP-first external research — context7/fetch/ddg-search when available,
    webfetch as a fallback, and cited sources;
  - handoff by artifact — all exchanges go through versioned markdown
    artifacts in the workspace, never chat-only;
  - token accounting plugin and git policy (own working branch per request,
    merge into base only after your acceptance);
  - step checkpoints with session compaction — after every pipeline step the
    session is compacted (automatically with the team-compact plugin, or
    manually by you), and state.json is re-read, so long sessions never lose
    the plot.

Layout:
  opencode.json            opencode configuration (default agent: team-lead)
  AGENTS.md                team charter (loaded as instructions)
  agent-team-spec.md       full technical specification
  .opencode/agent/         12 agent files (team-lead is primary, rest are subagents)
  .opencode/command/       /team-setup, /team-status, /team-resume, /team-tokens-used
  .opencode/plugins/       team-tokens plugin (maintains tokens.log) and
                           team-compact plugin (step checkpoints, session compaction)
  .opencode/skill/         10 role skills
  team-workspace/<slug>/   per-project artifacts, state.json, models.json, tokens.log

Quick start:
  1. Start opencode from this directory (EN/).
  2. Run /team-setup — it polls models for all 12 roles and creates the workspace.
  3. Restart opencode to apply the assigned models.
  4. Hand your ToR to the team-lead.

All team communication, artifacts and prompts are in English.

Deploying to another project:
  deploy.sh is self-contained: all team files are embedded in the script, so
  you can copy just this one file anywhere and run it.

    ./deploy.sh <target-dir>            # install the team into a project
    ./deploy.sh <target-dir> --dry-run  # preview only
    ./deploy.sh <target-dir> --force    # overwrite existing team files (backed up)
    ./deploy.sh <target-dir> --no-charter --no-spec
    ./deploy.sh <target-dir> --with-default-agent
    ./deploy.sh <target-dir> --no-mcp   # do not configure MCP servers
    ./deploy.sh -h                      # full help

  It installs the team files, merges `instructions: += AGENTS.md` into the
  target opencode.json (never overwriting it; the charter becomes
  AGENTS-team.md if the target already has its own AGENTS.md), configures
  optional MCP servers, and verifies the result. Existing
  team-workspace/, tokens.log and compaction.log in the target are never
  touched.

MCP servers (optional)
  By default deploy.sh adds three MCP servers to opencode.json, preserving
  any existing entries with the same names:

    context7    remote, https://mcp.context7.com/mcp
                optional header CONTEXT7_API_KEY={env:CONTEXT7_API_KEY};
                works anonymously at lower rate limits.
    fetch       local, uvx mcp-server-fetch
    ddg-search  local, uvx duckduckgo-mcp-server

  Requirements: python3 for the idempotent JSON merge; uv/uvx for the local
  fetch and ddg-search servers. If uvx is missing, deploy.sh adds context7,
  skips the local servers, and prints a warning. Use --no-mcp to skip MCP
  configuration entirely. The config shape follows the installed opencode:
  V2 uses mcp.servers; opencode 1.x uses top-level mcp.

  Context7 API key
    1. Create a free key: https://context7.com/dashboard
    2. Export it in the environment that starts opencode:
         export CONTEXT7_API_KEY="ctx7sk-..."
       For a persistent setup on macOS/zsh, add the export to ~/.zshrc;
       on Linux/bash, add it to ~/.bashrc. Restart the terminal.
       Or start opencode for one session:
         CONTEXT7_API_KEY="ctx7sk-..." opencode
    3. Verify without printing the key:
         test -n "$CONTEXT7_API_KEY" && echo "CONTEXT7_API_KEY is set"
         opencode mcp list
       context7 should show "connected".
    4. deploy.sh writes CONTEXT7_API_KEY={env:CONTEXT7_API_KEY} into
       opencode.json and never stores the key itself. Set the variable
       before starting opencode, not only before running deploy.sh.
    5. Without a key, context7 works anonymously at lower rate limits;
       the other MCP tools and the webfetch fallback are unaffected.
  Security: never commit the key, never put it directly into opencode.json,
  and do not share it in artifacts or reports.

  Agents check MCP availability at runtime. When context7/fetch/ddg-search
  are absent, they fall back to webfetch (where the role is allowed) and
  then to NEED_INPUT; no MCP state is written to state.json.

  Roles with external access:
    researcher, architect, backend-dev, frontend-dev, devops (fetch/ddg;
    context7 optional), with webfetch as a fallback for every role that has
    fetch. security and all other roles are local-only and route external
    questions through researcher.

Maintaining deploy.sh (repo root):
  The embedded copies of the team files (the payload after "exit 0" in
  deploy.sh) are regenerated from the canonical sources in EN/ and RU/:

    ./build-deploy.sh          # resync both locales
    ./build-deploy.sh RU       # resync one locale

  Important: build-deploy.sh resyncs ONLY the payload bodies. The code part
  of deploy.sh (everything before "exit 0") is duplicated between EN and RU
  and is not touched by the script — edit it in EN/deploy.sh, copy the file
  to RU/deploy.sh, then run ./build-deploy.sh RU to restore the RU payload.
  Check that the code parts are in sync:

    diff <(sed -n '1,/^exit 0$/p' EN/deploy.sh) <(sed -n '1,/^exit 0$/p' RU/deploy.sh)

================================================================================
TYPICAL SCENARIOS
================================================================================

1. New project from scratch (full-project)
   Paste the ToR to team-lead. Pipeline: requirements -> analysis ->
   architecture -> planning (atomic tasks + narrative contracts and JSON twins) -> parallel
   development (<=3 tasks, each code -> review -> security if triggered ->
   isolated testing) -> integration -> review of the common solution ->
   final testing -> delivery. Decision cards are published at every phase
   boundary; you confirm transitions.

2. Increment on an existing codebase
   "Add <feature> to <service>". Pipeline: scout explores the codebase ->
   developer -> code-reviewer -> security if triggered -> tester (SCOPE:
   changed). A minimal separate contract twin is still required.

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
    artifacts, compaction settings and the last compaction.

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

settings.compact_policy (plugin/prompt) — compaction after pipeline steps
    After every completed step the team-lead records a checkpoint (updates
    state.json, then calls team_checkpoint) and the session is compacted,
    keeping long sessions small and focused.
    plugin       (recommended; requires opencode 1.19.4+) the team-compact
                 plugin compacts the session automatically when the step's
                 turn ends and injects a state.json snapshot into the
                 summary, so nothing important is lost.
    prompt       the team-lead publishes a [COMPACT] line and asks you to
                 compact manually: press ctrl+x c (Compact session). The
                 pipeline continues after your compaction.

settings.after_compaction_auto (on/off)
    Only with compact_policy: plugin. When on (recommended), the pipeline
    continues by itself after each step compaction — the team-lead re-reads
    state.json first. When off, the team-lead waits for you after every
    compaction. Not applicable to manual (prompt) compaction.

state.json -> learnings
    Accumulated session knowledge (common_issues, user_preferences,
    project_patterns); injected into developer prompts as KNOWN ISSUES.
    Grows automatically; not directly editable.

Git policy (agreed per request)
    Base branch main (else master or your named branch); one working branch
    per request off the up-to-date base; the team-lead proposes the branch
    name, you accept; commits prefixed "[team]: <phase> — <what>"; merge
    into base only after your acceptance of delivery.
