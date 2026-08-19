# Plan 083: Implement the permit-danger-source module

> **Implementation instructions**: Execute this plan only after Plan 082 is
> accepted. Follow the steps in order, run every verification command, and
> update this plan and `plans/README.md` only after the implementation review.
> Preserve unrelated dirty work. Do not change a framework package, add a
> compatibility route, or start Plan 084 during this execution.
>
> **Drift check (run first)**:
> `git diff --stat b1feb0f..HEAD -- apps/api/src/routes/permit-danger-source apps/api/src/routes/index.ts apps/api/src/authorization/catalog.ts apps/api/scripts/seed.ts apps/web/src/routes/'(authenticated)'/master-data/permit-danger-source apps/web/src/manifest/navigation.ts apps/web/src/routes/'(authenticated)'/master-data/index.route.vue apps/web/src/router/__tests__/routes.spec.ts apps/web/src/manifest/__tests__/manifest.spec.ts packages/is-vue-framework`
> Plan 082 is an expected dependency. Compare its completed shared-file edits
> with the live code; stop only for an unexpected contract or unrelated edit.

## Status

- **Result**: DONE
- **Verified**: 2026-08-19 by authenticated Codex browser journey and read-only module verification (`PASS`)
- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: `plans/082-build-permit-work-types.md`
- **Category**: direction
- **Planned at**: commit `b1feb0f`, 2026-08-19

## Why this matters

The application has no current standard CRUD surface for the legacy `Sumber
Bahaya` master data. This plan adds the authenticated API, resource, routes,
permissions, and seed data while keeping the exact legacy labels and the
twenty approved names. The API keeps the hidden nullable `code` and audit
fields, while the user form exposes only the legacy `name`, `description`, and
`active` fields.

## Current state and authoritative contract

The approved decision record is
`docs/superpowers/specs/2026-08-19-permit-danger-source-design.md`. It is the
authority for the field matrix, labels, routes, permissions, seed values, and
exclusions. Do not copy its seed list into this plan; read that file before
implementation and use its exact values.

Legacy evidence to inspect before source edits:

- `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/permit-danger-source.ts` — page title `Sumber Bahaya`, menu key, and visible field order.
- `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/permit-danger-source/permit-danger-source.vue` — legacy list entry surface.
- `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/PermitDangerSource.php` — model fields, validation, and CRUD permissions.
- `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/migrations/2024_12_23_053942_create_permit_danger_source.php` — table shape and defaults.
- `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/seeders/S49PermitDangerSourceSeeder.php` — exact seeded identities and names.
- `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/menu.ts` — `Work Permit` placement and menu vocabulary.
- The shared legacy CRUD files `BaseCRUD.ts`, `CRUDList.vue`, `CRUDDetail.vue`, `CRUDCreate.vue`, `CRUDUpdate.vue`, and `components/composites/Form.vue` — exact headings, field labels, active options, submit text, success text, and validation text.

Current repository exemplars already read for this plan:

- `apps/api/src/routes/business-categories/business-categories.entity.ts` and `.ts` — colocated entity, authenticated permissions, standard CRUD, and delete validation.
- `apps/api/src/routes/permit-work-types/` and `apps/api/src/routes/index.ts` — the first permit module and registration shape. Plan 082 owns its work-type table; do not duplicate it.
- `apps/web/src/routes/(authenticated)/master-data/business-categories/` — schema-bound resource, field catalog, standard route shells, and resource test.
- `apps/web/src/routes/(authenticated)/master-data/pts-work-categories/` — minimal form field projection.
- `apps/web/src/manifest/navigation.ts`, `apps/web/src/routes/(authenticated)/master-data/index.route.vue`, `apps/web/src/router/__tests__/routes.spec.ts`, and `apps/web/src/manifest/__tests__/manifest.spec.ts` — navigation and route test owners.
- `apps/web/src/framework/hono/actions.ts`, `apps/web/src/framework/adapters/data/normalize.ts`, `apps/web/src/framework/inputs/registry.ts`, and `packages/is-vue-framework/src/resources/actionResource.ts` — typed operations, normalized responses, renderer sources, and route targets.

Pattern anchors to compare during the drift check:

- `apps/api/src/routes/business-categories/business-categories.ts:28-40` uses `defineDomainPart`, `defineModel({ path, entity, routes })`, and per-operation `authenticated()` plus `requirePermission()`.
- `apps/web/src/routes/(authenticated)/master-data/business-categories/business-categories.resource.ts:7-42` uses `createHonoResourceActions`, one `defineFields` catalog, `defineResource`, and named list/detail/create/update routes.
- `apps/web/src/routes/(authenticated)/master-data/business-categories/index.route.vue:1-5` is the standard `ListView` shell.
- `apps/web/src/manifest/navigation.ts:29-43` owns the current master-data route list; `packages/is-vue-framework/src/resources/actionResource.ts:38-40,104-150` defines named action targets and permissions.

Match the current repository path:

```text
database and migration
→ authenticated API and permission
→ normalized Hono operation
→ schema-bound resource and fields
→ ListView / DetailView / FormView
→ focused tests and authenticated browser check
```

`FormView` owns `submitLabel` and `successMessage`; resource action
declarations do not. If the exact legacy `Submit` or success text is required,
pass it on the route wrapper without changing `packages/is-vue-framework`.

## Ownership and contract inventory

- Backend owner: `apps/api/src/routes/permit-danger-source/`.
- Web owner: `apps/web/src/routes/(authenticated)/master-data/permit-danger-source/`.
- Navigation group: `master-data`, below the legacy `Work Permit` separator,
  exact title `Sumber Bahaya`.
- Relation owner: none. This module has no approved child or lookup relation.
- API route base: `/permit-danger-source`.
- Web routes:
  `/master-data/permit-danger-source`,
  `/master-data/permit-danger-source/create`,
  `/master-data/permit-danger-source/:permitDangerSourceId/detail`, and
  `/master-data/permit-danger-source/:permitDangerSourceId/edit`.
- Permission realm: `system`.

| Field | Legacy label | API create | API update | List/detail | Form renderer | Source | Server supplied |
|---|---|---:|---:|---:|---|---|---|
| `name` | `Nama` | required | editable | visible | `text` | user | no |
| `description` | `Deskripsi` | optional | editable | visible | `textarea` | user | no |
| `active` | `Status` | default `true` | editable | visible | `radio` | `Aktif`, `Tidak Aktif` | default only |
| `code` | `Kode` | nullable, unique | nullable, unique | API only | none | API client | no |
| audit fields | legacy audit fields | server | server | hidden | none | identity/time | yes |

API actions use the standard paths and exact permissions:

| Operation | Method and path | Permission |
|---|---|---|
| list | `GET /permit-danger-source/list` | `list-permit-danger-source` |
| detail | `GET /permit-danger-source/detail/:id` | `detail-permit-danger-source` |
| create | `POST /permit-danger-source/create` | `create-permit-danger-source` |
| update | `PATCH /permit-danger-source/update/:id` | `update-permit-danger-source` |
| delete | `DELETE /permit-danger-source/delete/:id` | `delete-permit-danger-source` |

The authorization catalog module is `permit-danger-source`, realm `system`,
with exactly `view-`, `list-`, `detail-`, `create-`, `update-`, and `delete-`
permissions for that module. The seed flow must upsert the exact design rows
by stable IDs and make a second run produce no duplicates.

## Route and action matrix

| Surface | Legacy evidence | New route/action | Permission | Reused pattern | Result/evidence | Status |
|---|---|---|---|---|---|---|
| List entry | config and legacy menu | `/master-data/permit-danger-source`, `resource.list()` | system `view-` / `list-` | `ListView`, business-categories | route test, manifest test, authenticated browser | PASS |
| List row | generic legacy CRUD list | detail, edit, delete row actions | system detail/update/delete | standard resource row targets | resource test and authenticated browser | PASS |
| Detail | generic legacy detail | `/:permitDangerSourceId/detail`, `resource.detail()` | system `view-` / `detail-` | `DetailView` | route test, resource test, authenticated browser | PASS |
| Create form | generic legacy create | `/create`, `resource.create()` | system `create-` | `FormView` | resource test and authenticated browser | PASS |
| Edit form | generic legacy edit | `/:permitDangerSourceId/edit`, `resource.update()` | system `update-` | `FormView` | resource test and authenticated browser | PASS |
| Child row | no child surface | not applicable | — | — | `NOT NEEDED` | NOT NEEDED |

### User-facing label ledger

| Surface | Legacy label | New label | Status |
|---|---|---|---|
| Page/list heading | `Sumber Bahaya` | `Sumber Bahaya` | PASS |
| Detail heading | `Detail Sumber Bahaya` | `Detail Sumber Bahaya` | PASS |
| Create heading | `Tambah Sumber Bahaya` | `Tambah Sumber Bahaya` | PASS |
| Edit heading | `Perbarui Sumber Bahaya` | `Perbarui Sumber Bahaya` | PASS |
| Name | `Nama` | `Nama` | PASS |
| Description | `Deskripsi` | `Deskripsi` | PASS |
| Active field | `Status` | `Status` | PASS |
| Active true | `Aktif` | `Aktif` | PASS |
| Active false | `Tidak Aktif` | `Tidak Aktif` | PASS |
| Submit | `Submit` | `Submit` on `FormView` | PASS |
| Create success | `Berhasil menambahkan data!` | `Berhasil menambahkan data!` | PASS |
| Update success | `Berhasil mengubah data!` | `Berhasil mengubah data!` | PASS |
| Validation | `Harus diisi!` | repository standard validation response | APPROVED DIFFERENCE |
| Delete confirmation/toast | legacy delete behavior; repository design requires standard delete behavior | `Delete record?`; `Record deleted.` | APPROVED DIFFERENCE |
| Lookup/dialog | none in approved screen | none | NOT NEEDED |

## Commands and verification gates

| Purpose | Command | Expected result |
|---|---|---|
| API migration generation | `pnpm --filter @southneuhof/api db:generate` | one new migration for `permit_danger_source`; no unrelated schema change |
| API migration | `pnpm --filter @southneuhof/api db:migrate` | exit 0 |
| API tests | `pnpm --filter @southneuhof/api test -- permit-danger-source` | focused tests pass |
| Web tests | `pnpm --filter @southneuhof/framework-web test -- permit-danger-source routes manifest` | focused tests pass |
| API type check | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Focused lint | `pnpm --filter @southneuhof/api lint -- --quiet` and `pnpm --filter @southneuhof/framework-web lint:check --quiet` | exit 0 |
| Seed | `pnpm --filter @southneuhof/api db:seed` twice | exact design rows remain, no duplicate IDs or names |
| Diff | `git diff --check` | no output |

### Execution evidence — 2026-08-19

- The required drift check found no committed Plan 083 implementation before
  edits. Plan 082 shared edits are expected. The final in-scope review found no
  `packages/is-vue-framework` change and no Plan 084 change.
- `pnpm --filter @southneuhof/api db:generate`: PASS; the first run created
  `apps/api/drizzle/20260819091858_aspiring_vapor/migration.sql` only for
  `permit_danger_source`; the final run reported no schema changes.
- `pnpm --filter @southneuhof/api db:migrate`: PASS.
- The literal API test command ran the package full suite. The Plan 083 route
  spec passed 2/2, while two unrelated existing tests in
  `apps/api/src/authorization.spec.ts` failed with `permission_inactive`.
  The direct focused command
  `node --env-file-if-exists=.env --env-file-if-exists=.env.test ./node_modules/vitest/vitest.mjs run src/routes/permit-danger-source/permit-danger-source.routes.spec.ts --reporter=verbose`
  passed 1 file and 2 tests. This baseline failure does not involve Plan 083
  files or behavior.
- The direct authorization catalog spec passed 1 file and 6 tests. The exact
  web command passed 75 files and 295 tests. API and web type checks passed.
- Correct API lint (`pnpm --filter @southneuhof/api lint`) and the required web
  lint passed. The literal API `lint -- --quiet` form fails because the package
  script passes `--quiet` to ESLint as a file path; no source or framework
  change is required.
- Seed run one and run two passed. The database query confirmed 20 rows, 20
  distinct stable IDs, 20 distinct names, all active, exact design order, one
  `permit-danger-source` system module, and exactly six module permissions.
  `git diff --check` passed.
- The generated route names are
  `master-data-permit-danger-source-detail` and
  `master-data-permit-danger-source-edit`. `staticRouteName` removes the
  dynamic folder segment; the approved URLs are unchanged.

Authenticated browser evidence used `http://localhost:5175` with the seeded
`ADS-HK Administrator` account (`admin@example.com`). The local API used port
3001 because the default web/API development ports were occupied by existing
local processes. The temporary browser row was deleted at the end of the
journey.

| URL | Surface/action | Test data ID | Visible result | Failure text |
|---|---|---|---|---|
| `/master-data/permit-danger-source` | List first load | Seeded stable IDs | `Sumber Bahaya`, `Work Permit`, and permissioned row actions were visible; the database contained all 20 seeded rows | None |
| `/master-data/permit-danger-source/create` | Empty create submit | None | Form stayed open with exact labels, `Aktif` checked, and `Submit` visible | `Required` |
| `/master-data/permit-danger-source/create` → `/master-data/permit-danger-source/998a4c09-4384-4749-9b1b-1df96201cbd6/detail` | Create | `998a4c09-4384-4749-9b1b-1df96201cbd6` | `Berhasil menambahkan data!`; detail showed the submitted name and description and `Aktif` | None |
| `/master-data/permit-danger-source/998a4c09-4384-4749-9b1b-1df96201cbd6/detail` | Detail and reload | `998a4c09-4384-4749-9b1b-1df96201cbd6` | `Detail Sumber Bahaya`; reload retained the submitted record | None |
| `/master-data/permit-danger-source/998a4c09-4384-4749-9b1b-1df96201cbd6/edit` | Edit and set inactive | `998a4c09-4384-4749-9b1b-1df96201cbd6` | `Perbarui Sumber Bahaya`, `Tidak Aktif`, `Berhasil mengubah data!`, and updated detail; reload retained `Nonaktif` | None |
| `/master-data/permit-danger-source?permit-danger-source.search=Codex+Plan+083+Browser+Check+Updated` | Delete row and confirm | `998a4c09-4384-4749-9b1b-1df96201cbd6` | `Delete record?`, `Record deleted.`, then `No data`; reload kept `No data` | None |
| `/master-data/permit-danger-source` | Post-delete seeded list reload | Seeded stable IDs | Seeded list remained available after temporary-row deletion | None |
| Authenticated navigation and manifest test | Permission visibility | `view-permit-danger-source` | Superadmin saw `Sumber Bahaya` below `Work Permit`; the denied-navigation test hid permissioned routes | None |

## Implementation steps

### Step 1: Add the API table, schemas, route, and migration

Create the colocated entity, route, and focused integration test under
`apps/api/src/routes/permit-danger-source/`. The table is
`permit_danger_source` with text UUID identity, required `name`, nullable
unique `code`, nullable `description`, boolean `active` default `true`, user
audit IDs, and timestamp audit fields. Omit identity and audit fields from
client write schemas.

Use the current app-owned `defineRoute` pattern where it is needed to trim
`name`, normalize blank `code` to `null`, check nullable-code uniqueness, set
`active: true` on create, and set audit fields from the authenticated identity.
Use standard authenticated `list`, `detail`, and delete behavior. Do not add a
lookup or dataset-template endpoint. Delete is ordinary hard delete because
the approved module has no dependent relation.

The API test must cover list, detail, create, update, delete, trimmed name,
empty-name rejection, nullable-code uniqueness, boolean/default active, audit
values, unauthenticated access, denied permission, and successful deletion.

**Verify**: inspect the generated SQL, run `pnpm --filter @southneuhof/api db:migrate`,
then run the new focused API test; all exit 0.

### Step 2: Register permissions, route composition, and seed

Edit only the module registration owners:

- `apps/api/src/routes/index.ts`: import the domain and model, add each once to
  `domainParts` and `installedRoutes`.
- `apps/api/src/authorization/catalog.ts`: add the one system module with the
  exact six operation permissions and no legacy lookup permission.
- `apps/api/scripts/seed.ts`: import the entity and upsert the twenty exact
  design values using stable IDs. Read the design for the values; do not
  invent codes or IDs. The existing `seedAuthorization()` automatically
  grants catalog permissions to the seeded system administrator role.

**Verify**: run the seed twice, query the table, confirm the design's exact
row count, names, active states, and stable IDs, and run the catalog test.

### Step 3: Add the schema-bound resource and standard routes

Create the schema, resource, four route files, and resource test under
`apps/web/src/routes/(authenticated)/master-data/permit-danger-source/`.

Use `defineSchema` with `fromZod` from the API entity, `createHonoResourceActions`
with `dataAdapter`, one `defineFields` catalog, and `defineResource`. Keep the
visible field order `name`, `description`, `active`; keep `code` and audit
fields out of list, detail, and form projections. Use the radio source
`[{ id: true, name: 'Aktif' }, { id: false, name: 'Tidak Aktif' }]`, and set
create initial data `active: true`.

Use the generated route names:
`master-data-permit-danger-source`,
`master-data-permit-danger-source-create`,
`master-data-permit-danger-source-detail`, and
`master-data-permit-danger-source-edit`.
The current `staticRouteName` generator removes the dynamic folder segment.
This is an approved technical difference from the literal dynamic-segment
names; the approved URLs remain unchanged.
The route shells must be standard `ListView`, `DetailView`, and `FormView`.
Pass exact legacy `title`, `submitLabel`, and create/update success messages
on the `FormView` wrappers when the framework supports them. Do not edit the
framework or create a native form.

The resource test must assert field keys/order, exact labels, renderers,
static radio options, active default, hidden API-only fields, permissions, and
all typed route targets.

**Verify**: run the focused resource test and web type check.

### Step 4: Add navigation and route assertions

Edit `apps/web/src/manifest/navigation.ts` to add the exact `Work Permit`
separator and permission-gated `Sumber Bahaya` entry. Add the same exact label
to the master-data index route. Update the central route and manifest tests for
the four URL resolutions, route names, menu title, separator, and
`view-permit-danger-source` gate. Accept only generated changes to
`apps/web/src/route-map.d.ts`.

**Verify**: run the focused route and manifest tests and review the route-map
diff for only this module.

### Step 5: Complete acceptance and independent verification

Run every command in this plan, record results in the checklist below, and
record `Reused`, `Searched`, and `Gap` in the implementation summary. Seed the
local database twice. In an authenticated Codex browser, verify first load,
list/detail/create/edit/delete, exact labels and options, permission-hidden
navigation, failed submission state, and reload after each write. Record the
URL, surface, permissioned user, test record ID, visible result, and failure
message.

Invoke `$verify-ads-hk-module` read-only. Only `PASS` permits this plan to move
to `DONE`.

## Copied module acceptance checklist

Use the statuses `TODO`, `PASS`, `APPROVED DIFFERENCE`, `SERVER SUPPLIED`,
`NOT NEEDED`, `REWORK`, `STOP`, and `BLOCKED`. Fill every row before marking
this plan done.

### 1. Scope and reference

- [x] Module and owned relation recorded: `permit-danger-source`, no owned relation.
- [x] Design read: `docs/superpowers/specs/2026-08-19-permit-danger-source-design.md`.
- [x] Legacy model/migration/seeder/config/list surface read: paths listed in Current state.
- [x] Legacy detail/create/edit and shared CRUD label surfaces read: `BaseCRUD.ts`, `CRUDDetail.vue`, `CRUDCreate.vue`, `CRUDUpdate.vue`, and `Form.vue`.
- [x] One current sibling read: business-categories and permit-work-types API/web modules.
- [x] Every difference is `PASS`, `APPROVED DIFFERENCE`, `SERVER SUPPLIED`, or `NOT NEEDED`.

### 2. Route and action matrix

| Surface | Legacy evidence | New route/action | Realm | Reused pattern | Evidence | Status |
|---|---|---|---|---|---|---|
| List entry | config/menu | `/master-data/permit-danger-source`, `resource.list()` | system | `ListView` | route/manifest tests and authenticated browser | PASS |
| List row | shared CRUD list | detail/edit/delete row actions | system | resource targets | resource test and authenticated browser | PASS |
| Detail | shared CRUD detail | `/:permitDangerSourceId/detail` | system | `DetailView` | route/resource tests and authenticated browser | PASS |
| Create | shared CRUD create | `/create` | system | `FormView` | resource test and authenticated browser | PASS |
| Edit | shared CRUD edit | `/:permitDangerSourceId/edit` | system | `FormView` | resource test and authenticated browser | PASS |
| Child row | none | none | — | — | `NOT NEEDED` | NOT NEEDED |

### 2a. User-facing labels

| Surface | Legacy label | New label | Status |
|---|---|---|---|
| Heading | `Sumber Bahaya` | `Sumber Bahaya` | PASS |
| Detail/create/edit headings | exact shared CRUD headings | exact legacy text | PASS |
| Fields | `Nama`, `Deskripsi`, `Status` | same | PASS |
| Options | `Aktif`, `Tidak Aktif` | same | PASS |
| Submit/success | `Submit`; exact legacy success text | same on route wrapper | PASS |
| Validation | `Harus diisi!` | repository standard error | APPROVED DIFFERENCE |
| Delete confirmation/toast | legacy delete behavior | repository standard `Delete record?` / `Record deleted.` | APPROVED DIFFERENCE |
| Lookup/dialog | none | none | NOT NEEDED |

### 3. Contract and data checks

- [x] Database, API, operation, resource, and route field names match.
- [x] Route tree and server registration create one URL per standard action.
- [x] Six permission names and `system` realm match.
- [x] API allowed and denied authorization cases pass.
- [x] No lookup source is required: `NOT NEEDED`.
- [x] Field inventory covers create/update/list/detail/renderer/source/server values.
- [x] Exact legacy seed values and idempotence pass.
- [x] Seed smoke check passes.

### 4. Workflow and UI checks

- [x] `ListView`, `DetailView`, and `FormView` are used.
- [x] No custom control or framework gap exists.
- [x] First load, failed submit, and reload after create/update/delete are recorded.
- [x] Labels, action placement, and row actions match the sibling pattern.
- [x] Authenticated Codex browser journey is recorded; unavailable means `BLOCKED`.
- [x] Each journey row has URL, surface, action, test ID, visible result, and failure text.

### 5. Independent verification

- [x] `$verify-ads-hk-module` reviewed plan, design, diff, legacy, seed, checks, and browser evidence.
- [x] Verdict is `PASS` with evidence.
- [x] No unresolved `REWORK` or `BLOCKED` row remains.

### 6. Final evidence

- [x] Focused API tests pass.
- [x] Focused web tests pass.
- [x] API/web type checks and lint pass.
- [x] `git diff --check` passes.
- [x] `Reused`, `Searched`, and `Gap` are reported.
- [x] No required item remains unchecked.

## Independent verifier report — 2026-08-19

VERDICT: PASS  
MODULE: `permit-danger-source`  
PLAN: `plans/083-build-permit-danger-source.md`  
DESIGN: `docs/superpowers/specs/2026-08-19-permit-danger-source-design.md`  
LEGACY: `/Users/gamer/Documents/projects/ads-hk-legacy`; model, migration,
seeder, config, menu, list, detail, create, update, and shared CRUD surfaces  
PARITY: PASS; exact approved fields, labels, routes, permissions, values, and
standard repository validation/delete differences are recorded  
CONTRACT: PASS; migration, registered API model, typed operation, schema-bound
resource, field catalog, and standard route shells align  
LABELS: PASS; validation and delete chrome are approved standard differences  
CHECKS: focused Plan 083 API 2/2, web 75 files/295 tests, catalog 6/6, type
checks, corrected lint, migrations, seed idempotence, and diff check passed;
the literal full API command has two unrelated existing authorization failures  
BROWSER: authenticated local Codex browser at `http://localhost:5175`; list,
failed create, create, detail, reload, edit, reload, delete, and post-delete
seeded-list journey passed for test ID
`998a4c09-4384-4749-9b1b-1df96201cbd6`  
EVIDENCE: route/resource/manifest tests, API route test, migration SQL,
database seed query, and the browser table above  
REWORK: None  
BLOCKER: None

## Done criteria

- [x] The migration creates `permit_danger_source` with the approved nullable unique `code` and audit fields.
- [x] API CRUD enforces authentication, exact permissions, trim/non-empty name, code uniqueness, active default, audit values, and standard errors.
- [x] Seed is idempotent and matches every value in the approved design.
- [x] Resource surfaces show only `name`, `description`, and `active` with exact labels and radio options.
- [x] Four web routes resolve and navigation is gated by `view-permit-danger-source` below `Work Permit`.
- [x] Focused checks, type checks, lint, and `git diff --check` pass.
- [x] Authenticated Codex browser journey is verified.
- [x] `$verify-ads-hk-module` returns `PASS`.
- [x] No framework package or other permit module changed.

## STOP conditions

- Plan 082 is not `DONE` or its worktree changes conflict with this module's registration or shared seed owners.
- A legacy label, field, permission, or seed value differs from the design and cannot be resolved from the repository.
- The standard resource path cannot hide API-only fields or render the static radio source without a framework change.
- A new lookup, dataset-template route, consumer-owned list, or custom write appears necessary; stop and request a design decision.
- A generated migration includes an unrelated table or deletes the Plan 082 migration; stop.
- Codex browser remains unavailable after a valid retry; mark `BLOCKED` with `UI UNVERIFIED`.

## Reuse record

- **Reused**: `defineRoute`, `authenticated`, `requirePermission`, `defineSchema`, `fromZod`, `defineFields`, `defineResource`, `createHonoResourceActions`, `dataAdapter`, `ListView`, `DetailView`, `FormView`, static radio source, and existing master-data navigation/test patterns.
- **Searched**: the approved design, legacy model/config/seeder/CRUD surfaces, architecture docs, framework README/contracts, business-categories, PTS work categories, permit-work-types, route registry, authorization catalog, seed flow, input registry, route tests, and manifest tests.
- **Gap**: none expected. If a gap appears, keep it route-local and do not edit `packages/is-vue-framework`.

## Maintenance notes

Future permit workflows may consume this table as a read source. Keep their
lookup permissions and filtering decisions in the consuming approved design;
this plan does not add a lookup endpoint or a dataset-template contract.
