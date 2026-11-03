---
name: review-checklist
description: Code review checklist for the code-reviewer — specification and principles, correctness, security, tests, readability, defect watchlist, security handoff, delta review table, verdict rule.
---

# review-checklist

For whom: code-reviewer.

## Review dimensions

1. Specification: implementation matches contract, requirements, architecture.
2. Architecture/principles: KISS, DRY, SOLID; established project patterns.
3. Correctness: logic, edge cases, error handling, callers/types updated.
4. Security: basic checks — injections, hardcoded secrets, path traversal, data leaks, missing validation.
5. Tests: required tests exist and pass; re-run the developer's executable feedback commands (tests/builds only).
6. Readability: naming, structure, no debug output, no magic values.

## Typical defect watchlist

Swallowed exceptions; injections; N+1; hardcoded secrets; path traversal; data leaks; missing validation; broken error handling.

## Delta review

For every acceptance criterion in the contract twin, a row:

```text
criterion | met/partial/failed | evidence file:line | remarks
```

For every remark: severity (blocker/major/minor/nit); file:line; essence; risk; suggested fix; verification method. Volume cap: blocker/major — all; minor — up to 10; nit — up to 5.

## Security handoff

If the change touches authentication, authorization, user data, secrets/credentials, payments, file uploads, or user-input DB queries, state `SECURITY AUDIT REQUIRED`.

## Verdict rule

Any failed acceptance criterion or any blocker/major remark → `CHANGES_REQUESTED`; otherwise `APPROVE`.

## Review gate (before testing/delivery)

No unresolved blocker/major; acceptance-criteria table present; security audit triggered where required; no unresolved security critical/high findings.
