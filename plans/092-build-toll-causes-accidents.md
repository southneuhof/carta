# Plan 092: Build toll causes accidents

Status: BLOCKED

Planned at: `f8c3f7e`

Design: `docs/superpowers/specs/2026-08-20-toll-causes-accidents-design.md`

## Evidence and contract

- Legacy owner: `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/toll-causes-accidents/toll-causes-accidents.vue`.
- Legacy config: `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/toll-causes-accidents.ts`.
- Legacy model: `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/TollCausesAccidents.php`.
- Legacy data: `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/seeders/S54TollCausesAccidentsSeeder.php`.
- Legacy title: `Faktor Kecelakaan`.
- Legacy category labels and codes: `Pengemudi/driver`, `Kendaraan/vehicle`, `Jalan/road`, `Lingkungan/environment`.
- Domain fields: `categoryCode`, `name`, `code`, `description`, `active`.
- Owner: the module owns the cause table and fixed category reference table. No child rows.
- Realm and permissions: `system`; `view`, `list`, `detail`, `create`, `update`, `delete` for `toll-causes-accidents`.
- Web reuse: `ListView`, `DetailView`, `FormView`, `ChipFilter`, `defineFields`, and the standard master-data route pattern.
- Reference display: `categoryCode` remains the form/write field; the backend returns nested `category` data; computed `category` is the list/detail field and reads `category.name`.
- Gap: none approved. Category CRUD is out of scope; the category select uses fixed reference values.

## Evidence ledger

| Question | Evidence | Result | Status |
|---|---|---|---|
| Identity and fields | Legacy model `TollCausesAccidents.php:17-134`; migrations `2025_01_05_124339_create_toll_causes_accidents_categories.php` and `2025_01_05_124700_create_toll_causes_accidents.php` | `categoryCode`, `name`, nullable `code`, `description`, `active`, audit fields | FOUND |
| Legacy labels and behavior | Legacy config `toll-causes-accidents.ts:2-4`; legacy surface `toll-causes-accidents.vue:19-33` | Title `Faktor Kecelakaan`; category-filtered standard CRUD | FOUND |
| Relation or child owner | Legacy model `TollCausesAccidents.php:95-106,135-145` | Category reference only; no owned child rows | FOUND |
| Lookup consumer or dependency | Legacy module surface and model | No lookup consumer found | NOT NEEDED |
| Workflow or custom write | Legacy model `TollCausesAccidents.php:148-176`; shared CRUD surface | None | NOT NEEDED |
| API permission realm and verbs | Current authorization catalog and route `toll-causes-accidents.ts:9-13` | `system`; view, list, detail, create, update, delete | FOUND |
| Route and navigation owner | Legacy menu; current `navigation.ts`; current route map | `/master-data/toll-causes-accidents`, title `Faktor Kecelakaan`, section `Road Traffic Safety` | FOUND |
| Seed and reload requirement | Legacy seeder `S54TollCausesAccidentsSeeder.php:17-201`; current seed `toll-causes-accidents.seed.ts:5-33` | Four categories, 25 causes, stable IDs, idempotent upsert | FOUND |
| Framework or UI gap | Architecture, framework README, nearest master-data route, surface-reuse rules | Standard framework surfaces fit; no gap | NOT NEEDED |

## Field and route matrix

| Field | Legacy label | Create/update | List/detail | Renderer | Server supplied |
|---|---|---:|---:|---|---:|
| `categoryCode` | `Kategori` | yes | no | fixed select | no |
| `category` | `Kategori` | no | yes | computed `read` projection | backend relation `category.name` |
| `name` | `Nama` | yes | yes | text | no |
| `code` | `Kode` | yes | yes | text | no |
| `description` | `Deskripsi` | yes | yes | textarea | no |
| `active` | `Status` | yes | yes | switch | default true |
| audit fields | — | no | no | none | yes |

| Surface | New route/action | Permission | Result |
|---|---|---|---|
| List entry and row | `/master-data/toll-causes-accidents`; standard View/Edit/Delete | matching `view`, `list`, `detail`, `update`, `delete` permissions | PASS: browser and resource tests |
| Detail | `/:tollCausesAccidentsId/detail`; `DetailView` | `detail-*` | PASS: browser |
| Create | `/create`; `FormView` | `create-*` | PASS: browser |
| Edit | `/:tollCausesAccidentsId/edit`; `FormView` | `update-*` | PASS: browser |
| Child/workflow | none | none | NOT NEEDED |

## Label ledger

| Surface | Legacy | New | Status |
|---|---|---|---|
| Page/list heading | `Faktor Kecelakaan` | same | PASS |
| Filter | `Pengemudi`, `Kendaraan`, `Jalan`, `Lingkungan` | same order and default | PASS |
| Fields | `Kategori`, `Nama`, `Kode`, `Deskripsi`, `Status` | same | PASS |
| Create/detail/edit headings | shared CRUD pattern | `Tambah Faktor Kecelakaan`, `Detail Faktor Kecelakaan`, `Ubah Faktor Kecelakaan` | APPROVED DIFFERENCE: repository standard titles |
| Validation/delete chrome | shared CRUD behavior | framework standard messages and dialog | APPROVED DIFFERENCE: framework behavior |

## Scope

In scope:

- API entity, migration, validation, filtered list, permissions, seed, and focused route test.
- Web schema, resource, list filter, CRUD routes, navigation, route map integration, and focused resource/integration tests.
- Module-scoped verification, authenticated browser acceptance, and independent verifier.

Out of scope:

- Category CRUD UI or compatibility endpoints.
- Framework package changes.
- Package-wide test runs unless a focused failure proves cross-module risk.

## Ordered implementation

1. Add the database entity and migration for fixed categories and causes. Add the seed owner with all four categories and 25 legacy causes.
2. Add the authorization catalog entry and register the domain/model in the API route composition root. Add `categoryCode` list filtering and category validation.
3. Add the web schema/resource and standard routes. Use the backend `category` relation for display, the fixed category select for writes, and `ChipFilter`; preserve exact legacy labels and default filter.
4. Add navigation and route integration. Use generated route-map updates only through the repository route generation command if required.
5. Run focused API and web tests, type check, lint, and `git diff --check`.
6. Run the authenticated browser journey with a marked temporary cause, reload after create/update/delete, and confirm removal.
7. Run `$verify-ads-hk-module`; only `PASS` closes this plan.

## Acceptance checklist

- [x] API list requires authentication and `list-toll-causes-accidents`.
- [x] API detail requires `detail-toll-causes-accidents`.
- [x] API create, update, and delete require their matching permissions.
- [x] API rejects an unknown category code.
- [x] API list filters by `categoryCode`.
- [x] API trims text values and rejects duplicate non-null codes.
- [x] Seed contains the four exact categories and all 25 legacy causes.
- [x] Web list route is `/master-data/toll-causes-accidents`.
- [x] Web list uses `ListView` and `ChipFilter`.
- [x] Reference field separates `categoryCode` form/write data from computed `category` list/detail display; raw category codes are not shown.
- [x] Filter labels and order are exact; default is `Pengemudi`.
- [x] Web detail, create, and edit routes use standard view shells.
- [x] Form includes `Kategori`, `Nama`, `Kode`, `Deskripsi`, and `Status`.
- [x] Navigation title is `Faktor Kecelakaan` under `Road Traffic Safety`.
- [x] Resource permissions and route targets are correct.
- [x] First load, filter change, create, update, detail, reload, and delete pass in the authenticated browser.
- [x] Focused API and web checks pass.
- [ ] Type check, lint, and `git diff --check` pass. API type-check, focused lint, and diff check pass; web type-check is blocked by `TS2590` in unchanged `packages/is-vue-framework/src/components/views/{DetailView,FormView,ListView}.vue`.
- [ ] Independent verifier returns `PASS`; currently `BLOCKED` by the web type-check result.

## Stop conditions

Stop and report if the current database migration state, permission catalog,
route-map generator, or legacy labels disagree with this plan. Do not invent a
new category owner, endpoint, or compatibility path.

## Machine reports

Record fresh module-scoped check and run reports here after execution:

- Check-only report: focused API route test 2/2; focused web resource/integration tests 3/3; API type-check PASS; focused API lint PASS; `git diff --check` PASS. No bounded-manifest report applies to this full-path module.
- Run report: local development migration PASS; local seed PASS; test database migration PASS.
- Browser evidence: authenticated `http://localhost:5173/master-data/toll-causes-accidents`; list and detail show `Pengemudi`/`Kendaraan` instead of raw `driver`/`vehicle`; temporary row `37f76449-0505-4d5d-8d53-1073dbec0d5b` was created, shown in detail, changed from `driver` to `vehicle`, reloaded, deleted through the confirmation dialog, and absent after reload.
- Independent verifier: BLOCKED by the unchanged framework web type-check errors listed above.

## Reused, searched, gap

Reused: `ListView`, `DetailView`, `FormView`, `ChipFilter`, `defineFields` computed `read` projections, `defineResource`, the standard master-data route pattern, API entity/route/seed patterns, and generated route-map integration.

Searched: web architecture, framework README, surface-reuse rules, nearest route/resource/tests, legacy config/model/migrations/seeder/menu/surface, current API route/entity/authorization/seed owners, and current web route/resource/navigation owners.

Gap: none. Framework type-check failure is outside this module and framework code was not changed.

## Independent verifier report

VERDICT: BLOCKED  
MODULE: `toll-causes-accidents`  
PLAN: `plans/092-build-toll-causes-accidents.md`  
DESIGN: `docs/superpowers/specs/2026-08-20-toll-causes-accidents-design.md`  
LEGACY: `/Users/gamer/Documents/projects/ads-hk-legacy`; model, migrations, seeder, config, menu, and shared CRUD surface  
PARITY: PASS; exact title, four categories, 25 causes, fields, filter behavior, navigation, and standard CRUD match  
CONTRACT: PASS; migration, authenticated API, resource, four routes, and separate reference display/write fields align  
LABELS: PASS; legacy labels match; repository-standard form headings and framework chrome are recorded approved differences  
CHECKS: focused API 2/2, web 4/4, API type-check, focused API lint, migration, seed, and diff check PASS; web type-check BLOCKED by `TS2590` in unchanged framework files  
BROWSER: `http://localhost:5173/master-data/toll-causes-accidents`; authenticated list, category filter, create, detail with category name, edit, category update, reload, delete, and post-delete reload PASS; temporary row `37f76449-0505-4d5d-8d53-1073dbec0d5b` removed  
EVIDENCE: evidence ledger, field/route matrix, label ledger, focused tests, current API/web files, legacy direct files, and browser journey above  
REWORK: None  
BLOCKER: repository web type-check fails in unchanged `packages/is-vue-framework/src/components/views/DetailView.vue:39`, `FormView.vue:59`, and `ListView.vue:113` with `TS2590`; framework changes require approval.
