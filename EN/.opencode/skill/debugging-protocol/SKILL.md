---
name: debugging-protocol
description: Diagnosis discipline for MODE diagnose — from symptom to verified root cause, execution path tracing, mandatory hypothesis verification, diagnosis format.
---

# debugging-protocol

For whom: backend-dev, frontend-dev in MODE diagnose.

## From symptom to root cause

1. Symptom: record exactly what is observed (error, output, failing test) with evidence.
2. Reproduce: find the minimal reliable reproduction.
3. Trace: follow the execution path through the code (entry point → data flow → failure point); use logs, tests, and reads — not guesses.
4. Hypotheses: list candidate causes; each hypothesis must be verified against evidence before it is accepted.
5. Root cause: the verified cause with `file:line` evidence.
6. Fix: one bug at a time; minimal fix per the contract.

## Rules

- Never fix before the root cause is verified.
- Report `ROOT_CAUSE` with file:line evidence before fixing.
- One bug at a time.
- If evidence is insufficient to verify any hypothesis, report STATUS: NEED_INPUT with what is missing.

## Diagnosis format (in the report)

```text
Symptom: <observed behavior + evidence>
Reproduction: <minimal steps>
Trace: <execution path, key points with file:line>
Hypotheses: <candidates, verified/ruled out with evidence>
Root cause: <verified cause, file:line>
Fix: <what was changed and why it addresses the root cause>
```
