---
name: requirements-protocol
description: PRD-style requirements discipline for the analyst — product goals, user stories, requirement pool table, acceptance criteria, NEEDS CLARIFICATION handling.
---

# requirements-protocol

For whom: analyst.

## PRD-style requirement pool

- Product goals: maximum 5, measurable.
- User stories: "As a `<role>`, I want `<capability>`, so that `<benefit>`", tagged P0 | P1 | P2.
- Requirement pool table: `requirement | source | priority | effort S/M/L | risk | FR ID`; every row mapped to FR-N.
- Competitive analysis only when the ToR names or implies an existing analogue.

## Requirement quality

- Stable IDs: FR-N for functional, NFR-N for non-functional.
- Priority: Must / Should / Could.
- Every requirement verifiable, with testable acceptance criteria.
- Link every requirement to the ToR or clarification source.
- Invent nothing: undefined items are marked `NEEDS CLARIFICATION`.
- No invented requirements may remain by the analysis gate.

## Artifacts

10-functional-requirements.md, 11-nonfunctional-requirements.md, 12-data-flows.md, 13-user-journeys.md, 14-ui-description.md, 15-test-scenarios.md, 00-summary.md — all with header template, `-v<N>` versioning.

## Test scenarios

IDs TC-N; preconditions; steps; expected result; acceptance criteria.

## Analysis gate (before architecture)

FR/NFR complete and verifiable; user stories and test scenarios exist; requirement pool present for full-project; no invented requirements; unknowns marked NEEDS CLARIFICATION.
