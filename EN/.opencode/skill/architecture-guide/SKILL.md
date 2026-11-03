---
name: architecture-guide
description: System design discipline for the architect — technology selection order, DDD boundaries, testable contracts, contract twins, failure modes, alternatives, quality checklist.
---

# architecture-guide

For whom: architect.

## Technology selection

- ToR constraints first.
- Order: free licenses → open technologies → performance → open source → ease of maintenance/scaling → maturity.
- At least two alternatives and a comparison table per key choice; concrete versions.

## Documentation evidence

- Use `context7` MCP when available for library/framework/SDK/API docs; query the exact project version.
- Use `fetch` MCP for known official URLs and `ddg-search` MCP for discovery.
- Use built-in `webfetch` only as a fallback when `fetch` is unavailable.
- Record title, URL, access date, version, and the claim supported in `21-tech-stack.md`; reference sources in `23-interfaces.md` when relevant.
- If no permitted external tool is available, state the limitation; never invent versions or APIs.

## Design quality

- Context diagram, component boundaries, responsibilities table.
- DDD layers/domains; boundaries must support parallel development against contracts.
- Data model; interface contracts: inputs, outputs, errors, validation, idempotency/retry, implementation notes — all testable.
- Error model and failure modes; every analysis risk has a mitigation.
- Security controls; deployment requirements; migration/compatibility notes.
- YAGNI; compact documents without retelling code.

## Brownfield rule

In an existing codebase, follow established patterns unless deviation is justified.

## Contract twin guidance

For every contract intended for development, end the contract file with a valid JSON twin:

```json
{
  "task": "T1",
  "inputs": ["02-architecture/23-interfaces.md#IF-3"],
  "outputs": ["src/api/routes.py"],
  "acceptance": [{ "given": "...", "when": "...", "then": "..." }],
  "touches": ["src/api/"],
  "blocked_by": [],
  "security_sensitive": false
}
```

- Acceptance criteria must be testable.
- `touches` matches the assigned code area; `blocked_by` consistent with the task DAG; no cycles.
- Mark `security_sensitive: true` for auth, user data, secrets, payments, uploads, user-input queries.
- The twin is versioned together with the contract.

## Architecture gate (before planning)

Stack with concrete versions; ≥2 alternatives per key choice; testable stable interfaces; twins present or planned; error model and failure modes described; every risk has a mitigation.
