# Plan 091: Implement emergency simulation tools

Status: DONE

Planned at: `0eff13fbcbd7d7b4bb277423914e6316cf418e6b`

Manifest: `plans/091-build-emergency-simulation-tools.module.json`

## Scope and evidence

Bounded standard CRUD. The legacy master model has `name`, `code`,
`description`, `active`, and audit fields with standard list, detail, create,
edit, and delete behavior. `emergency_simulation_tools_value` consumes this
resource from emergency simulations and is not an owned child write.

| Question | Evidence | Result | Status |
|---|---|---|---|
| Identity and fields | Legacy `EmergencySimulationTools.php:17-119`; migration `2024_09_03_095213_create_emergency_simulation_tools.php:14-22` | `id`, `name`, `code`, `description`, `active`, audit fields | FOUND |
| Legacy labels and behavior | Legacy `emergency-simulation-tools.ts:2-4`; `BaseCRUD.vue` route | Title `Perlengkapan Tanggap Darurat`; field `Nama`; standard CRUD | FOUND |
| Relation or child owner | Legacy `EmergencySimulationTools.php:121-132`; `EmergencySimulationToolsValue.php:95-101` | No owned child; values consume this resource | NOT NEEDED |
| Lookup consumer or dependency | Legacy `EmergencySimulations.php:323`; `EmergencySimulationToolsValue.php` | Emergency simulation values consume tool IDs | FOUND |
| Workflow or custom write | Legacy model custom hooks | None | NOT NEEDED |
| API permission realm and verbs | Manifest; current system permission pattern | Six `system` permissions | FOUND |
| Route and navigation owner | Legacy `menu.ts:159-163`; current navigation manifest | Master data route after employees; separator `Emergency Simulation` | FOUND |
| Seed and reload requirement | Legacy `S03EmergencySimulationToolsSeeder.php:14-62` | 10 stable names; idempotent seed | FOUND |
| Framework or UI gap | Current topics/employees routes; framework architecture | Standard `ListView`, `DetailView`, `FormView` | NOT NEEDED |

## Acceptance checkpoint

- [x] Generated API, web, migration, route, permission, and seed owners align.
- [x] Legacy field and page labels match exactly; framework differences are recorded.
- [x] API allowed and denied permission checks pass.
- [x] Seed runs twice and produces 10 records.
- [x] Standard list, detail, create, edit, delete, and reload work in browser.
- [x] Focused API and web checks pass.
- [x] API/web type checks and lint pass.
- [x] `git diff --check` passes.
- [x] `$verify-ads-hk-module` returns `PASS`.

## Machine reports

- Check-only: `plans/091-build-emergency-simulation-tools.verify.check-only.json`
- Run: `plans/091-build-emergency-simulation-tools.verify.run.json`

## Browser evidence

- URL: `http://localhost:5173/master-data/emergency-simulation-tools`
- Seeded rows: 10; visible list title, navigation entry, `Nama` header, row actions, and exact legacy names.
- Temporary row: `a0ff0fa5-eb41-43b4-b7bb-372a88cfb823`; create success `Berhasil menambahkan data!`; update success `Berhasil mengubah data!`; reload retained `Browser CRUD Check Updated`.
- Delete success: `Record deleted.`; post-delete reload with search showed `No data` and zero matching rows.

## Independent verifier report

VERDICT: PASS  
MODULE: `emergency-simulation-tools`  
PLAN: `plans/091-build-emergency-simulation-tools.md`  
DESIGN: bounded manifest decision in `plans/091-build-emergency-simulation-tools.module.json`  
LEGACY: `/Users/gamer/Documents/projects/ads-hk-legacy`; model, migration,
seeder, config, menu, shared CRUD, and value consumer  
PARITY: PASS; exact title, `Nama` field, navigation placement, 10 seed names,
and standard CRUD behavior match  
CONTRACT: PASS; migration, authenticated API, normalized resource, and four
standard routes align  
LABELS: PASS; standard framework delete dialog and `Record deleted.` message
are the documented framework behavior  
CHECKS: PASS; named machine reports, API 2/2, web 3/3, type checks, focused
lint, migration, two seed runs, integration check, and `git diff --check`  
BROWSER: PASS; authenticated list, create, detail, edit, update, reload,
temporary-row delete, post-delete reload, exact labels, navigation, and all 10
seed rows verified; temporary row `a0ff0fa5-eb41-43b4-b7bb-372a88cfb823`  
REWORK: None  
BLOCKER: None

## UI reuse record

- Reused: standard `ListView`, `DetailView`, `FormView`, `defineFields`, `defineResource`, and the emergency simulation topics/employees CRUD pattern.
- Searched: `docs/architecture/web-application-architecture.md`, `packages/is-vue-framework/README.md`, `.agents/skills/web-ui-surface-reuse/SKILL.md`, nearest route/resource/tests.
- Gap: None.
