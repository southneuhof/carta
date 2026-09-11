# Module implementation plan

Use `plans/<feature>/NNN-<result>.md`, one plan per observable vertical result.
Split for a real dependency or risk boundary. Preserve valid numbering on resume.
The design defines behavior; reference its IDs rather than copying rules.
The capable planner resolves architecture before assigning the plan to an executor.

```markdown
# Plan NNN: <observable result>

- Design: <path, approved revision and authority>
- Acceptance: <owned IDs>
- Depends on: <plan IDs and exact required interfaces, or NONE>
- Source: <commit and relevant dirty/untracked input snapshot>
- Scope: <permitted edits, test target and side effects>

## Owners and interfaces

| File / symbol | Existing or new | Required change | Consumers |
|---|---|---|---|

Specify exact route methods/paths, input/output types, errors, authorization,
transaction placement and cross-plan interfaces. Name existing exemplars and
applicable layer contracts. State migration generation/application and consumer
update order separately. Resolve architecture and dependency choices here.

## UI contract

For changed web surfaces, reference `ui-contract.json` from the
[UI contract](../../web-ui-surfaces/references/ui-contract.md). Record the selected
component, extension and actual gap once. For each design journey, map one exact
browser test in the worksheet; put its fixture and assertions in the cycle below.

## TDD cycles

| Cycle | Acceptance IDs | Test case | Fixture / actor | Assertions | Expected red | Implementation owners | Review timing | Consequence |
|---|---|---|---|---|---|---|---|---|

Each row names one test as `file::exact test title`, identical to its worksheet
Test case. Use exact acceptance IDs. An acceptance case can need several cycles
to prove its required surfaces. Every evidence row needs a matching cycle.
Review timing is `before-implementation` or `after-plan`; Consequence states the
qualifying effect or `NONE`. Split independent tests into separate rows; one
sequence test can cover a journey.
A plan review gate applies between plans, not between backend and UI layers.
Define exact inputs,
expected outputs, unchanged data and test boundaries from the design. Use the
verification strategy to classify review timing and evidence exceptions.
YAML acceptance records specify tests; executable Vitest/Playwright code runs them.

## Commands

| Purpose / selected cases | Working directory | Exact command | Setup / isolated target | Evidence path |
|---|---|---|---|---|

Mark commands as inspected or run. Include focused cycle checks and the affected
regression checks. Missing setup stays blocked. Browser cases name UI steps and
persisted outcomes; backend evidence cannot complete a required UI case.

## Handoff

Return changed owners, acceptance IDs, red/green and regression reports, test
changes, input snapshot and unresolved conflicts. Stop after this plan for the
orchestrator verdict. Completion and state follow the worksheet contract.
```

## Readiness

Map every design inventory obligation to acceptance and every acceptance case to
one primary plan and its required surfaces in the
[worksheet](../../carta-module-development/references/module-execution-worksheet.md).
Check paths, interfaces, command selectors, fixtures, assertions and dependency
order as an executor without the interview. Use
[verification strategy](../../carta-module-development/references/verification-strategy.md)
for test boundaries and serious-consequence review.

Before marking READY, review the UI contract and journey selection against current
component source and business rules. Existing code and passing tests cannot select
the required components or workflow paths. Then review the packet semantically: decision authority, one test
per cycle, required red-review timing, and UI actions actually performed by the
browser case. A structural pass does not complete this review. Record the verdict
and exact next action: write/run the first named test, obtain its required red
review, or reuse justified existing coverage. Application edits follow that gate.

A repository conflict returns its exact evidence to the planner; a new business
choice returns to design. Preserve unaffected work. The executor may select local
names and equivalent expressions; changed public interfaces, transactions,
dependencies or approved assertions need orchestrator review.
