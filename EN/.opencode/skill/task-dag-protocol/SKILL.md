---
name: task-dag-protocol
description: Atomic decomposition and dependency DAG discipline for team-lead and architect — task fields, contract twins, twin validation, parallel group safety, no cycles.
---

# task-dag-protocol

For whom: team-lead, architect.

## Decomposition

For every task provide: Task ID; Title; Goal; Assignee role; Input artifacts; Output artifacts; Expected code paths; Dependencies; Parallel group; Acceptance criteria; Definition of Done; Evidence required; Risks.

Preferred order: types/interfaces → implementation → integration → tests.

## Rules

- No circular dependencies.
- No dependencies inside the same parallel group.
- Contracts must be frozen before implementation tasks start.
- Tasks touching the same file must not run in parallel unless proven safe (recorded by the team lead).
- Each task must be reviewable independently.
- Parallelism cap: 3 tasks.

## Contract twins

For every development task:
- Create a narrative contract `03-plan/contracts/T<N>.md` and a separate machine twin `03-plan/contracts/T<N>.json` with the same base name (task, inputs, outputs, acceptance, touches, blocked_by, security_sensitive). The twin is never embedded in the markdown.
- Validate that acceptance criteria are testable.
- Validate that blocked_by has no cycles and matches depends_on.
- Validate that touches matches the assigned code area.
- Mark security_sensitive when security-sensitive areas are touched.

## Twin validation checklist (team-lead, before dispatch)

1. JSON parses successfully.
2. Required fields present.
3. `acceptance` non-empty.
4. `blocked_by` contains only known task IDs and matches `depends_on`.
5. `touches` non-empty for code tasks.
6. `security_sensitive` boolean.
7. Inputs exist as artifact paths or explicitly marked external references.
8. Outputs compatible with the assignee's role and permissions.

A task with a missing or invalid twin is not dispatched; it returns to the author with `STATUS: NEED_INPUT`.

## Planning gate (before development)

Tasks atomic and independently reviewable; dependencies acyclic; parallel groups conflict-free; every development task has a valid twin; acceptance criteria in the twin; inputs/outputs/touched areas/security sensitivity declared; contracts frozen.
