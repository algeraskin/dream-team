---
name: self-review-protocol
description: Pre-reply self-review checklist for all agents — evidence validation, DoD confirmation, executable feedback confirmation, structured output validation, no DONE without proof.
---

# self-review-protocol

For whom: all agents.

Before sending the final reply, perform self-review.

## Checklist

- Have all required fields been filled (per the REPLY CONTRACT)?
- Does the result satisfy the task brief?
- Are all artifacts created and listed (with `-v<N>` versioning and header template)?
- Are all commands run where required?
- Are all evidence items attached?
- Is executable feedback present and passing for developer DONE, or is a waiver recorded?
- Are risks and deviations disclosed?
- Are open questions explicit?
- Is the STATUS correct?
- Is the structured_output block complete and consistent with the human-readable reply?

## Hard rules

- Do not report DONE if evidence is missing.
- Do not report DONE when the Definition of Done is unmet.
- Do not report DONE when executable feedback is missing or failing without a waiver.
- Do not hide uncertainty.
- If blocked, use QUESTION, NEED_INPUT, or FAIL with a clear reason.

## structured_output validation

Always present: task, iteration, role, status, artifacts, created_modified, risks, open_questions, next_actions, learnings. Role-specific fields per AGENTS.md §15.3. Use null for non-applicable fields, empty arrays for no items, invent nothing, contradict nothing.
