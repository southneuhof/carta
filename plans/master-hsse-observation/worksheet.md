# Master HSSE observation worksheet

- State: `DONE`
- Feature: `master-hsse-observation`
- Modules: `master/hsse-observation`
- Grouping reason: Separate module. It has its own HSSE observation record, route, permissions, and acceptance flow.
- Folder: `plans/master-hsse-observation/`
- Design: `plans/master-hsse-observation/design.md`
- Active plan: `01-build-hsse-observation.md`
- Next action: Verify the dependent incident statement document config plan.
- Read boundary: Exact `hsse-observation` identifiers, direct legacy owner, and direct current owner.
- Write boundary: This worksheet only.
- Last result: `Independent acceptance verification returned PASS.`
- Last evidence: `apps/api/drizzle/20260820071331_empty_strong_guy/migration.sql; API 4/4 focused tests; web 11/11 focused tests; type-check and lint pass; browser ChipFilter and nested CRUD pass with cleanup.`
- Blocker: `None.`

## Discovery evidence ledger

| Question | Evidence path and symbol/line | Result | Status |
|---|---|---|---|
| Identity and fields | `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/migrations/2024_07_31_184437_create_finding_criteria.php:14-22`; `.../184510_create_finding_types.php:14-24`; `.../184524_create_finding_categories.php:14-23`; `.../184534_create_finding_cause.php:14-23` | Finding Criteria, Finding Types, Finding Categories, and Finding Causes. User confirmed the three dependent CRUD resources are in scope. | FOUND |
| Surface field placement and filters | `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/hsse-observation/hsse-observation.vue:11-30`; `.../layouts/FindingTypes.vue:14-109`; `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/qhsse-observations.tsx:51-59` | Legacy page filters Finding Types by `finding_criteria_code`, then owns nested Finding Categories and Finding Causes. The new page will use `ListView` + `ChipFilter` for that collection. | FOUND |
| Legacy labels and behavior | `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/qhsse-observations.tsx:11-32`; `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/hsse-observation/layouts/FindingTypes.vue:15-109`; `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/seeders/S20FindingCriteriaSeeder.php:15-85` | Exact labels include `Kriteria Temuan`, `Jenis Temuan`, `Kategori Penyebab`, `Penyebab`, `Negatif`, and `Positif`. Legacy page defaults to `Negatif`. | FOUND |
| Relation or child owner | `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/migrations/2024_07_31_184510_create_finding_types.php:16-17`; `.../184524_create_finding_categories.php:16`; `.../184534_create_finding_cause.php:16` | Finding Types reference Finding Criteria by code; Finding Categories reference Finding Types; Finding Causes reference Finding Categories. | FOUND |
| Lookup consumer or dependency | `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/qhsse-observations.tsx:145-187` | The reporting `qhsse-observations` flow consumes these lookup resources. | FOUND |
| Workflow or custom write | `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/hsse-observation/layouts/FindingTypes.vue:24-109` | Master configuration uses CRUD writes only; no state transition is owned by this page. | FOUND |
| API permission realm and verbs | `/Users/gamer/Documents/projects/ads-hk/apps/api/src/authorization/catalog.ts:1-80`; `apps/api/src/routes/tools-types/tools-types.ts:1-120`; `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/utils/auth.ts:5-34` | User requires legacy parity: do not use one shared `hsse-observation` permission family. Keep separate families for `finding-criteria`, `finding-types`, `finding-categories`, and `finding-cause`, plus the menu permission `hsse-observation`. | FOUND |
| Route and navigation owner | `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/menu.ts:130-138` | Navigation group `HSSE`; title `Kriteria Temuan Observation`; current route/resource owner is NOT FOUND. | FOUND |
| Seed and reload requirement | `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/seeders/S20FindingCriteriaSeeder.php:15-85` | Seed Finding Criteria and Finding Types; browser flow needs records after seed and reload. | FOUND |
| Framework or UI gap | `apps/web/src/routes/(authenticated)/master-data/projects/index.route.vue:1-31`; `packages/is-vue-framework/src/renderers/form.ts:82-110` | Standard `ChipFilter`, `ListView`, `DetailView`, `FormView`, lookup, and rich text surfaces exist. No framework gap found. | FOUND |

## Plan map

| Plan | Scope | Depends on | Status | Evidence |
|---|---|---|---|---|
| `01-build-hsse-observation.md` | API, permissions, seed, resource, nested routes, and acceptance | `None` | DONE | `design.md`, focused checks, browser, verifier PASS |

## Cross-plan blockers and decisions

- User decision: permission families must stay separate and match the legacy resource IDs.
- User approval: standard `ChipFilter` design and separate resource owners approved.
