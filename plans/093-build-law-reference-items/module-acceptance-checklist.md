# Module acceptance checklist

## 0. Execution worksheets

- [x] The feature folder contains `design.md` and `worksheet.md`.
- [x] The feature folder contains one related module group only.
- [x] The feature worksheet records the group members and grouping reason.
- [x] The feature worksheet contains the discovery ledger, plan map, dependency order, overall status, and cross-plan blockers.
- [x] The selected numbered plan contains the local execution worksheet.
- [x] The local worksheet records one feature, one plan, the design, planned SHA, state, active step, next action, boundaries, evidence, and blocker.
- [x] The local worksheet moved through `READY`, `EXECUTE`, `VERIFY`, and is now `DONE` after verifier `PASS`.
- [x] No implementation step is active.
- [x] Every completed step has path, command, or browser evidence.
- [x] API focused checks use `test:focused -- <spec>` and the test database migration.
- [x] No implementation step is `TODO`, `REWORK`, `STOP`, or `BLOCKED`.
- [x] The local worksheet was marked `DONE` only after verifier `PASS`.

## 1. Scope and evidence

- [x] Module name, shape, and owned relations are recorded.
- [x] List, detail, create, update, and filter field placement is recorded.
- [x] Discovery evidence is recorded in `worksheet.md`.
- [x] The selected plan and design are linked and read.
- [x] Direct legacy owner evidence is recorded.
- [x] Legacy list, create, edit, and workflow surfaces were read; no separate legacy detail surface exists.
- [x] User-facing labels are recorded in the plan ledger.
- [x] Work Items and framework tree/dialog patterns are recorded as the required sibling evidence.
- [x] Differences are either `PASS`, `SERVER SUPPLIED`, or `NOT NEEDED`.

## 1a. Evidence ledger

| Question | Evidence | Result | Status |
|---|---|---|---|
| Identity and fields | Legacy migration/model; `apps/api/src/routes/law-reference-items/law-reference-items.entity.ts` | Category and item fields match the approved design. | PASS |
| Surface field placement and filters | Legacy view/model; route/resource files | Tree fields, dialog fields, and category/type/level filters match. | PASS |
| Legacy labels and behavior | Legacy view lines 67-153; browser snapshot | Exact title, headings, labels, status text, and depth rule. | PASS |
| Relation or child owner | Legacy model lines 113-173; current Drizzle relations | Category and recursive parent relations are server-owned. | PASS |
| Lookup consumer or dependency | Legacy IBPRP paths; current flat list route | Filtered flat list remains available for a future consumer. | PASS |
| Workflow or custom write | Legacy tree view; approved design | Standard writes plus approved tree read and recursive soft delete. | PASS |
| API permission realm and verbs | `apps/api/src/authorization/catalog.ts`; route guards | System realm with six item permissions. | PASS |
| Route and navigation owner | Legacy menu; current manifest and route map | Master Data route under `Undang-Undang`. | PASS |
| Seed and reload requirement | Legacy category seeder; current seed script; browser reload | Three idempotent categories; reload after writes. | PASS |
| Framework or UI gap | Work Items route; framework components | No gap; no framework edit. | PASS |

## 2. Route and action matrix

| Surface | Legacy evidence | New route/action | Permission realm | Reused pattern | Result/evidence | Status |
|---|---|---|---|---|---|---|
| List entry | Legacy page/menu | `/master-data/law-reference-items` | system | Work Items route | Integration test and browser | PASS |
| List row | Legacy tree row actions | TreeTable row actions | system create/update/delete | Work Items | Browser | PASS |
| Detail | No separate legacy page | `GET /law-reference-items/detail/:id` | system detail | Standard API detail | API focused test | PASS |
| Child row | Legacy add child at levels 1-2 | TreeTable add-child action | system create | Work Items | Browser child create | PASS |
| Create form | Legacy modal | `POST /law-reference-items/create` | system create | DialogForm | API and browser | PASS |
| Edit form | Legacy modal | `PATCH /law-reference-items/update/:id` | system update | DialogForm | API and browser | PASS |
| Delete | Legacy confirmation | `DELETE /law-reference-items/delete/:id` | system delete | Work Items | API and browser recursive delete | PASS |

## 2a. User-facing label ledger

| Surface or field | Legacy evidence | Legacy label | New label | Status |
|---|---|---|---|---|
| Page heading | Legacy view | `Master Regulasi & Perundangan HSSE` | `Master Regulasi & Perundangan HSSE` | PASS |
| Tree heading | Legacy view | `Undang-Undang` | `Undang-Undang` | PASS |
| Name column | Legacy view | `Nama` | `Nama` | PASS |
| Type column | Legacy view | `Tipe` | `Tipe` | PASS |
| Status column | Legacy view | `Status` | `Status` | PASS |
| Create action | Legacy view | `Tambah` | `Tambah` | PASS |
| Active status | Legacy view | `Berlaku` | `Berlaku` | PASS |
| Inactive status | Legacy view | `Tidak Berlaku` | `Tidak Berlaku` | PASS |
| Root type | Legacy view | `Reference` | `Reference` | PASS |
| Root type | Legacy view | `Applicable` | `Applicable` | PASS |
| Help text | Legacy view lines 71-72 | Exact legacy help text | Exact legacy help text | PASS |

## 3. Contract and data checks

- [x] Database, API schema, operation, resource, and route use the same field names.
- [x] Client and server action paths are verified by API and browser requests.
- [x] Permission names and system realm match.
- [x] Allowed and denied authorization cases pass.
- [x] Category and parent relations are selected and returned by the backend.
- [x] Scalar category and parent fields remain the write contract; relation names use read projections.
- [x] Flat list supports category, type, and level filters.
- [x] Seed is idempotent and the three categories exist.
- [x] Soft-deleted records are absent from list, detail, and tree.
- [x] Focused API and web checks pass; the full web package type-check has a known unrelated framework union failure reproduced without this module.

## 4. Workflow and UI checks

- [x] The approved route-local tree surface uses `ChipFilter`, `TreeTable`, `DialogForm`, `Form`, and base components.
- [x] No custom framework control was added.
- [x] Root and child forms contain only their intended visible fields; child type is hidden.
- [x] First load shows the three categories and the default `Lingkungan` selection.
- [x] Root and child creation pass.
- [x] Level 3 ceiling and add-child guard pass in the API test.
- [x] Edit passes and reloads the tree.
- [x] Recursive delete passes and reload confirms no temporary records.
- [x] Failed writes keep the form open and show an error; the initial wrong-path check was corrected before final browser evidence.
- [x] Browser evidence records URL, surfaces, temporary names, results, and clean reload.

## 5. Independent verification

- [x] The selected plan state is `DONE`, all implementation steps are `PASS`, and no implementation step is active.
- [x] `$verify-ads-hk-module` reviewed the feature folder, design, plan, diff, legacy evidence, checklist, checks, seed, and browser journey.
- [x] Verifier verdict is `PASS`.
- [x] Any verifier `REWORK` or `BLOCKED` item is resolved.

## 6. Final evidence

- [x] Focused API tests pass.
- [x] Focused web tests pass.
- [x] API type-check and focused module web lint pass; the full web package type-check baseline failure is recorded.
- [x] Focused API lint passes.
- [x] `git diff --check` passes.
- [x] `Reused`, `Searched`, and `Gap` are reported.
- [x] No unchecked item remains.
