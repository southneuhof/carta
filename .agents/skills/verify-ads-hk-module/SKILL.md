---
name: verify-ads-hk-module
description: Read-only acceptance verification for one ADS-HK module after implementation. Compare its scoped evidence, approved design or bounded manifest, Improve plan, legacy contract, database/API/resource/FormView path, acceptance checklist, seeded data, focused checks, and authenticated Codex browser flow.
---

# Verify ADS-HK module

Verify the observable result of one module. Do not implement fixes. Do not
edit source, plans, checklists, designs, or indexes. Do not trust the
implementation summary or test claims. The browser step may use temporary
local or development fixtures as defined below; this does not permit production
or irreversible business writes.

Use the selected plan's execution worksheet and evidence ledger as the read
boundary. Read additional files when the worksheet, ledger, or contract
requires them. Do not require unrelated siblings, every module file with a
shared prefix, or the full generator source when a simple module has a valid
machine report and direct generated paths.

## Verdicts

Return exactly one verdict:

- `PASS`: every required checklist item has evidence, focused checks pass, and
  the authenticated Codex browser journey matches the approved contract.
- `REWORK`: the result is wrong or incomplete, but the cause is inside the
  approved plan scope. List the exact file, behavior, evidence, and correction.
- `BLOCKED`: a required reference, dependency, seed, permission, environment,
  or browser check is unavailable or contradicts the plan. Do not guess.

Only `PASS` permits the module workflow to mark a plan `DONE`.

## Required inputs

Read these before judging the result:

1. Repository `AGENTS.md` and the selected Improve plan.
2. The approved design and its legacy reference for the full path, or the
   bounded manifest and recorded decision for a simple path.
3. The execution worksheet, copied `module-acceptance-checklist.md`, and
   discovery evidence ledger in the selected plan.
4. The plan's planned-at SHA, scope, dependencies, commands, and done
   criteria.
5. Current `git status`, the in-scope diff, database migration or schema,
   authenticated API, typed operation, resource, routes, and focused tests.
6. The direct legacy model, service, config, seed, menu, and surfaces that
   the matrix marks as required. Read list, detail, create, edit, and workflow
   surfaces when they define the contract; `NOT NEEDED` must have a reason.
7. For a bounded manifest module, the named JSON reports from
   `verify:module --check-only` and `verify:module --run`, when available.
   Record the report path and compare it with the in-scope diff before using
   it.

If a required input or evidence row is missing, return `BLOCKED`. Do not
recreate a missing design decision from memory.

## Worksheet gate

Before judging source or browser behavior:

- confirm the selected plan contains one execution worksheet;
- confirm its state is `VERIFY`, not `DONE` or an earlier phase;
- confirm exactly one module and plan are named;
- confirm all implementation steps are `PASS` and none is `TODO`, `ACTIVE`,
  `REWORK`, `STOP`, or `BLOCKED`;
- confirm each completed step has a path, command report, or browser result;
- confirm the worksheet does not contain a silent design or plan change.

If any worksheet requirement fails, return `BLOCKED` with the exact missing or
inconsistent field. Do not repair the worksheet during read-only verification.

## 1. Scope and drift

- Confirm plan dependencies are `DONE` before verifying the selected plan.
- Run the plan drift check and compare only the plan's in-scope paths.
- Record unrelated pre-existing changes. Do not use them as module evidence.
- Confirm no framework package changed without explicit approval.
- Confirm the evidence ledger supports the chosen simple or complex route.

An ambiguous or relation-backed module must not pass through the bounded
manifest path. A missing ledger row for a required decision is `BLOCKED`, not
an invitation to read unrelated files.

## 2. Legacy parity

Compare the implementation with direct legacy evidence, not a summary:

- entry paths and navigation;
- list, row, detail, child, create, edit, and workflow actions in scope;
- field names, labels, order, required state, hidden state, defaults, and
  server-supplied values;
- permission names, permission realms, and allowed or denied behavior;
- submitted payloads, state transitions, loading, empty, failure, first-load,
  and reload behavior.

Every difference must be `PASS`, `APPROVED DIFFERENCE`, `SERVER SUPPLIED`,
`NOT NEEDED`, `REWORK`, or `STOP` with a path and line or browser result.

Treat user-facing label differences as `REWORK` unless the design records an
approved difference. Check capitalization, punctuation, singular/plural form,
terminology, field labels, headings, table headings, action labels, lookup
labels, dialog labels, and visible validation or workflow text.

## 3. Contract path

Trace one representative field and one write through:

```text
database and migration
→ API schema and permission
→ typed operation and response normalisation
→ resource capability and field catalog
→ route and framework surface
```

Confirm:

- field names and identity are consistent at every layer;
- labels match the ledger or have an approved difference;
- client route-tree and server registration produce one URL per action;
- API authorization remains the authority and lookup sources use the owner;
- standard CRUD uses the resource and `ListView`, `DetailView`, or `FormView`;
- database-backed identifier relations or reference fields have a named nested
  relation in the API select schema and read responses, with the relation
  loaded by the backend; the web resource uses a write field for IDs/codes and
  a computed `read` field for list/detail names, without a frontend-only label
  fetch or map; raw IDs are not user-facing display values;
- custom actions have an approved reason, exact payload, visible fields, and
  route-local scope;
- create, update, delete, and workflow writes refresh expected data.

For `apps/web`, require the recorded `Reused`, `Searched`, and `Gap` evidence
and use `$web-ui-surface-reuse` as the review reference. Do not change
framework code or source during verification.

## 4. Checks and seed

Use the named machine report as command evidence. Do not rerun passing commands
only to reproduce them. Rerun the affected API checks, web checks, type check,
focused lint, or `git diff --check` only when the report is missing, stale,
failed, or does not cover a required risk. Use local or development data only.
If a command targets production or an irreversible external system, return
`BLOCKED`.

The API and web test commands must be module-scoped and must name the module's
spec files. Do not substitute a package-wide `test`, `test:unit`, or bare
`vitest run`. Run a full suite only when a focused failure shows cross-module
risk or the user asks for it, and record the reason.

For a bounded manifest module:

1. Read the named JSON result from `verify:module --check-only`.
2. Read the named JSON result from `verify:module --run`; use `--with-seed`
   only when the manifest has seed records.
3. If either report is missing or stale, run the missing command and save its
   JSON output before continuing.
4. Treat a failed static check, failed focused command, or failed repeated
   seed as `REWORK` when the cause is in plan scope.

These scripts reduce setup repetition. They do not replace this checklist,
legacy parity review, or the authenticated browser gate.

Before browser verification, run the idempotent seed or fixture command when
the flow needs records, lookups, or child rows. Confirm expected records and
identifiers. If the plan has no usable seed or fixture, return `BLOCKED`
unless the checklist records `SERVER SUPPLIED` with evidence.

## 5. Authenticated browser journey

Use the authenticated Codex browser. Confirm it is connected before navigating.
If it is unavailable, make one valid connection retry before reporting it
unavailable.

Run the exact journey in the checklist with seeded local data:

1. Open the intended entry path and confirm expected records and hierarchy.
2. Check list, row, detail, child, and workflow actions on their intended
   surfaces.
3. Open create and edit forms. Confirm labels, order, defaults, lookup
   behavior, required fields, and submitted values.
4. Run each approved workflow action. Confirm fields, payload, success,
   failure state, and refresh behavior.
5. Reload after create, update, delete, and workflow writes. Confirm the
   expected records and hierarchy remain correct.

Record the URL, surface, action, test-data identifier, visible result, and
failure message for each journey row. If the browser remains unavailable
after the retry, return `BLOCKED` with `UI UNVERIFIED`; automated checks do
not replace this gate.

For local or development CRUD verification, temporary fixtures required by the
approved journey are pre-authorized. Create only clearly marked temporary
records, keep their identifiers, update and reload them as required, delete
them after the check, and reload to confirm removal. Do not ask for confirmation
again. Do not mutate seeded/reference/existing-user records or perform an
irreversible business action.

## Output

Return this report:

```text
VERDICT: PASS | REWORK | BLOCKED
MODULE: <name>
PLAN: <path>
DESIGN: <path or bounded manifest decision>
LEGACY: <root and inspected direct evidence>
PARITY: <PASS, differences, or blockers>
CONTRACT: <PASS, differences, or blockers>
LABELS: <PASS, differences, or blockers>
CHECKS: <commands and results>
BROWSER: <URL, journey, result, or UI UNVERIFIED>
EVIDENCE: <ledger, checklist rows, and file:line references>
WORKSHEET: <state, step result, and unresolved item result>
REWORK: <exact correction, or None>
BLOCKER: <exact blocker, or None>
```

Do not mark the plan or module complete from this report. The calling module
workflow changes the worksheet state to `DONE` and updates the checklist and
plan index only after `PASS`.
