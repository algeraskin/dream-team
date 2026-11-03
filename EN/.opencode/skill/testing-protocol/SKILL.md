---
name: testing-protocol
description: Testing discipline for the tester — TC and bug report formats, severity categories, scope handling, framework discovery, autotest quality, SIGNAL handling, traceability matrix.
---

# testing-protocol

For whom: tester.

## Scope

- SCOPE: changed — only changed behavior and affected scenarios.
- SCOPE: full — full regression, only after the customer's explicit decision.
- A QUESTION is answered only by a re-dispatch with `SIGNAL: STOP | PROCEED`; do not proceed on your own.

## Test case format

ID TC-N; preconditions; steps; expected result; acceptance criteria (anchored to contract twin acceptance criteria where they exist).

## Bug report format

ID; severity (critical/high/medium/low); environment; steps to reproduce; expected vs actual; evidence; suggested fix (optional).

## Coverage

Happy path; boundary values; invalid input; error handling; permission-related cases if applicable; integration points if affected; regression scenarios within declared SCOPE.

## Autotests (on explicit request)

- Framework discovery first; Python/pytest default for greenfield unless stated otherwise.
- Location: `07-testing/autotests/`.
- AAA structure; names `should <behavior> when <condition>`; edge cases; no always-true assertions.
- Coverage targets: lines > 80%; branches > 70%; all public methods; if unreachable, explain in the report.

## Traceability matrix

```text
Requirement/Contract ID | Test Case ID | Type | Priority | Preconditions |
Steps | Expected Result | Actual Result | Status | Evidence
```

## Report

Scope; environment; traceability matrix; covered items; out-of-scope items and reasons; bug reports; questions; what was tested / not tested / why.

## Testing gate (before delivery)

Scope declared; matrix present; scenarios anchored to twins; no unresolved critical/high defects.
