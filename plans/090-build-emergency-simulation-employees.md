# Plan 090: Implement emergency simulation employees

Status: DONE
Planned at: `646a340`
Manifest: `plans/090-build-emergency-simulation-employees.module.json`

## Scope and decision

`emergency-simulation-employees` is bounded standard CRUD. The legacy module
has one resource with one editable field, standard list/detail/create/edit/
delete behavior, no owned child, no workflow, and no custom write. It is a
lookup source for emergency simulations, which is allowed for this path.

API owner: `apps/api/src/routes/emergency-simulation-employees/`
Web owner: `apps/web/src/routes/(authenticated)/master-data/emergency-simulation-employees/`
Navigation: `master-data`, `Emergency Simulation`, after the topic entry.
Relation owner: none. Lookup consumer: emergency simulation employee values.
Permissions: six `system` permissions derived from the module slug.
Seed owner: `emergency-simulation-employees.seed.ts`, called by
`apps/api/scripts/seed.ts`; 11 legacy records, idempotent.

## Evidence ledger

| Question | Evidence | Result | Status |
|---|---|---|---|
| Identity and fields | Legacy model `EmergencySimulationEmployees.php:17,26-30,111-119`; migration `2024_09_03_095128_create_emergency_simulation_employees.php:14-22` | `id`, `name`, `code`, `description`, `active`, audit fields | FOUND |
| Legacy labels and behavior | Legacy config `frontend-ads-vuejs/src/app/configs/emergency-simulation-employees.ts:2-4`; shared CRUD view | Title `Karyawan Terlibat Simulasi Tanggap Darurat`; field `Nama`; standard CRUD | FOUND |
| Relation or child owner | Legacy model `EmergencySimulationEmployees.php:121-132`; employee-value model relation | No owned child; employee values consume this resource | NOT NEEDED |
| Lookup consumer or dependency | Legacy `emergency-simulations.tsx:255`; `EmergencySimulationEmployeeValue.php:95-101` | Lookup consumer exists; owner list remains standard | FOUND |
| Workflow or custom write | Legacy model `EmergencySimulationEmployees.php:109-140`; shared `BaseCRUD` view | None | NOT NEEDED |
| API permission realm and verbs | Manifest and current authorization catalog | `system`; view, list, detail, create, update, delete | FOUND |
| Route and navigation owner | Legacy menu `menu.ts:146-160`; current manifest navigation | `/master-data/emergency-simulation-employees`, after topics, title `Karyawan Terlibat` | FOUND |
| Seed and reload requirement | Legacy seeder `S02EmergencySimulationEmployeesSeeder.php:17-65` | 11 records; repeated seed updates by stable ID | FOUND |
| Framework or UI gap | Current topic sibling and framework architecture | `ListView`, `DetailView`, `FormView`; no gap | NOT NEEDED |

## Field and route matrix

| Field | Legacy label | Create/update | List/detail | Renderer | Server supplied |
|---|---|---:|---:|---|---:|
| `name` | `Nama` | yes | yes | text | no |
| `code` | — | nullable unique | no | none | no |
| `description` | — | nullable | no | none | no |
| `active` | — | default true | no | none | yes |
| audit fields | — | no | no | none | yes |

| Surface | New route/action | Permission | Result |
|---|---|---|---|
| List entry and row | `/master-data/emergency-simulation-employees`; standard View/Edit/Delete | `view-*`, `list-*`, `detail-*`, `update-*`, `delete-*` | PASS |
| Detail | `/:emergencySimulationEmployeeId/detail`; `DetailView` | `view-*` | PASS |
| Create | `/create`; `FormView` | `create-*` | PASS |
| Edit | `/:emergencySimulationEmployeeId/edit`; `FormView` | `update-*` | PASS |
| Child/workflow | none | none | NOT NEEDED |

## Label ledger

| Surface | Legacy | New | Status |
|---|---|---|---|
| Page/list heading | `Karyawan Terlibat Simulasi Tanggap Darurat` | same | PASS |
| Field | `Nama` | same | PASS |
| Create heading | standard CRUD title not explicit in legacy | `Tambah Karyawan Terlibat Simulasi Tanggap Darurat` | APPROVED DIFFERENCE: repository standard title pattern |
| Detail heading | standard CRUD title not explicit in legacy | `Detail Karyawan Terlibat Simulasi Tanggap Darurat` | APPROVED DIFFERENCE: repository standard title pattern |
| Edit heading | standard CRUD title not explicit in legacy | `Ubah Karyawan Terlibat Simulasi Tanggap Darurat` | APPROVED DIFFERENCE: repository standard title pattern |
| Submit and success | shared CRUD standard | `Submit`; `Berhasil menambahkan data!`; `Berhasil mengubah data!` | PASS |
| Validation/delete chrome | shared framework behavior | `Harus diisi!` / standard delete dialog | APPROVED DIFFERENCE: framework behavior |

## Acceptance checkpoint

- [x] Module, shape, ownership, legacy reference, and bounded decision recorded.
- [x] Evidence ledger and direct legacy owner recorded.
- [x] Identity, domain fields, server fields, labels, permissions, navigation, and seed are explicit in the manifest.
- [x] Database, API schema, operation, resource, and route field names align.
- [x] API authentication and allowed/denied permission checks pass.
- [x] Seed migration and two idempotent seed runs pass.
- [x] Standard `ListView`, `DetailView`, and `FormView` surfaces work.
- [x] Create, update, delete, and reload work in the authenticated Codex browser.
- [x] Focused API and web tests pass.
- [x] API and web type checks pass.
- [x] Focused API and web lint pass.
- [x] `git diff --check` passes.
- [x] Independent `$verify-ads-hk-module` verdict is `PASS`.

## Commands and evidence

```sh
pnpm scaffold:master-data --config /Users/gamer/Documents/projects/ads-hk/plans/090-build-emergency-simulation-employees.module.json --json
pnpm integrate:master-data --manifest /Users/gamer/Documents/projects/ads-hk/plans/090-build-emergency-simulation-employees.module.json --check
pnpm integrate:master-data --manifest /Users/gamer/Documents/projects/ads-hk/plans/090-build-emergency-simulation-employees.module.json --apply
pnpm verify:module --manifest /Users/gamer/Documents/projects/ads-hk/plans/090-build-emergency-simulation-employees.module.json --check-only
pnpm verify:module --manifest /Users/gamer/Documents/projects/ads-hk/plans/090-build-emergency-simulation-employees.module.json --run --with-seed
```

Focused evidence: API route test `2/2`; web resource and integration tests
`3/3`; API/web type checks pass; focused lint pass; development migration and
two seed runs pass. Browser: `http://localhost:5173/master-data/emergency-simulation-employees`;
seed IDs `emergency-simulation-employee-1` through `-11`; temporary browser
row was created, updated, deleted, and absent after reload.

Reused: `ListView`, `DetailView`, `FormView`, `defineFields`, `defineResource`,
the emergency simulation topics CRUD pattern, scaffold, guarded integration,
and route-map generation.

Searched: framework architecture, framework README, web surface reuse rules,
nearest route/resource/tests, legacy model/migration/seed/config/menu/shared
CRUD, API route/entity/seed/test, and current route/navigation owners.

Gap: None.

## Independent verifier report

VERDICT: PASS  
MODULE: `emergency-simulation-employees`  
PLAN: `plans/090-build-emergency-simulation-employees.md`  
DESIGN: bounded manifest decision in `plans/090-build-emergency-simulation-employees.module.json`  
LEGACY: `/Users/gamer/Documents/projects/ads-hk-legacy`; model, migration,
seeder, config, menu, shared CRUD view, and employee-value lookup consumer  
PARITY: PASS; exact legacy title, field, menu placement, 11 seed values, and
standard CRUD behavior match  
CONTRACT: PASS; migration, authenticated API, normalized resource, and four
standard routes align  
LABELS: PASS; repository-standard create/detail/edit headings and framework
validation/delete chrome are recorded approved differences  
CHECKS: manifest static PASS; API 2/2, web 3/3, API/web type checks, focused
lint, migration, two seed runs, and `git diff --check` PASS  
BROWSER: `http://localhost:5173/master-data/emergency-simulation-employees`;
authenticated list, create, detail, edit, update, reload, temporary-row
delete, post-delete reload, exact labels, navigation, and all 11 seeded rows
verified; temporary row `4b2b9e69-ab54-4bbc-9124-6ada10a0b1ad`  
EVIDENCE: manifest, acceptance checkpoint, generated-path report, current
API/web files, legacy direct files, and browser journey above  
REWORK: None  
BLOCKER: None
