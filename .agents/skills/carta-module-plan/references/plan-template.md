# Module implementation plan

Write one plan per observable result. Keep a small result in one short plan;
split only for a separate outcome, prerequisite or risk boundary. The design
owns behavior, this plan owns implementation order and proof, and the worksheet
owns progress. Link to those owners instead of repeating them.

Use `plans/<feature>/NNN-<result>.md`. Preserve existing numbering and usable
plans. The executor has the repository and referenced artifacts; it must not
need the discovery conversation.

## Template

```markdown
# Plan NNN: <Observable result>

- Design: <path, revision and approval source>
- Acceptance: <IDs owned by this plan>
- Depends on: <plan and required interface, or none>
- Source: <commit/date and relevant input snapshot>
- State: <worksheet row>

## Result and current owners

State the intended change and its reason. Name the current files and symbols
that own the behavior, and consumers affected by it. Distinguish new files from
inspected files. Include code only when it clarifies a fragile interface.

## Scope

State the selected outcomes, supporting edits and relevant exclusions. Name
permitted test targets and side effects. Separate migration generation from
applying it. Preserve unrelated work. Framework changes and external or
destructive writes require the user's authority.

## Implementation

1. <Change, owning files/symbols and required input/output contract.>
   Verify: <smallest useful check and expected outcome.>
2. <Next dependent result.>
   Verify: <check or shared acceptance gate.>

Reference the applicable layer skills. Keep technical choices with the
implementer when they cannot change the behavior contract. Include migration,
backfill and consumer update order when the data contract changes.

## Checks

| Acceptance ID | Plausible fault | Test owner/case | Expected result |
|---|---|---|---|

| Check | Working directory | Exact command | Setup and evidence path |
|---|---|---|---|

Use current package scripts and test selectors. Name fixtures and the isolated
target. Mark commands as inspected or run. Use the shared verification strategy
for test selection; a test list is not an instruction to copy framework tests.

## Completion and blockers

Complete when each owned acceptance outcome has current sufficient evidence,
required checks pass, affected consumers work, and the worksheet records the
implementation and review result. Report unrun checks as unverified.

Name actual stop conditions and the affected work: missing product decision,
incompatible contract, missing write authority or unavailable safe test target.
A routine failure calls for diagnosis and a focused rerun. Source drift calls
for comparison and reconciliation; it does not cancel unaffected work.
```

## Review the handoff

Read the plan as an implementer. Can each outcome be built and proved without
inventing product behavior? Check paths, commands, dependencies, authority and
acceptance coverage. Remove sections that add no execution information.

Use the [worksheet contract](../../carta-module-development/references/module-execution-worksheet.md)
for state and handoff fields. Designate one existing index as the live owner;
an older `README.md` and `worksheet.md` must not hold competing status tables.
Keep superseded decisions and failed checks identifiable in their reports.

Use the [verification strategy](../../carta-module-development/references/verification-strategy.md)
for evidence freshness and the smallest sufficient checks. A plan-only request
ends with the plan; an authorized implementation continues without another gate.
