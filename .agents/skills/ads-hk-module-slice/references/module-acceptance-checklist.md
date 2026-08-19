# Module acceptance checklist

Copy this checklist into the selected plan or task notes before editing. Fill
the direct evidence paths, results, and statuses. Do not report completion
while a required item is `TODO`, `REWORK`, `STOP`, or `BLOCKED`.

Use these statuses: `TODO`, `PASS`, `APPROVED DIFFERENCE`, `SERVER SUPPLIED`,
`NOT NEEDED`, `REWORK`, `STOP`, and `BLOCKED`.

## 1. Scope and evidence

- [ ] Module name, shape classification, and owned relations are recorded.
- [ ] The discovery evidence ledger is copied: `<path>`.
- [ ] Selected plan or design is read: `<path>`.
- [ ] Direct legacy owner evidence is read: `<paths>`.
- [ ] Current owner or direct route evidence is read when it exists: `<paths>`.
- [ ] Legacy list, detail, create, edit, and workflow surfaces needed by the
      contract are read: `<paths>` or `NOT NEEDED` with a reason.
- [ ] User-facing labels are inventoried for required fields, headings,
      actions, lookups, dialogs, validation, and workflow messages: `<paths>`.
- [ ] One sibling is read only when a concrete pattern gap required it:
      `<paths>` or `NOT NEEDED` with the reused pattern.
- [ ] Every difference is `PASS`, `APPROVED DIFFERENCE`, `SERVER SUPPLIED`,
      `NOT NEEDED`, or `STOP`.

## 1a. Evidence ledger

| Question | Evidence path and symbol/line | Result | Status |
|---|---|---|---|
| Identity and fields | `<path:line>` | `<answer>` | TODO |
| Legacy labels and behavior | `<path:line>` | `<answer>` | TODO |
| Relation or child owner | `<path:line>` | `<none/owner>` | TODO |
| Lookup consumer or dependency | `<path:line>` | `<none/owner>` | TODO |
| Workflow or custom write | `<path:line>` | `<none/action>` | TODO |
| API permission realm and verbs | `<path:line>` | `<answer>` | TODO |
| Route and navigation owner | `<path:line>` | `<answer>` | TODO |
| Seed and reload requirement | `<path:line>` | `<answer>` | TODO |
| Framework or UI gap | `<path:line>` | `<none/gap>` | TODO |

For a bounded manifest module, the scaffold JSON result and static verifier
report may provide the generated-path and route evidence. The acceptance
matrix and browser gate still remain required.

## 2. Route and action matrix

| Surface | Legacy evidence | New route/action | Permission realm | Reused pattern | Result/evidence | Status |
|---|---|---|---|---|---|---|
| List entry | `<path:line>` | `<route>` / `<action>` | `<system/project>` | `<component/module>` | `<test/browser>` | TODO |
| List row | `<path:line>` | `<route>` / `<action>` | `<system/project>` | `<component/module>` | `<test/browser>` | TODO |
| Detail | `<path:line>` | `<route>` / `<action>` | `<system/project>` | `<component/module>` | `<test/browser>` | TODO |
| Child row | `<path:line>` or `NOT NEEDED` | `<route>` / `<action>` | `<system/project>` | `<component/module>` | `<test/browser>` | TODO |
| Create form | `<path:line>` | `<route>` / `<action>` | `<system/project>` | `<FormView>` | `<test/browser>` | TODO |
| Edit form | `<path:line>` | `<route>` / `<action>` | `<system/project>` | `<FormView>` | `<test/browser>` | TODO |

Add rows for domain workflow actions. Keep actions on their intended surface.
For each workflow row, record the expected state transition and submitted
payload in `Result/evidence`. Do not remove an action from another surface
because it has the same label.

## 2a. User-facing label ledger

Copy labels exactly. Preserve capitalization, punctuation, singular/plural
form, terminology, and visible validation or workflow text. Do not translate,
shorten, improve, or invent a synonym. An unapproved mismatch is `REWORK`.
If no legacy reference is in scope, mark the rows `NOT NEEDED` and use the
approved design labels.

| Surface or field | Legacy evidence | Legacy label | New label | Status |
|---|---|---|---|---|
| Field | `<path:line>` | `<exact text>` | `<exact text>` | TODO |
| Page or table heading | `<path:line>` | `<exact text>` | `<exact text>` | TODO |
| Standard action | `<path:line>` | `<exact text>` | `<exact text>` | TODO |
| Lookup or dialog | `<path:line>` | `<exact text>` | `<exact text>` | TODO |
| Validation or workflow message | `<path:line>` | `<exact text>` | `<exact text>` | TODO |

## 3. Contract and data checks

- [ ] Database, API schema, operation, resource, and route use the same field
      names.
- [ ] The client route tree and server registration produce one URL per
      custom action.
- [ ] Permission names and permission realms match the API.
- [ ] Server authorization is tested for an allowed and denied case.
- [ ] Required lookup sources use the owning resource list and detail.
- [ ] The field inventory covers API create/update, list, detail, renderer,
      source, and server-supplied values.
- [ ] User-facing labels match the legacy label ledger exactly, or the
      difference is approved in the design.
- [ ] The seed or fixture command, owner, expected records, and idempotence
      are recorded when the browser flow needs records, lookups, or child
      rows.
- [ ] The seed smoke check passes.

## 4. Workflow and UI checks

- [ ] Standard CRUD uses `ListView`, `DetailView`, and `FormView` or the
      documented framework surface.
- [ ] Every custom control has an exact recorded framework or sibling gap.
- [ ] Each workflow action has only the fields that action reads or writes.
- [ ] First load shows the expected records and hierarchy.
- [ ] Reload after create, update, and delete shows the expected records and
      hierarchy.
- [ ] Failed actions keep the required dialog or form state.
- [ ] Action labels, alignment, and placement match the sibling pattern.
- [ ] The UI result is verified in an authenticated Codex browser. If
      unavailable after a valid retry, set `BLOCKED` and record the reason.
- [ ] Browser evidence records the URL, surface, action, test data
      identifier, visible result, and failure message for each journey row.

## 5. Independent verification

- [ ] `$verify-ads-hk-module` reviewed the current plan, design or bounded
      manifest decision, scoped ledger, diff, legacy reference, checklist,
      checks, seed, and browser journey.
- [ ] Verifier verdict is `PASS`: `<date or evidence path>`.
- [ ] Verifier `REWORK` and `BLOCKED` items are resolved, or the plan remains
      open with the exact reason.

## 6. Final evidence

- [ ] Focused API tests pass.
- [ ] Focused web tests pass.
- [ ] Type check and lint pass.
- [ ] `git diff --check` passes.
- [ ] `Reused`, `Searched`, and `Gap` are reported.
- [ ] No unchecked item remains.
