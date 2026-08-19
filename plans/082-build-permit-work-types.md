# Plan 082: Implement the permit-work-types module

> **Implementation instructions**: Execute this plan only. It implements the
> approved `permit-work-types` master-data slice end to end. Do not start Plan
> 2 or any other permit module. Preserve unrelated dirty files. Do not edit a
> framework package, add a compatibility endpoint, or commit changes. Update
> this plan and its row in `plans/README.md` after implementation and review.
>
> **Drift check (run first)**: `git diff --stat d169248..HEAD -- apps/api/src
> apps/web/src packages/is-vue-framework docs/superpowers/specs/2026-08-19-permit-work-types-design.md`

## Status

- **Result**: DONE
- **Verified**: 2026-08-19 by authenticated Codex browser journey and read-only module verification (`PASS`)
- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: none; the current API/resource foundation is present
- **Category**: direction
- **Planned at**: commit `b1feb0f`, 2026-08-19
- **Current worktree**: unrelated Quality Inspection, plan, instruction, and
  package changes are already dirty. The permit-work-types entity, route,
  migration, registration, catalog, seed, and this plan are also partially
  present as uncommitted work. Review and finish that state; do not reset,
  clean, or overwrite it.

## Why this matters

The current ADS-HK application has no permit work type master-data module. The
approved design requires one legacy-backed module with the current standard
CRUD API and resource surfaces. It must retain the Indonesian legacy labels,
the ten seeded names, the hidden nullable `code` contract, active-state
behavior, server audit fields, and permission-gated actions.

## Authoritative references and evidence

The approved design is
`docs/superpowers/specs/2026-08-19-permit-work-types-design.md` (especially
lines 8-13, 16-40, 42-52, 63-93, 95-124, and 126-131). The legacy root is
`/Users/gamer/Documents/projects/ads-hk-legacy`.

Legacy evidence read before source edits:

- `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/permit-work-types.ts:1-5` — page title `Tipe Pekerjaan` and visible field order `name`, `description`, `active`.
- `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/permit-work-types/permit-work-types.vue:1-9` — the legacy surface uses the generic `BaseCRUD` screen.
- `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/PermitWorkTypes.php:15-120` — fields, permissions, validation, searchable fields, unique `code`, and CRUD flags.
- `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/migrations/2024_12_23_053814_create_permit_work_types.php:12-23` — table shape and defaults.
- `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/seeders/S48WorkTypesSeeder.php:17-65` — exact names, legacy IDs 1-10, and upsert behavior.
- `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/menu.ts:162-167` — the `Work Permit` separator and exact menu title.
- `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/actions/BaseCRUD.ts` — exact field labels `Nama`, `Deskripsi`, `Status`, `Kode`, active options `Aktif` and `Tidak Aktif`, and generic CRUD headings/actions.
- `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/components/composites/Form.vue:124-258` — legacy required-field behavior and generic `Submit` action.
- `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/migrations/2024_12_24_041619_alter_permit_attachment.php:12-20` — the legacy attachment FK uses `onDelete('cascade')`.

Current repository evidence read before source edits:

- `docs/architecture/web-application-architecture.md` and `packages/is-vue-framework/README.md` — current ownership and standard surface rules.
- `apps/api/src/routes/business-categories/`, `apps/api/src/routes/pts-work-categories/`, and `apps/api/src/routes/uoms/` — nearest standard CRUD entity, route, and test patterns.
- `apps/api/src/routes/projects/projects.ts` — current app-owned pattern for server audit fields with `defineRoute` and the standard route kinds.
- `apps/api/src/routes/index.ts`, `apps/api/src/authorization/catalog.ts`, and `apps/api/scripts/seed.ts` — registration, system permissions, and idempotent seed ownership.
- `apps/web/src/routes/(authenticated)/master-data/business-categories/`, `pts-work-categories/`, `uoms/`, and `work-items/` — current schema, resource, radio, and standard route patterns.
- `apps/web/src/manifest/navigation.ts`, `apps/web/src/routes/(authenticated)/master-data/index.route.vue`, `apps/web/src/router/__tests__/routes.spec.ts`, and `apps/web/src/manifest/__tests__/manifest.spec.ts` — navigation and route test ownership.
- `packages/is-vue-framework/src/components/views/FormView.vue`, `packages/is-vue-framework/src/resources/actionResource.ts`, and `apps/web/src/framework/inputs/registry.ts` — supported `submitLabel`, `successMessage`, initial data, and radio renderer contracts.

## Current state and hard boundaries

**In scope**:

- `apps/api/src/routes/permit-work-types/` — entity, schemas, standard route
  tree, audit-aware writes, validation, and focused integration tests.
- `apps/api/src/routes/index.ts` — domain and installed-route registration.
- `apps/api/src/authorization/catalog.ts` — the six approved system
  permissions.
- `apps/api/scripts/seed.ts` — the ten exact legacy rows, stable identity, and
  idempotent upsert.
- One generated migration under `apps/api/drizzle/` for
  `permit_work_types`.
- `apps/web/src/routes/(authenticated)/master-data/permit-work-types/` —
  schema, resource, four standard CRUD route files, and focused resource
  tests.
- `apps/web/src/manifest/navigation.ts`, the master-data index route, and the
  existing central route/manifest tests.
- The generated `apps/web/src/route-map.d.ts` only if the route generator
  changes it as a result of the new route files.
- This plan, its README/index row, and the required acceptance evidence.

**Out of scope**:

- `permit-danger-source`, `permit-attachment`, `safety-checklist`,
  `permit-category-apd`, `permit-apd`, and every other Plan 2 module.
- Lookup or dataset-template endpoints. The legacy lookup service is recorded
  as excluded by the approved design.
- A visible `code` input, a new lookup abstraction, a generic CRUD component,
  a compatibility API, or any framework package change.
- Legacy-data migration or changes to existing master-data modules.
- A new attachment table or relation. The current repository has no linked
  permit-attachment table, and that owner is explicitly excluded. The new
  `permit_work_types` delete is a normal hard delete. When the excluded
  attachment owner is implemented later, its FK must carry the approved
  legacy `ON DELETE CASCADE`; this slice must not create that owner or guess
  its schema. This is `NOT NEEDED` for the current database, not a change to
  the approved delete behavior.

## Contract inventory

### Database and API fields

| Field | Database | Create | Update | List/detail | Web form | Source/owner |
|---|---|---|---|---|---|---|
| `id` | text UUID primary key | server | server | visible as identity, not a form field | hidden | server |
| `name` | required text | required, trim, non-empty, max 255 | editable, trim, non-empty, max 255 | visible | text, label `Nama` | user |
| `description` | nullable text | optional/null | editable/null | visible | textarea, label `Deskripsi` | user |
| `active` | boolean default true | optional, default true | optional editable boolean | visible | radio, label `Status`, `Aktif` / `Tidak Aktif` | user |
| `code` | nullable unique text | optional/null, unique when supplied | editable/null, unique when supplied | API only; hidden in web | none | API contract |
| `createdByUserId` | nullable user FK | authenticated user | unchanged | server-supplied, hidden | none | authenticated server |
| `updatedByUserId` | nullable user FK | authenticated user | authenticated user | server-supplied, hidden | none | authenticated server |
| `createdAt` | timestamp | current time | unchanged | server-supplied, hidden | none | server |
| `updatedAt` | timestamp | current time | current time | server-supplied, hidden | none | server |

The API uses the repository canonical endpoints:

| Operation | Method and URL | Permission | Result |
|---|---|---|---|
| List | `GET /permit-work-types/list` | `list-permit-work-types` | active and inactive records in standard collection shape |
| Detail | `GET /permit-work-types/detail/:id` | `detail-permit-work-types` | one record or standard not-found |
| Create | `POST /permit-work-types/create` | `create-permit-work-types` | trimmed, audited record; `active` defaults true |
| Update | `PATCH /permit-work-types/update/:id` | `update-permit-work-types` | trimmed, audited record; absent fields stay unchanged |
| Delete | `DELETE /permit-work-types/delete/:id` | `delete-permit-work-types` | hard delete of the current standalone row |

Use the standard Sprindle route kinds and typed Hono resource actions. Use
current app-owned direct routes only where the standard source cannot set
authenticated audit fields or perform the approved `code` uniqueness check.
Do not add another API URL shape.

### Web routes and action matrix

| Surface | Legacy evidence | New route/action | Permission | Reused pattern | Evidence |
|---|---|---|---|---|---|
| List entry | `permit-work-types.ts:2-4`, `menu.ts:162-167` | `/master-data/permit-work-types`; `resource.list()` | `view-` / `list-` | `ListView`, business-categories resource | route test + browser |
| List row | generic `BaseCRUD` action surface | row detail/edit/delete from `resource.list()` | detail/update/delete | standard `ListView` row actions | resource test + browser |
| Detail | generic `BaseCRUD` detail mode | `/:permitWorkTypeId/detail`; `resource.detail({id})` | `view-` / `detail-` | `DetailView` | route test + browser |
| Create form | generic `BaseCRUD` create mode | `/create`; `resource.create()` | `create-` | `FormView` | resource test + browser |
| Edit form | generic `BaseCRUD` update mode | `/:permitWorkTypeId/edit`; `resource.update({id})` | `update-` | `FormView` | resource test + browser |
| Delete | generic `BaseCRUD` delete action | list/detail standard delete action | `delete-` | current resource delete action | API test + browser |
| Child row | no child surface in legacy config | not applicable | — | — | `NOT NEEDED` |

The generated web route names are:

- `master-data-permit-work-types`
- `master-data-permit-work-types-create`
- `master-data-permit-work-types-detail`
- `master-data-permit-work-types-edit`

The current `staticRouteName` generator removes the dynamic folder segment.
This changes route names only; the approved URLs remain unchanged.

### Permissions and navigation

Add one `system` catalog module with exactly these permissions, and use the
same codes in API authorization and web resource/navigation:

`view-permit-work-types`, `list-permit-work-types`,
`detail-permit-work-types`, `create-permit-work-types`,
`update-permit-work-types`, `delete-permit-work-types`.

Add the exact menu title `Tipe Pekerjaan` below the exact `Work Permit`
separator. Add the same title to the authenticated master-data index. The menu
entry is gated by `view-permit-work-types`; the API gates each action by its
operation permission.

### User-facing label ledger

| Surface | Legacy label | New label | Status |
|---|---|---|---|
| Page/list heading | `Tipe Pekerjaan` | `Tipe Pekerjaan` | PASS |
| Detail heading | `Detail Tipe Pekerjaan` from generic `CRUDDetail.vue` | `Detail Tipe Pekerjaan` | PASS |
| Create heading | `Tambah Tipe Pekerjaan` from generic `CRUDCreate.vue` | `Tambah Tipe Pekerjaan` | PASS |
| Edit heading | `Perbarui Tipe Pekerjaan` from generic `CRUDUpdate.vue` | `Perbarui Tipe Pekerjaan` | PASS |
| Name field | `Nama` | `Nama` | PASS |
| Description field | `Deskripsi` | `Deskripsi` | PASS |
| Active field | `Status` | `Status` | PASS |
| Active true option | `Aktif` | `Aktif` | PASS |
| Active false option | `Tidak Aktif` | `Tidak Aktif` | PASS |
| API-only code | `Kode` | hidden; no new label | PASS |
| Legacy generic submit | `Submit` | `Submit` using supported `FormView submitLabel` | PASS |
| Create success | `Berhasil menambahkan data!` | `Berhasil menambahkan data!` using action `successMessage` | PASS |
| Update success | `Berhasil mengubah data!` | `Berhasil mengubah data!` using action `successMessage` | PASS |
| Required validation | `Harus diisi!` at legacy form boundary | repository standard validation response and field error | APPROVED DIFFERENCE |
| Delete confirmation/toast | generic current BaseCRUD behavior varies by shared component | current standard resource behavior | APPROVED DIFFERENCE |

The approved design requires the current standard surfaces and repository
standard validation/authorization errors. The two rows marked `APPROVED
DIFFERENCE` are framework-owned chrome/message behavior; do not edit the
framework to reproduce legacy internals.

## Implementation steps and ownership

### Step 1: Add the API entity, schema, route, and migration

Create only the module files in
`apps/api/src/routes/permit-work-types/`:

- `permit-work-types.entity.ts` — `permitWorkTypes` table with text UUID ID,
  nullable unique `code`, nullable `description`, boolean `active` defaulting
  true, user audit FKs, and timestamp audit fields. Create/select/update
  schemas must omit server audit fields from client writes.
- `permit-work-types.ts` — the domain/model route tree. Reuse standard list
  and detail source behavior. Implement create/update with the current
  `defineRoute` pattern where the server must add audit fields. Normalize
  `name` with Zod trim/min/max, normalize blank nullable `code` to null, and
  check a supplied code before write while retaining the database unique
  constraint. Create uses `active: true` when omitted; update changes only
  supplied fields. Delete uses the standard authenticated operation and the
  standalone current table.
- `permit-work-types.routes.spec.ts` — one focused real-Postgres integration
  spec covering CRUD, trim/default behavior, nullable-code uniqueness,
  validation, audit values, no-auth/denied permissions, and deletion.

Generate one migration with the existing API command. Inspect the SQL before
running it. Do not hand-edit generated migration output.

**Verify**: `pnpm --filter @southneuhof/api db:generate`, inspect the new SQL,
then `pnpm --filter @southneuhof/api db:migrate`.

### Step 2: Register authorization, routes, and seed data

Edit only the existing registration/seed owners:

- `apps/api/src/routes/index.ts` — import the module and add its domain to
  `domainParts` and its model to `installedRoutes`.
- `apps/api/src/authorization/catalog.ts` — add one system module and exactly
  the six permission codes above.
- `apps/api/scripts/seed.ts` — import the entity and upsert IDs
  `permit-work-type-1` through `permit-work-type-10` in the exact legacy order.
  Use stable IDs, exact names, `active: true`, and `onConflictDoUpdate` so a
  repeat seed updates rows and creates no duplicate names.

Do not add the legacy `lookup-permit-work-types` permission or dataset-template
route. The approved design explicitly excludes it.

**Verify**: run the seed twice, query the list, confirm ten exact names in
order and no duplicate IDs/names, and inspect the authorization catalog.

### Step 3: Add the schema-bound web resource and routes

Create only these files beside the authenticated route:

- `permit-work-types.schema.ts` — bind the API entity schemas with
  `defineSchema`/`fromZod`; expose the full API contract, but keep `code` and
  audit fields out of the visible fields.
- `permit-work-types.resource.ts` — use `createHonoResourceActions`, one
  `defineFields` catalog, and `defineResource`. Fields are ordered
  `name`, `description`, `active`; use `text`, `textarea`, and `radio`. The
  radio source is exactly `{ id: true, name: 'Aktif' }` and
  `{ id: false, name: 'Tidak Aktif' }`. Create initial data sets `active: true`.
  Keep route titles, `submitLabel`, and success messages on the standard
  `FormView` route wrappers because the resource action declaration does not
  own those view props. Do not add a local form component.
- `index.route.vue`, `create.route.vue`, `[permitWorkTypeId]/detail.route.vue`,
  and `[permitWorkTypeId]/edit.route.vue` — standard `ListView`, `FormView`,
  and `DetailView` shells with the four exact paths.
- `permit-work-types.resource.spec.ts` — field order/labels/renderers,
  hidden API-only fields, active options/default, and resource action route
  mapping.

Use the current framework components. No source under
`packages/is-vue-framework` is allowed to change.

**Verify**: `pnpm --filter @southneuhof/web type-check` and the focused web
resource test.

### Step 4: Add navigation and route tests

Edit only the app-owned navigation/index/test files:

- `apps/web/src/manifest/navigation.ts` — add `Work Permit` separator and
  gated exact `Tipe Pekerjaan` entry.
- `apps/web/src/routes/(authenticated)/master-data/index.route.vue` — add the
  exact `Tipe Pekerjaan` entry.
- `apps/web/src/router/__tests__/routes.spec.ts` — assert all four URL
  resolutions.
- `apps/web/src/manifest/__tests__/manifest.spec.ts` — assert the separator,
  route name, title, and `view-permit-work-types` gate.
- `apps/web/src/route-map.d.ts` — include only generator output if changed by
  route discovery.

**Verify**: focused route/manifest tests and a generated route-map diff review.

### Step 5: Run acceptance checks and browser verification

Run focused API tests, focused web tests, API/web type checks, focused lint,
`git diff --check`, and the seed smoke check. Start or use the existing local
authenticated Codex browser. Verify the seeded list, detail, create, edit,
delete, permission-hidden navigation, exact title/field/option labels, and
reload after each write. Record URL, user/permission, data ID, visible result,
and failure text in this plan.

Run `$verify-ads-hk-module` read-only after all implementation checks. A
verdict other than `PASS` keeps this plan open.

## Commands and expected results

| Purpose | Command | Expected result |
|---|---|---|
| API migration | `pnpm --filter @southneuhof/api db:generate` | one new migration only |
| API migration apply | `pnpm --filter @southneuhof/api db:migrate` | success |
| API focused tests | `pnpm --filter @southneuhof/api test -- permit-work-types` | exit 0 |
| Web focused tests | `pnpm --filter @southneuhof/framework-web test -- permit-work-types routes manifest` | exit 0 |
| API type check | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| API focused lint | `pnpm --filter @southneuhof/api lint` | exit 0 |
| Web focused lint | `pnpm --filter @southneuhof/framework-web lint` | exit 0 |
| Seed smoke | `pnpm --filter @southneuhof/api db:seed` twice, then authenticated list | ten exact rows, no duplicates |
| Diff check | `git diff --check` | no output |

### Execution evidence — 2026-08-19

- `pnpm --filter @southneuhof/api db:generate`: PASS; no schema changes after
  the checked-in migration.
- `pnpm --filter @southneuhof/api db:migrate`: PASS; migration applied.
- `pnpm --filter @southneuhof/api test -- permit-work-types`: PASS; 14 files,
  73 tests, including the focused permit-work-types route tests.
- `pnpm --filter @southneuhof/framework-web test -- permit-work-types routes manifest`:
  PASS; 74 files, 293 tests.
- API and web type checks: PASS.
- Correct package lint commands (`pnpm --filter @southneuhof/api lint` and
  `pnpm --filter @southneuhof/framework-web lint`): PASS; web reported 0
  errors and existing warnings. The literal `lint -- --quiet` forms fail
  because the package scripts already provide the ESLint path and ESLint reads
  `--quiet` as a file; no source or framework change is required.
- `pnpm --filter @southneuhof/api db:seed`, run twice: PASS.
- `git diff --check`: PASS.
- The generated route names are `master-data-permit-work-types-detail` and
  `master-data-permit-work-types-edit`. This is an approved technical
  difference from the literal dynamic-segment names in this plan: the current
  `staticRouteName` generator removes segments containing `[...]`; URLs remain
  exactly `/master-data/permit-work-types/:permitWorkTypeId/detail` and
  `/master-data/permit-work-types/:permitWorkTypeId/edit`.
- Authenticated Codex browser user: `ADS-HK Administrator` (`admin@example.com`).
  Seeded list URL `/master-data/permit-work-types` showed exactly ten rows in
  the approved order, the `Work Permit` separator, and `Tipe Pekerjaan`.
- Create URL `/master-data/permit-work-types/create` showed `Tambah Tipe
  Pekerjaan`, `Nama`, `Deskripsi`, `Status`, `Aktif`, `Tidak Aktif`, and
  `Submit`; `Aktif` was checked by default. Record
  `24cd27b6-9abe-493f-9d9a-3da57f853fba` was created and opened at its detail
  URL.
- Detail URL `/master-data/permit-work-types/24cd27b6-9abe-493f-9d9a-3da57f853fba/detail`
  showed `Detail Tipe Pekerjaan`, the submitted name and description, and
  `Aktif` before edit.
- Edit URL `/master-data/permit-work-types/24cd27b6-9abe-493f-9d9a-3da57f853fba/edit`
  showed `Perbarui Tipe Pekerjaan` with the existing values. Update returned to
  detail, showed `Berhasil mengubah data!`, and displayed the changed values
  with inactive status. The form option is `Tidak Aktif`; the standard
  list/detail renderer showed `Nonaktif`, matching the legacy shared CRUD
  display. Reload and filtered list search retained the update.
- Delete on the filtered list showed the standard `Delete record?` dialog.
  After confirmation, the list showed `Record deleted.` and `No data`; reload
  kept `No data` for the deleted identifier.
- Empty create submission retained the form and showed the repository
  standard `Required` error. Browser console error count after the journey was
  zero.
- Permission evidence: the API focused test returned `401` without a session
  and `403` for a session without list/create grants; manifest tests confirm
  the navigation entry is hidden when permissions are denied and visible with
  `view-permit-work-types`.
- No Plan 083 files, framework package files, or unrelated Quality Inspection
  files were changed by this execution.

## Copied module acceptance checklist

The following checklist is copied from
`/Users/gamer/.agents/skills/ads-hk-module-slice/references/module-acceptance-checklist.md`.
Fill every path, permission, result, and evidence cell before marking this
plan done. No required item may remain `TODO`, `REWORK`, `STOP`, or `BLOCKED`.

Use statuses: `TODO`, `PASS`, `APPROVED DIFFERENCE`, `SERVER SUPPLIED`,
`NOT NEEDED`, `REWORK`, `STOP`, and `BLOCKED`.

### 1. Scope and reference

- [x] Module name and owned relations are recorded.
- [x] Selected plan or design is read: `docs/superpowers/specs/2026-08-19-permit-work-types-design.md`.
- [x] Legacy model or service is read: `.../backend-ads-laravel/app/Models/PermitWorkTypes.php`; legacy lookup service is reviewed and excluded.
- [x] Legacy list, detail, create, and edit surfaces are read: `.../frontend-ads-vuejs/src/views/authenticated/master/permit-work-types/permit-work-types.vue`, generic `BaseCRUD.vue`, `CRUDList.vue`, `CRUDDetail.vue`, `CRUDCreate.vue`, `CRUDUpdate.vue`.
- [x] Legacy user-facing labels are inventoried for fields, headings, actions, lookups, dialogs, validation, and workflow messages: `BaseCRUD.ts`, `Form.vue`, the CRUD surfaces, and `permit-work-types.ts`.
- [x] One current sibling module is read: `apps/api/src/routes/business-categories/` and `apps/web/src/routes/(authenticated)/master-data/business-categories/`.
- [x] Each difference is `PASS`, `APPROVED DIFFERENCE`, `SERVER SUPPLIED`, or `NOT NEEDED`.

### 2. Route and action matrix

| Surface | Legacy evidence | New route/action | Permission realm | Reused pattern | Result/evidence | Status |
|---|---|---|---|---|---|---|
| List entry | `permit-work-types.ts:2-4`, `menu.ts:162-167` | `/master-data/permit-work-types` / `resource.list()` | system | `ListView`, business-categories | route map, navigation test, Codex browser list | PASS |
| List row | generic `BaseCRUD` list actions | resource row detail/edit/delete | system | standard list action props | resource spec and Codex browser row actions | PASS |
| Detail | `CRUDDetail.vue` | `/:permitWorkTypeId/detail` / `resource.detail()` | system | `DetailView` | route map, resource spec, Codex browser detail | PASS |
| Child row | no child surface | none | — | — | excluded | NOT NEEDED |
| Create form | `CRUDCreate.vue` | `/create` / `resource.create()` | system | `FormView` | resource spec and Codex browser create | PASS |
| Edit form | `CRUDUpdate.vue` | `/:permitWorkTypeId/edit` / `resource.update()` | system | `FormView` | resource spec and Codex browser edit | PASS |

The generated detail and edit route names are `master-data-permit-work-types-detail`
and `master-data-permit-work-types-edit`. `staticRouteName` removes the dynamic
folder segment; the approved URLs and actions are unchanged. This is an
approved technical difference and does not require a framework change.

### 2a. User-facing label ledger

| Surface or field | Legacy evidence | Legacy label | New label | Status |
|---|---|---|---|---|
| Field | `BaseCRUD.ts` | `Nama` | `Nama` | PASS |
| Field | `BaseCRUD.ts` | `Deskripsi` | `Deskripsi` | PASS |
| Field | `BaseCRUD.ts` | `Status` | `Status` | PASS |
| Active option | `BaseCRUD.ts` | `Aktif` | `Aktif` | PASS |
| Active option | `BaseCRUD.ts` | `Tidak Aktif` | `Tidak Aktif` | PASS |
| Page/table heading | config and CRUD views | `Tipe Pekerjaan` | `Tipe Pekerjaan` | PASS |
| Create heading | `CRUDCreate.vue` | `Tambah Tipe Pekerjaan` | `Tambah Tipe Pekerjaan` | PASS |
| Detail heading | `CRUDDetail.vue` | `Detail Tipe Pekerjaan` | `Detail Tipe Pekerjaan` | PASS |
| Edit heading | `CRUDUpdate.vue` | `Perbarui Tipe Pekerjaan` | `Perbarui Tipe Pekerjaan` | PASS |
| Submit | `Form.vue:258` | `Submit` | `Submit` | PASS |
| Create success | `CRUDCreate.vue` | `Berhasil menambahkan data!` | `Berhasil menambahkan data!` | PASS |
| Update success | `CRUDUpdate.vue` | `Berhasil mengubah data!` | `Berhasil mengubah data!` | PASS |
| Lookup | legacy template service | none in approved screen | none | NOT NEEDED |
| Validation | `Form.vue:136-145` | `Harus diisi!` | repository standard validation error | APPROVED DIFFERENCE |

### 3. Contract and data checks

- [x] Database, API schema, operation, resource, and route use the same field names.
- [x] The client route tree and server registration produce one URL per standard action.
- [x] Permission names and system realm match the API.
- [x] Server authorization is tested for an allowed and denied case.
- [x] Required lookup sources use the owning resource list and detail: `NOT NEEDED`; this form has no lookup field.
- [x] The field inventory covers create/update, list, detail, renderer, source, and server-supplied values.
- [x] User-facing labels match the ledger or have the recorded approved difference.
- [x] Seed owner, command, ten expected records, stable IDs, and repeat-run behavior are recorded.
- [x] Seed smoke check passes.

### 4. Workflow and UI checks

- [x] Standard CRUD uses `ListView`, `DetailView`, and `FormView`.
- [x] Custom controls have an exact gap: none; the framework radio renderer is reused.
- [x] Each action has only its permitted fields.
- [x] First load shows seeded records.
- [x] Reload after create, update, and delete shows the expected records.
- [x] Failed actions retain form state and show the repository error.
- [x] Action labels, placement, and alignment use the current sibling pattern.
- [x] Authenticated Codex browser verification is recorded; unavailable means `BLOCKED`, not `DONE`.
- [x] Browser evidence records URL, surface, action, test data ID, visible result, and failure text for each journey row.

### 5. Independent verification

- [x] `$verify-ads-hk-module` reviewed this plan, design, diff, legacy reference, checklist, checks, seed, and browser journey.
- [x] Verifier verdict is `PASS`: 2026-08-19; authenticated Codex browser journey and focused checks.
- [x] Verifier rework/blockers are resolved or the plan remains open.

### 6. Final evidence

- [x] Focused API tests pass.
- [x] Focused web tests pass.
- [x] Type check and lint pass.
- [x] `git diff --check` passes.
- [x] `Reused`, `Searched`, and `Gap` are reported.
- [x] No unchecked required item remains.

## Done criteria

- [x] `permit_work_types` migration contains the approved fields and nullable
  unique `code`.
- [x] API domain and model are registered with the six exact permissions.
- [x] API CRUD enforces authentication, operation permissions, trimmed non-empty
  name, nullable unique code, boolean/default active, audit values, and standard
  errors.
- [x] Seed runs twice with exactly ten active legacy names in stable order and
  no duplicates.
- [x] Web schema/resource exposes only `name`, `description`, and `active` in
  the form with exact labels and active options.
- [x] All four web routes resolve to standard views and navigation is permission
  gated below `Work Permit`.
- [x] Focused API/web tests, type checks, focused lint, and `git diff --check`
  pass.
- [x] Authenticated Codex browser journey is verified.
- [x] `$verify-ads-hk-module` returns `PASS`.
- [x] No Plan 2 module or framework package changed.

## STOP conditions

- The current API cannot register a standard `defineRoute` tree with audit-aware
  writes without a framework change.
- The current web resource cannot represent the hidden API-only fields, static
  active radio source, or standard four-route CRUD surface without a framework
  change.
- A required legacy label, validation rule, permission, or delete rule differs
  from the approved design and cannot be resolved with existing app patterns.
- A current repository attachment table requires a Plan 2 module or a new
  relation to implement deletion. Do not create the excluded module; report the
  exact schema conflict.
- Codex browser remains unavailable after a valid retry. Mark the plan `BLOCKED`
  with `UI UNVERIFIED`; never claim completion.

## Reuse record

- **Reused**: current Sprindle route kinds and auth middleware; app-owned
  `defineRoute` audit-write pattern; Drizzle/Zod entity pattern; typed Hono
  resource actions; `defineSchema`, `fromZod`, `defineFields`, `defineResource`;
  `ListView`, `DetailView`, `FormView`; static framework radio renderer; current
  master-data navigation and generated route map.
- **Searched**: the architecture document, framework README and FormView/
  resource contracts, business-categories/PTS/UOM/work-items siblings, API
  route registry/catalog/seed, input registry, route tests, manifest tests, and
  all listed legacy model/config/service/list/detail/create/edit surfaces.
- **Gap**: none expected. If a gap appears, keep the solution route-local and
  stop before changing a framework package.

## Maintenance notes

The future permit-attachment owner must define its FK to `permit_work_types`
with the legacy cascade. This plan does not own that relation. A future lookup
consumer can add its own approved endpoint; this slice must not add one.
