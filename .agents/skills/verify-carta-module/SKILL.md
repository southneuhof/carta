---
name: verify-carta-module
description: Perform read-only acceptance verification for one complete Carta feature or bounded plan. Compare the approved business design, plans, semantic diff, current repository contracts, focused evidence, and UI reports when applicable.
---

# Verify Carta module

Verify one complete complex feature or one bounded plan. Do not implement fixes
or edit source, designs, plans, worksheets, manifests, checklists, or indexes.
Standard ignored test output is allowed. Do not run a production command or an
irreversible external operation.

The Carta parent runs this skill itself after implementation and semantic
handoff. Do not delegate verification or start a verifier subagent. An
implementer supplies evidence, not a verdict.

## Verdicts

Return exactly one verdict:

- `PASS`: every applicable acceptance row matches the approved design and has
  current direct implementation and focused evidence.
- `REWORK`: the result is wrong or incomplete, and the correction is inside an
  approved plan scope.
- `BLOCKED`: a required decision, dependency, environment, authority, or
  evidence source is missing or contradictory.

Only `PASS` permits the Carta parent to mark the feature and plans `DONE`.

## Required inputs

Read these before judging the result:

1. Repository instructions and current working-tree state.
2. Approved `plans/<feature>/design.md`.
3. Feature `worksheet.md`, including discovery evidence, classification, plan
   map, acceptance ownership, semantic handoff, and current state.
4. Every numbered plan, local execution worksheet, dependency, scope, planned
   commit, command report, and done criterion.
5. The complete shared acceptance matrix for a complex feature or scoped
   checklist for a bounded plan.
6. `module.json` and scaffolder reports for a bounded feature.
7. The complete in-scope diff and every current repository owner or direct
   consumer needed to interpret it.
8. Focused test, lint, type, build, migration, fixture, integration, or other
   command evidence named by the plans.
9. Focused UI test source and reports when the design owns UI acceptance rows.
10. The parent `Semantic handoff` map.

If a required input is missing, return `BLOCKED`. Do not recreate a design
decision from memory.

Read the Carta acceptance reference before verification:
[module-acceptance-checklist.md](../carta-module-slice/references/module-acceptance-checklist.md).

## Worksheet gate

Before source review, confirm:

- design status is `Approved` and open decisions are `None`;
- feature classification is `bounded` or `complex` with evidence;
- every plan is named and has one local execution worksheet;
- every complex acceptance row belongs to exactly one plan;
- the bounded plan contains its complete scoped checklist;
- every plan state is `IMPLEMENTED`;
- feature state is `VERIFY`;
- no step is `TODO`, `ACTIVE`, `REWORK`, or `BLOCKED`;
- each completed step has a path, command report, or UI report;
- semantic handoff maps every row to direct implementation and focused
  evidence; and
- the worksheet contains no silent design or plan change.

Return `BLOCKED` with the exact missing or inconsistent field when this gate
fails. Do not repair it.

## 1. Scope and drift

- Run each plan drift check and compare its current-state evidence with the
  live repository.
- Compare the union of plan in-scope paths with the actual feature diff.
- Record unrelated pre-existing changes and exclude them from evidence.
- Confirm each changed file maps to one approved plan step and acceptance row.
- Confirm no compatibility path, shared framework change, production action,
  or external write exists without explicit design and plan approval.
- Confirm the current implementation shape still supports the bounded or
  complex classification.

An unexplained source change is `REWORK`. Unresolved drift that prevents a
sound judgment is `BLOCKED`.

## 2. Business design parity

Compare implementation with the approved design, not with summaries. Check:

- business purpose and scope;
- actors, authentication, authorization, and denied behavior;
- entry points, navigation, deep links, and return paths;
- actions and user flows;
- names, labels, fields, order, defaults, required state, and hidden state;
- data ownership, relationships, and invariants;
- state transitions, atomic behavior, and repeated execution;
- loading, empty, validation, denied, failure, retry, and reload behavior;
- files, exports, background work, and integrations when applicable; and
- every explicit out-of-scope boundary.

An intentional difference must be approved in the design or decision ledger.
Otherwise, return `REWORK`.

## 3. Repository contract paths

Discover the current repository stack and comparable patterns. Trace at least
one representative read, one write, and every high-risk custom flow through
all applicable owners:

```text
business input or stored state
→ trust-boundary validation and access
→ domain or service behavior
→ integration or client operation
→ visible or externally observable result
→ refresh, persistence, or emitted effect
```

Confirm:

- names, identifiers, and value shapes stay canonical;
- the owning boundary supplies relation meaning and display metadata;
- authorization remains authoritative outside the UI;
- approved writes protect invariants and return an approved result;
- successful writes refresh every affected read owner;
- current repository error and recovery patterns are used;
- project-local layer skills and repository instructions were applied; and
- shared framework work exists only when explicitly approved.

Read these Carta references when their concerns apply:

- [contract-rules.md](../carta-module-slice/references/contract-rules.md)
- [frontend-field-contract.md](../carta-module-slice/references/frontend-field-contract.md)
- [web-query-cache.md](../carta-module-slice/references/web-query-cache.md)

## 4. Focused checks and reports

Use a valid recorded report when it matches the current commit and relevant
working-tree state. Rerun the narrowest repository-native focused check only
when its report is missing, stale, failed, or does not cover an acceptance row.

Do not substitute a broad suite for missing focused evidence unless a focused
failure proves cross-feature risk or the user asks for the broad suite. Record
the reason.

For a bounded feature:

1. validate `module.json` with `scaffold_bounded.py --check`;
2. read every command report and `summary.json`;
3. compare reported commands with the approved plan and current repository;
4. confirm command order stopped on any failure; and
5. inspect generated or changed source semantically.

A command report reduces repeated execution. It does not prove that the result
matches the business design.

Use only local, test, or approved development data. Return `BLOCKED` before a
production or irreversible command.

## 5. UI evidence

When the design owns UI acceptance rows, read
[ui-automation.md](../carta-module-slice/references/ui-automation.md), the
focused test source, and the preserved reports.

Confirm the report records the exact command, commit, relevant working-tree
state, named steps, result, and artifact paths. Map every UI row to a named
passing step. Inspect failure screenshots, traces, videos, or logs when a
focused run fails.

Rerun only the focused feature journey when evidence is stale or incomplete.
Never convert a failed result to `PASS` without a fresh passing report.

A feature with no UI row records `UI: NOT NEEDED` with its design evidence.

## 6. Semantic handoff audit

Independently check every handoff row. Confirm that its cited implementation
exists, supplies the claimed business behavior, and is covered by the cited
focused evidence. The parent handoff result, implementer summary, clean diff
check, and passing commands are inputs, not proof.

Return `REWORK` for a wrong in-scope result. Return `BLOCKED` for missing or
contradictory evidence that cannot be safely recreated.

## Output

Return:

```text
VERDICT: PASS | REWORK | BLOCKED
FEATURE: <feature folder>
CLASSIFICATION: bounded | complex
DESIGN: <path and approval status>
PLANS: <paths and states>
SCOPE: <diff and drift result>
BUSINESS: <parity result>
ACCESS: <authentication and authorization result or NOT NEEDED>
CONTRACT: <repository path result>
CHECKS: <commands, reports, and results>
HANDOFF: <semantic handoff audit>
UI: <report and journey result or NOT NEEDED>
EVIDENCE: <matrix, checklist, paths, and line references>
WORKSHEET: <state and unresolved item result>
REWORK: <exact owning plan and correction, or None>
BLOCKER: <exact blocker, or None>
```

Do not edit lifecycle state. After `PASS`, the Carta parent records the verdict
and changes the feature and plan states to `DONE`.
