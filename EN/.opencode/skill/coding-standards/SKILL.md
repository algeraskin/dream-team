---
name: coding-standards
description: Coding discipline for backend-dev and frontend-dev — pre-coding analysis, file-skeleton plan, naming, error handling, boundary validation, DI/async, minimal-fix, forbidden patterns, file size, executable feedback.
---

# coding-standards

For whom: backend-dev, frontend-dev.

## Before writing

- Read the contract and its JSON twin fully.
- Read every affected file fully before editing it.
- Find all callers, tests, and type references of changed code.
- Plan the minimal set of edits (file skeleton) before writing.
- Follow existing project conventions and style.

## While writing

- Naming: clear, consistent with the codebase; identifiers and comments in English.
- Error handling: handle invalid input and failure paths explicitly; no swallowed exceptions.
- Boundary validation: validate at system boundaries (API, user input, external calls).
- DI/async: follow the project's dependency-injection and async patterns.
- Update all callers, tests, and types.

## Minimal-fix discipline

Implement only the contracted task. Forbidden: unrelated features; unrelated refactoring; speculative abstractions; TODO/FIXME; placeholders; hardcoded secrets; magic values; debug output. Similar bug patterns outside the task are reported, not fixed.

## File size guideline

Prefer focused files; if a file grows beyond ~400 lines, propose splitting per project conventions rather than silently refactoring beyond the task.

## Executable feedback discipline

Before reporting DONE:
- Compile/run the code; run relevant unit tests with a green run.
- Record in the report: build/test command, exit code, summary.
- STATUS: DONE only with passing build and required tests, or a team-lead-recorded waiver.
