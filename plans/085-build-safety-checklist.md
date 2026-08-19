# Plan 085: Implement the safety-checklist module

> **Implementation instructions**: Execute this plan only after Plans 082–084
> and 087 are `DONE`. Follow each step and verification gate. Preserve
> unrelated dirty work. Do not add work-permit child records, lookup endpoints,
> compatibility routes, or framework changes. Use High or Extra High reasoning
> only (`high` or `xhigh`); never use Low or Medium. If delegated, use GPT 5.6
> Luna at Extra High reasoning and do not set a service tier.
>
> **Drift check (run first)**:
> `git diff --stat 4e94c94..HEAD -- apps/api/src/routes/safety-checklist apps/api/src/routes/index.ts apps/api/src/authorization/catalog.ts apps/api/scripts/seed.ts apps/web/src/routes/'(authenticated)'/master-data/safety-checklist apps/web/src/manifest/navigation.ts apps/web/src/routes/'(authenticated)'/master-data/index.route.vue apps/web/src/router/__tests__/routes.spec.ts apps/web/src/manifest/__tests__/manifest.spec.ts packages/is-vue-framework`
> Completed predecessor permit modules will have expected additions to shared
> registration and navigation files. Stop only for an unexpected contract.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: `plans/082-build-permit-work-types.md`, `plans/083-build-permit-danger-source.md`, `plans/084-build-permit-attachment.md`
- **Category**: direction
- **Planned at**: commit `4e94c94`, 2026-08-19
- **Execution**: DONE — scaffold adjusted, API/web checks passed, seeded browser
  journey completed in the authenticated Codex browser, and independent
  verifier result is `PASS`.

## Execution evidence

- Scaffold returned ten generated absolute paths and eight manual integration
  paths. No default domain field was added.
- Migration generated and applied in the development and test databases.
- API checks passed: focused safety-checklist and authorization catalog tests,
  8 tests total. Web checks passed: resource, route, and manifest tests, 10
  tests total. Both package type checks passed; focused lint exited 0 with
  existing Prettier warnings only.
- Seed ran twice. The database has 17 unique IDs and names, all active, and
  item 15 stores the approved trailing tab.
- Browser evidence: authenticated
  `http://localhost:5173/master-data/safety-checklist` showed the exact two
  visible fields and no API-only fields; search displayed the trailing-tab
  item; empty-name submit failed; create, update, reload, search, delete, and
  post-delete reload passed for a temporary local record.
- Independent verifier: `PASS`.

## Why this matters

The legacy safety checklist is a standalone master-data catalog used by later
work-permit flows. The current application has no table or authenticated CRUD
surface for it. This plan preserves the exact `Safety Checklist` title and
seventeen legacy questions, including the trailing tab in the fifteenth seed
value, while keeping API-only `description`, nullable `code`, and audit fields
out of the UI.

## Current state and authoritative contract

Read `docs/superpowers/specs/2026-08-19-safety-checklist-design.md` before
implementation. It is the authority for the field matrix, labels, routes,
permissions, seed values, and exclusions. Do not duplicate the seed list in
this plan. The design explicitly records the fifteenth value's trailing tab;
the seed test must assert it without trimming the stored value.

Legacy evidence:

- `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/safety-checklist.ts` — title `Safety Checklist`, menu key, and visible `name`, `active` fields.
- `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/safety-checklist/safety-checklist.vue` — legacy list surface.
- `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/SafetyChecklist.php` — model fields and CRUD validation.
- `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/migrations/2024_12_23_054514_create_safety_checklist.php` — table shape and defaults.
- `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/seeders/S52SafetyChecklistSeeder.php` — exact seed values, including the whitespace edge case.
- `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/menu.ts` plus `BaseCRUD.ts`, CRUD surfaces, and `components/composites/Form.vue` — menu placement and exact visible language.

Current exemplars:

- `apps/api/src/routes/permit-work-types/`, `business-categories/`, and `pts-work-categories/` — standard colocated CRUD owners.
- `apps/web/src/routes/(authenticated)/master-data/pts-work-categories/` — a resource whose API fields exceed the visible field catalog.
- `apps/web/src/routes/(authenticated)/master-data/business-categories/` — schema/resource/route/test pattern.
- `apps/web/src/manifest/navigation.ts`, master-data index, route tests, and manifest tests — app-owned entry points.
- `packages/is-vue-framework/src/resources/actionResource.ts`, `FormView.vue`, and `apps/web/src/framework/inputs/registry.ts` — action, form, and radio contracts.

Pattern anchors to compare during the drift check:

- `apps/api/src/routes/business-categories/business-categories.entity.ts:13-30` defines the table, audit fields, and write/select schemas; `business-categories.ts:28-40` registers the standard route tree.
- `apps/web/src/routes/(authenticated)/master-data/pts-work-categories/pts-work-categories.resource.ts:7-42` projects API fields into a smaller visible catalog and uses standard CRUD permissions.
- `apps/web/src/routes/(authenticated)/master-data/business-categories/business-categories.resource.spec.ts:15-28` asserts table/detail/form keys and renderers.
- `apps/web/src/manifest/navigation.ts:29-43` owns the master-data menu; `packages/is-vue-framework/src/resources/actionResource.ts:104-150` defines create/update field actions without view chrome props.

Follow the standard path:

```text
safety_checklist table
→ authenticated API
→ normalized resource
→ standard ListView / DetailView / FormView
```

`FormView` route wrappers own legacy submit and success text. The resource
declaration must only define the typed actions, fields, permissions, and route
targets.

## Simple-master-data fast path

This module is eligible for the bounded `simple-master-data` path: it has no
relation, child record, lookup consumer, workflow transition, custom API
operation, or framework change. The approved design and full acceptance
matrix remain mandatory before source edits.

Run the scaffold once with an explicit configuration:

```sh
pnpm scaffold:master-data --config /absolute/path/safety-checklist.scaffold.json --json
```

Use this field-only configuration shape. Do not add implicit `name`,
`description`, `active`, `code`, audit, or other fields:

```json
{
  "slug": "safety-checklist",
  "table": "safety_checklist",
  "symbol": "SafetyChecklist",
  "title": "Safety Checklist",
  "identity": { "key": "id", "type": "text", "primary": true, "generated": "uuid" },
  "fields": [
    { "key": "name", "type": "text", "label": "Nama", "required": true, "renderer": "text" },
    {
      "key": "active",
      "type": "boolean",
      "label": "Status",
      "default": true,
      "renderer": "radio",
      "options": [
        { "id": true, "name": "Aktif" },
        { "id": false, "name": "Tidak Aktif" }
      ]
    }
  ],
  "serverFields": [
    { "key": "description", "type": "text" },
    { "key": "code", "type": "text" }
  ]
}
```

The scaffold returns absolute `generated` and `manual` paths. Inspect every
generated file against this plan, the approved design, and the legacy source.
Add the audit timestamp/user fields and the nullable unique `code` behavior
manually because they are server details, not default scaffold fields. Do not
edit shared registrations automatically. Use focused checks first, then the
full type checks, the complete acceptance checklist, the authenticated Codex
browser gate, and verifier `PASS`. Use High or Extra High reasoning only; do
not set a service tier when delegating.

## Ownership and contract inventory

- Backend owner: `apps/api/src/routes/safety-checklist/`.
- Web owner: `apps/web/src/routes/(authenticated)/master-data/safety-checklist/`.
- Navigation group: `master-data`, under `Work Permit`, exact title
  `Safety Checklist`.
- Relation owner: none.
- API base: `/safety-checklist`.
- Web routes:
  `/master-data/safety-checklist`,
  `/master-data/safety-checklist/create`,
  `/master-data/safety-checklist/:safetyChecklistId/detail`, and
  `/master-data/safety-checklist/:safetyChecklistId/edit`.
- Permission realm: `system`.

| Field | Legacy label | API create | API update | List/detail | Form renderer | Source | Server supplied |
|---|---|---:|---:|---:|---|---|---|
| `name` | `Nama` | required | editable | visible | `text` | user | no |
| `active` | `Status` | default `true` | editable | visible | `radio` | `Aktif`, `Tidak Aktif` | default only |
| `description` | `Deskripsi` | optional | editable | API only | none | API client | no |
| `code` | `Kode` | nullable, unique | nullable, unique | API only | none | API client | no |
| audit fields | legacy audit fields | server | server | hidden | none | identity/time | yes |

API actions:

| Operation | Method and path | Permission |
|---|---|---|
| list | `GET /safety-checklist/list` | `list-safety-checklist` |
| detail | `GET /safety-checklist/detail/:id` | `detail-safety-checklist` |
| create | `POST /safety-checklist/create` | `create-safety-checklist` |
| update | `PATCH /safety-checklist/update/:id` | `update-safety-checklist` |
| delete | `DELETE /safety-checklist/delete/:id` | `delete-safety-checklist` |

Add exactly one system catalog module `safety-checklist` with the six current
permission verbs. The existing seed authorization routine grants them to the
system administrator role.

## Route and action matrix

| Surface | Legacy evidence | New route/action | Permission | Reused pattern | Result/evidence | Status |
|---|---|---|---|---|---|---|
| List entry | config/menu | `/master-data/safety-checklist`, `resource.list()` | system view/list | `ListView` | route/browser | PASS |
| List row | shared CRUD list | detail/edit/delete | system detail/update/delete | standard row actions | browser | PASS |
| Detail | shared CRUD detail | `/:safetyChecklistId/detail` | system view/detail | `DetailView` | browser | PASS |
| Create form | shared CRUD create | `/create` | system create | `FormView` | browser | PASS |
| Edit form | shared CRUD edit | `/:safetyChecklistId/edit` | system update | `FormView` | browser | PASS |
| Description/code | legacy hidden | no visible fields | — | hidden API fields | resource test/browser | NOT NEEDED |
| Child row | none | none | — | — | `NOT NEEDED` | NOT NEEDED |

### User-facing label ledger

| Surface | Legacy label | New label | Status |
|---|---|---|---|
| Page/list heading | `Safety Checklist` | `Safety Checklist` | PASS |
| Detail heading | `Detail Safety Checklist` | same | PASS |
| Create heading | `Tambah Safety Checklist` | same | PASS |
| Edit heading | `Perbarui Safety Checklist` | same | PASS |
| Name field | `Nama` | `Nama` | PASS |
| Active field | `Status` | `Status` | PASS |
| Options | `Aktif`, `Tidak Aktif` | same | PASS |
| Submit | `Submit` | `Submit` on `FormView` | PASS |
| Create/update success | exact shared CRUD messages | same on route wrapper | PASS |
| Description/code | hidden/API-only | no visible labels | APPROVED DIFFERENCE |
| Validation | `Harus diisi!` | repository standard error | APPROVED DIFFERENCE |

## Commands and verification gates

| Purpose | Command | Expected result |
|---|---|---|
| Migration generation | `pnpm --filter @southneuhof/api db:generate` | one migration for `safety_checklist`; no unrelated table |
| Migration apply | `pnpm --filter @southneuhof/api db:migrate` | exit 0 |
| API tests | `pnpm --filter @southneuhof/api test:focused -- src/routes/safety-checklist/safety-checklist.routes.spec.ts` | one focused API file passes |
| Web tests | `pnpm --filter @southneuhof/framework-web test:focused -- 'routes/(authenticated)/master-data/safety-checklist/safety-checklist.resource.spec.ts' 'router/__tests__/routes.spec.ts' 'manifest/__tests__/manifest.spec.ts'` | focused resource, route, and manifest tests pass |
| Type checks | `pnpm --filter @southneuhof/api type-check` and `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Lint | `pnpm --filter @southneuhof/api lint:focused -- src/routes/safety-checklist/safety-checklist.ts src/routes/safety-checklist/safety-checklist.entity.ts src/routes/safety-checklist/safety-checklist.routes.spec.ts` and `pnpm --filter @southneuhof/framework-web lint:focused -- 'src/routes/(authenticated)/master-data/safety-checklist' 'src/routes/(authenticated)/master-data/index.route.vue' 'src/manifest/navigation.ts' 'src/manifest/__tests__/manifest.spec.ts' 'src/router/__tests__/routes.spec.ts'` | exit 0; existing warnings are recorded |
| Seed | `pnpm --filter @southneuhof/api db:seed` twice | exact design rows, including trailing tab, no duplicates |
| Diff | `git diff --check` | no output |

## Implementation steps

### Step 1: Scaffold and complete the API table, schema, CRUD route, and migration

Run the scaffold command and use its returned absolute paths. Adjust the
generated `safety-checklist.entity.ts`, `safety-checklist.ts`, and route test
against this plan. Define `safety_checklist` with text UUID identity, required
name, nullable unique code, nullable description, boolean active default true,
and audit fields. Omit identity/audit fields from client writes. Keep
description and code in API schemas even though the web resource hides them.

Use the current app-owned route pattern to trim and validate name, normalize
blank code to null, check nullable-code uniqueness, default active, and set
audit values. Use standard authenticated list/detail/create/update/delete
permissions and no custom lookup route.

The API test covers all standard operations, empty-name rejection, code
uniqueness, active default/boolean validation, audit values, unauthenticated
and denied requests, and deletion. It must also assert the API can carry
description/code while the UI does not project them.

**Verify**: inspect the generated SQL, migrate, and run the focused API test.

### Step 2: Register permissions, route, and exact seed data

Edit `apps/api/src/routes/index.ts`, `apps/api/src/authorization/catalog.ts`,
and `apps/api/scripts/seed.ts`. Register the domain/model once, add the exact
six system permissions, and upsert the design's seventeen rows by stable IDs.
Read the design for every string. Preserve the trailing tab in the fifteenth
name at storage and in the smoke assertion; do not apply a seed-wide trim to
stored names. Keep all rows active by default as the design states.

**Verify**: run the seed twice, query ordered rows, compare exact strings
including whitespace, assert no duplicate IDs/names, and run the catalog test.

### Step 3: Adjust the API-visible/web-hidden generated resource and routes

Adjust the generated schema, resource, four route files, and focused resource
test under `apps/web/src/routes/(authenticated)/master-data/safety-checklist/`.
Use `defineSchema`/`fromZod`, `createHonoResourceActions`, `dataAdapter`, one
`defineFields` catalog, and `defineResource`. Project only `name` and `active`
on list/detail/create/update. Use `text` and static `radio` with exact
`Aktif`/`Tidak Aktif` options. `description`, `code`, and audit fields must not
appear in any visible field list or form source. Set create active initial data
to true.

Use generated names:
`master-data-safety-checklist`,
`master-data-safety-checklist-create`,
`master-data-safety-checklist-safety-checklist-id-detail`, and
`master-data-safety-checklist-safety-checklist-id-edit`.
Use standard view shells and route-local `FormView` props for exact headings,
submit text, and success messages. Do not create a local form.

The resource test must assert field keys/order on table/detail/form, exact
labels, `['text', 'radio']` renderers, radio source values, no API-only keys,
permissions, and route targets.

**Verify**: focused resource test and web type check pass.

### Step 4: Add navigation and route assertions

Add the permission-gated `Safety Checklist` entry under `Work Permit` in
`apps/web/src/manifest/navigation.ts`, add it to the master-data index, and
extend route/manifest tests for all four URLs, exact title, separator, and
`view-safety-checklist`. Accept only generated route-map output.

**Verify**: focused route and manifest tests pass and route-map diff is limited
to this module.

### Step 5: Run acceptance and independent verification

Run every command, seed twice, and fill the checklist. In an authenticated Codex
Codex browser verify first load, exact visible two-field form, list/detail/create/
edit/delete, hidden description/code, permission-hidden navigation, failed
submit state, and reload after each write. Include an explicit browser check
that the fifteenth seeded value is shown/stored with the approved whitespace.
Invoke `$verify-ads-hk-module`; only `PASS` permits `DONE`.

## Copied module acceptance checklist

Use statuses `TODO`, `PASS`, `APPROVED DIFFERENCE`, `SERVER SUPPLIED`,
`NOT NEEDED`, `REWORK`, `STOP`, and `BLOCKED`.

### 1. Scope and reference

- [x] Module and owned relations recorded: `safety-checklist`, no owned relation.
- [x] Design read: `docs/superpowers/specs/2026-08-19-safety-checklist-design.md`.
- [x] Legacy model/migration/seeder/config/list and shared CRUD surfaces read.
- [x] Exact legacy labels and whitespace-sensitive seed evidence recorded.
- [x] Current sibling API/web modules read.
- [x] Every difference is classified.

### 2. Route and action matrix

| Surface | Legacy evidence | New route/action | Realm | Reused pattern | Evidence | Status |
|---|---|---|---|---|---|---|
| List entry | config/menu | `/master-data/safety-checklist` | system | `ListView` | route/browser | PASS |
| List row | shared CRUD list | detail/edit/delete | system | standard row actions | browser | PASS |
| Detail | shared CRUD detail | `/:safetyChecklistId/detail` | system | `DetailView` | browser | PASS |
| Create | shared CRUD create | `/create` | system | `FormView` | browser | PASS |
| Edit | shared CRUD edit | `/:safetyChecklistId/edit` | system | `FormView` | browser | PASS |
| Description/code | hidden legacy fields | no visible fields | — | resource projection | resource/browser | NOT NEEDED |
| Child row | none | none | — | — | `NOT NEEDED` | NOT NEEDED |

### 2a. User-facing labels

| Surface | Legacy label | New label | Status |
|---|---|---|---|
| Heading/actions | exact `Safety Checklist` CRUD text | same | PASS |
| Fields | `Nama`, `Status` | same | PASS |
| Options | `Aktif`, `Tidak Aktif` | same | PASS |
| Submit/success | exact shared CRUD text | same on route wrapper | PASS |
| Description/code | hidden/API-only | absent | APPROVED DIFFERENCE |
| Validation | `Harus diisi!` | repository standard error | APPROVED DIFFERENCE |

### 3. Contract and data checks

- [x] Database, API, operation, resource, and route names match.
- [x] Six permissions and system realm match.
- [x] Server authorization has allowed and denied evidence.
- [x] API-only description/code remain available to API but not UI.
- [x] Field inventory covers create/update/list/detail/renderer/source/server values.
- [x] Seventeen exact seed rows and the trailing-tab value pass twice.
- [x] Seed smoke check passes.

### 4. Workflow and UI checks

- [x] Standard `ListView`, `DetailView`, and `FormView` are used.
- [x] Only the visible two-field form is rendered.
- [x] First load, failed action, and reload after writes are recorded.
- [x] Authenticated Codex browser evidence is present.
- [x] Browser evidence includes URL, surface, action, test ID, result, and failure text.

### 5. Independent verification

- [x] `$verify-ads-hk-module` reviewed all required inputs.
- [x] Verdict is `PASS`.
- [x] No verifier `REWORK` or `BLOCKED` item remains.

### 6. Final evidence

- [x] Focused API/web tests pass.
- [x] Type checks and lint pass.
- [x] `git diff --check` passes.
- [x] `Reused`, `Searched`, and `Gap` are recorded.
- [x] No required item remains unchecked.

## Done criteria

- [x] Migration creates `safety_checklist` with code/description API fields and audit fields.
- [x] API enforces auth, permissions, trim/non-empty name, nullable code uniqueness, active default, audit values, and standard errors.
- [x] Seed is idempotent and preserves every approved string, including the fifteenth trailing tab.
- [x] Web list/detail/forms expose only `name` and `active` with exact labels/options.
- [x] Four routes and permission-gated navigation resolve below `Work Permit`.
- [x] Focused checks, type/lint, diff check, browser, and verifier `PASS` are recorded.
- [x] No framework package or unrelated module changed.

## STOP conditions

- A predecessor is not `DONE` or shared registration/seed/navigation files contain an unresolved conflict.
- The design or legacy source requires a label/value change not approved in the record.
- The seed implementation trims or normalizes the approved trailing tab.
- The standard resource cannot hide code/description or render the radio source without framework changes.
- A new lookup or custom endpoint appears necessary.
- Migration generation changes an unrelated table.
- Authenticated Codex browser remains unavailable after a valid retry; mark `BLOCKED` with `UI UNVERIFIED`.

## Reuse record

- **Reused**: permit-work-types and PTS work category API/resource patterns, standard schema-first resource fields, static radio renderer, `ListView`, `DetailView`, `FormView`, and current navigation/test owners.
- **Searched**: approved design, legacy model/config/seeder/CRUD surfaces, architecture and framework docs, route registry/catalog/seed, input registry, route tests, manifest tests, and sibling modules.
- **Gap**: none expected. Do not edit `packages/is-vue-framework`; stop if a gap appears.

## Maintenance notes

The stored checklist question text is business data. Future seed or migration
changes must preserve exact legacy strings and must not apply broad whitespace
normalization. Any new work-permit consumer should use a separate approved
source contract rather than changing this master-data form.
