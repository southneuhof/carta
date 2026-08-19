# Plan 084: Implement the permit-attachment module

> **Implementation instructions**: Execute this plan only after Plans 082 and
> 083 are `DONE`. Follow the order below. Preserve unrelated dirty work and
> the completed work-type module. Do not start another permit module, add a
> lookup endpoint, or change a framework package.
>
> **Drift check (run first)**:
> `git diff --stat b1feb0f..HEAD -- apps/api/src/routes/permit-attachment apps/api/src/routes/index.ts apps/api/src/authorization/catalog.ts apps/api/scripts/seed.ts apps/web/src/routes/'(authenticated)'/master-data/permit-attachment apps/web/src/manifest/navigation.ts apps/web/src/routes/'(authenticated)'/master-data/index.route.vue apps/web/src/router/__tests__/routes.spec.ts apps/web/src/manifest/__tests__/manifest.spec.ts packages/is-vue-framework`
> Plan 082's `permit_work_types` table is an expected dependency. Compare
> completed predecessor edits in shared files before adding this module.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: `plans/082-build-permit-work-types.md`, `plans/083-build-permit-danger-source.md`
- **Category**: direction
- **Planned at**: commit `b1feb0f`, 2026-08-19

## Why this matters

The legacy `Checklist Dokumen` master data is needed by later work-permit
flows, but the current application has no owner for its table or CRUD screen.
This plan adds that owner with the optional legacy work-type relation in the
database, API, and seed contract. The relation stays hidden in the master-data
form, and work-type deletion must cascade attachments as the legacy foreign
key does.

## Current state and authoritative contract

Read `docs/superpowers/specs/2026-08-19-permit-attachment-design.md` before
implementation. It is the authority for exact labels, visible fields, the
optional relation, the twenty seed rows, route matrix, and exclusions. Do not
copy its seed list into this plan; use the design file as the exact source.

Legacy evidence:

- `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/permit-attachment.ts` — title `Checklist Dokumen`, menu key, and visible `name`, `description`, `active` fields.
- `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/permit-attachment/permit-attachment.vue` — list surface.
- `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/PermitAttachment.php` — table fields, optional `permit_work_type_id`, validation, and CRUD behavior.
- `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/migrations/2024_12_23_054441_create_permit_attachment.php` and `2024_12_24_041619_alter_permit_attachment.php` — table and cascade relation.
- `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/seeders/S50PermitAttachmentSeeder.php` — exact identities, names, relation links, and inactive row.
- `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/menu.ts` plus shared `BaseCRUD.ts`, CRUD views, and `components/composites/Form.vue` — menu placement and exact visible language.

Current exemplars:

- `apps/api/src/routes/permit-work-types/` — predecessor table, custom audit-aware CRUD, and stable seed IDs.
- `apps/api/src/routes/project-vendors/` — relation-owned entity and server-side relation validation pattern.
- `apps/api/src/routes/business-categories/` and `root-causes/` — delete-reference validation and standard permissions.
- `apps/web/src/routes/(authenticated)/master-data/business-categories/` and `pts-work-categories/` — schema/resource/route/test shape.
- `apps/web/src/framework/inputs/registry.ts` and `packages/is-vue-framework/src/resources/actionResource.ts` — source and action contracts.

Pattern anchors to compare during the drift check:

- `apps/api/src/routes/business-categories/business-categories.ts:28-40` is the standard `defineModel` route tree; its `validate` hook at `:15-25` blocks referenced deletes.
- `apps/api/src/routes/project-vendors/project-vendors.entity.ts:13-25` shows a required foreign key plus audit fields, while `project-vendors.ts:75-161` shows server-side relation checks.
- `apps/web/src/routes/(authenticated)/master-data/business-categories/business-categories.resource.ts:7-42` is the schema-bound resource shape; `apps/web/src/routes/(authenticated)/master-data/business-categories/business-categories.resource.spec.ts:15-28` is the focused field projection test.
- `apps/web/src/manifest/navigation.ts:29-43` owns menu entries; `packages/is-vue-framework/src/resources/actionResource.ts:38-40,165-205` defines route targets and form initial data.

The approved data flow is:

```text
permit_work_types (owner)
→ permit_attachment.permitWorkTypeId (nullable, API/seed only)
→ authenticated CRUD API
→ normalized resource
→ standard list/detail/form views
```

Do not add a work-type lookup to the form. The legacy attachment lookup is a
separate later contract and is explicitly excluded from this plan.

## Ownership and contract inventory

- Backend owner: `apps/api/src/routes/permit-attachment/`.
- Relation owner: this module owns `permit_attachment.permit_work_type_id`;
  the work-type module owns its table, not this relation's behavior.
- Web owner: `apps/web/src/routes/(authenticated)/master-data/permit-attachment/`.
- Navigation group: `master-data`, legacy `Work Permit` separator, exact title
  `Checklist Dokumen`.
- API base: `/permit-attachment`.
- Web routes:
  `/master-data/permit-attachment`,
  `/master-data/permit-attachment/create`,
  `/master-data/permit-attachment/:permitAttachmentId/detail`, and
  `/master-data/permit-attachment/:permitAttachmentId/edit`.
- Permission realm: `system`.

| Field | Legacy label | API create | API update | List/detail | Form renderer | Source | Server supplied |
|---|---|---:|---:|---:|---|---|---|
| `name` | `Nama` | required | editable | visible | `text` | user | no |
| `description` | `Deskripsi` | optional | editable | visible | `textarea` | user | no |
| `active` | `Status` | default `true` | editable | visible | `radio` | `Aktif`, `Tidak Aktif` | default only |
| `code` | `Kode` | nullable, unique | nullable, unique | API only | none | API client | no |
| `permitWorkTypeId` | legacy relation, hidden | optional and FK-validated | fixed/hidden | hidden | none | API/seed | no |
| audit fields | legacy audit fields | server | server | hidden | none | identity/time | yes |

API actions use exact permissions:

| Operation | Method and path | Permission |
|---|---|---|
| list | `GET /permit-attachment/list` | `list-permit-attachment` |
| detail | `GET /permit-attachment/detail/:id` | `detail-permit-attachment` |
| create | `POST /permit-attachment/create` | `create-permit-attachment` |
| update | `PATCH /permit-attachment/update/:id` | `update-permit-attachment` |
| delete | `DELETE /permit-attachment/delete/:id` | `delete-permit-attachment` |

Add exactly one system catalog module `permit-attachment` with the six
`view-`, `list-`, `detail-`, `create-`, `update-`, and `delete-` permissions.
The seed flow grants those catalog permissions to the seeded system role.

## Route and action matrix

| Surface | Legacy evidence | New route/action | Permission | Reused pattern | Result/evidence | Status |
|---|---|---|---|---|---|---|
| List entry | config/menu | `/master-data/permit-attachment`, `resource.list()` | system view/list | `ListView` | route/browser | TODO |
| List row | shared CRUD list | detail/edit/delete row actions | system detail/update/delete | standard resource targets | resource/browser | TODO |
| Detail | shared CRUD detail | `/:permitAttachmentId/detail` | system view/detail | `DetailView` | route/browser | TODO |
| Create form | shared CRUD create | `/create` | system create | `FormView` | browser | TODO |
| Edit form | shared CRUD edit | `/:permitAttachmentId/edit` | system update | `FormView` | browser | TODO |
| Work type lookup | legacy screen hides relation | no field or source | — | no lookup | browser/resource | NOT NEEDED |
| Child row | no child surface | not applicable | — | — | `NOT NEEDED` | NOT NEEDED |

### User-facing label ledger

| Surface | Legacy label | New label | Status |
|---|---|---|---|
| Page/list heading | `Checklist Dokumen` | `Checklist Dokumen` | TODO |
| Detail heading | `Detail Checklist Dokumen` | same | TODO |
| Create heading | `Tambah Checklist Dokumen` | same | TODO |
| Edit heading | `Perbarui Checklist Dokumen` | same | TODO |
| Fields | `Nama`, `Deskripsi`, `Status` | same | TODO |
| Options | `Aktif`, `Tidak Aktif` | same | TODO |
| Submit | `Submit` | `Submit` on `FormView` | TODO |
| Create/update success | exact shared CRUD messages | same on route wrapper | TODO |
| Code/relation | API-only/hidden | no visible label or field | APPROVED DIFFERENCE |
| Validation | `Harus diisi!` | repository standard error | APPROVED DIFFERENCE |

## Commands and verification gates

| Purpose | Command | Expected result |
|---|---|---|
| Migration generation | `pnpm --filter @southneuhof/api db:generate` | one new `permit_attachment` migration; existing work-type migration stays intact |
| Migration apply | `pnpm --filter @southneuhof/api db:migrate` | exit 0; FK uses `ON DELETE CASCADE` |
| API tests | `pnpm --filter @southneuhof/api test -- permit-attachment` | focused tests pass |
| Web tests | `pnpm --filter @southneuhof/framework-web test -- permit-attachment routes manifest` | focused tests pass |
| Type checks | `pnpm --filter @southneuhof/api type-check` and `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Lint | `pnpm --filter @southneuhof/api lint -- --quiet` and `pnpm --filter @southneuhof/framework-web lint:check --quiet` | exit 0 |
| Seed | `pnpm --filter @southneuhof/api db:seed` twice | exact design rows and relation links, no duplicates |
| Diff | `git diff --check` | no output |

## Implementation steps

### Step 1: Add the relation-owning API table and migration

Create `apps/api/src/routes/permit-attachment/permit-attachment.entity.ts`,
`permit-attachment.ts`, and a focused API test. Define
`permit_attachment` with text UUID identity, required name, nullable unique
code, nullable description, boolean active default true, nullable
`permitWorkTypeId` referencing `permit_work_types.id` with `onDelete:
'cascade'`, and audit fields. Keep `permitWorkTypeId` in API create/select
contracts; omit it from the update schema if that is required to keep the
relation fixed after creation, and document the choice in the test.

Use the current app-owned route pattern to trim name, normalize blank code to
null, enforce nullable-code uniqueness, validate a supplied work-type ID, set
the active default, and set audit values. Use standard list/detail/delete
authorization. Do not add an attachment lookup or dataset-template route.

The API test must cover list/detail/create/update/delete, empty-name and code
validation, invalid relation rejection, allowed/denied permissions, audit
fields, and the real cascade: create a work type plus linked attachment,
delete the work type with `delete-permit-work-types`, and assert the attachment
is gone. Do not weaken Plan 082's work-type delete contract to make this test
pass.

**Verify**: inspect generated SQL for the FK action, run the migration, and run
the focused API test.

### Step 2: Register authorization, route, and idempotent seed

Edit only `apps/api/src/routes/index.ts`, `apps/api/src/authorization/catalog.ts`,
and `apps/api/scripts/seed.ts` for shared registration. Add the module domain
and model once, add the exact six permissions in the `system` realm, and seed
the design's twenty rows by stable IDs. Resolve the first ten relation links
through the stable Plan 082 work-type IDs. Preserve the one inactive row and
all exact names from the design. A second seed must update rows rather than
create duplicates.

**Verify**: run the seed twice and query both tables. Assert the design row
count, exact names/active values, the ten relation links, and no duplicate
IDs/names. Run the authorization catalog test.

### Step 3: Add the hidden-relation schema-bound web resource

Create the schema, resource, four standard route files, and focused resource
test under `apps/web/src/routes/(authenticated)/master-data/permit-attachment/`.
Use `defineSchema`/`fromZod`, `createHonoResourceActions`, `dataAdapter`, one
`defineFields` catalog, and `defineResource`. Visible field order is exactly
`name`, `description`, `active`, with `text`, `textarea`, and static `radio`
renderers. Keep `code`, `permitWorkTypeId`, and audit fields out of list,
detail, and form projections. Do not import a work-type resource as a source.
Set create `active: true` initial data.

Use generated names:
`master-data-permit-attachment`,
`master-data-permit-attachment-create`,
`master-data-permit-attachment-permit-attachment-id-detail`, and
`master-data-permit-attachment-permit-attachment-id-edit`.
Route wrappers use `ListView`, `DetailView`, and `FormView`, and carry the
exact legacy titles, `Submit`, and success messages where supported.

The resource test must assert the hidden relation, no source, field order,
exact labels/options, action permissions, and route mapping.

**Verify**: focused resource test and web type check pass.

### Step 4: Add navigation and route tests

Add the permission-gated `Checklist Dokumen` entry below `Work Permit` in
`apps/web/src/manifest/navigation.ts`, add the exact label to the master-data
index, and extend central route/manifest tests for all four URLs, the menu
title/separator, and `view-permit-attachment`. Accept only generated route-map
changes for this module.

**Verify**: focused route and manifest tests pass; inspect route-map diff.

### Step 5: Run the acceptance gate

Run all plan commands, seed twice, and record every checklist row. In an
authenticated T3 preview verify first load, list, detail, create, edit, delete,
permission-hidden navigation, exact labels/options, absence of a work-type
lookup, and reload after every write. Include a cascade API test result and
browser evidence. Invoke `$verify-ads-hk-module`; only `PASS` allows `DONE`.

## Copied module acceptance checklist

Use `TODO`, `PASS`, `APPROVED DIFFERENCE`, `SERVER SUPPLIED`, `NOT NEEDED`,
`REWORK`, `STOP`, and `BLOCKED`. No required row may remain unresolved.

### 1. Scope and reference

- [ ] Module and owned relation recorded: `permit-attachment` owns the FK from `permit_attachment` to `permit_work_types`.
- [ ] Design read: `docs/superpowers/specs/2026-08-19-permit-attachment-design.md`.
- [ ] Legacy model, migrations, seeder, config, and list surface read: paths in Current state.
- [ ] Shared legacy detail/create/edit and label surfaces read.
- [ ] Predecessor `permit-work-types` entity/API/resource and sibling relation patterns read.
- [ ] Every difference is `PASS`, `APPROVED DIFFERENCE`, `SERVER SUPPLIED`, or `NOT NEEDED`.

### 2. Route and action matrix

| Surface | Legacy evidence | New route/action | Realm | Reused pattern | Evidence | Status |
|---|---|---|---|---|---|---|
| List entry | config/menu | `/master-data/permit-attachment` | system | `ListView` | route/browser | TODO |
| List row | shared CRUD list | detail/edit/delete | system | resource row actions | browser | TODO |
| Detail | shared CRUD detail | `/:permitAttachmentId/detail` | system | `DetailView` | browser | TODO |
| Create | shared CRUD create | `/create` | system | `FormView` | browser | TODO |
| Edit | shared CRUD edit | `/:permitAttachmentId/edit` | system | `FormView` | browser | TODO |
| Work type relation | hidden legacy relation | no form field/source | — | no lookup | resource/browser | NOT NEEDED |

### 2a. User-facing labels

| Surface | Legacy label | New label | Status |
|---|---|---|---|
| Heading/actions | exact `Checklist Dokumen` CRUD headings | same | TODO |
| Fields | `Nama`, `Deskripsi`, `Status` | same | TODO |
| Options | `Aktif`, `Tidak Aktif` | same | TODO |
| Submit/success | exact legacy text | same on route wrapper | TODO |
| Code/relation | hidden/API-only | not visible | APPROVED DIFFERENCE |
| Validation | `Harus diisi!` | repository standard error | APPROVED DIFFERENCE |

### 3. Contract and data checks

- [ ] Database/API/operation/resource/routes share field names.
- [ ] Migration has the nullable relation with `ON DELETE CASCADE`.
- [ ] Parent work-type delete cascades linked attachments in an API test.
- [ ] Six permissions and system realm match in API and resource.
- [ ] Relation validation rejects an unknown work type.
- [ ] No lookup source is declared because the relation is hidden: `NOT NEEDED`.
- [ ] Seed names, active state, relation links, stable IDs, and idempotence pass.
- [ ] Seed smoke check passes.

### 4. Workflow and UI checks

- [ ] Standard views are used and no local form exists.
- [ ] No work-type input or lookup appears on list/detail/create/edit.
- [ ] First load, failed submit, and reload after writes are recorded.
- [ ] Authenticated T3/browser journey is recorded or the plan is `BLOCKED`.
- [ ] Browser evidence includes URL, surface, action, test ID, visible result, and failure text.

### 5. Independent verification

- [ ] `$verify-ads-hk-module` reviewed the current plan, design, diff, legacy, seed, checks, and browser result.
- [ ] Verdict is `PASS`.
- [ ] No unresolved verifier item remains.

### 6. Final evidence

- [ ] Focused API/web tests pass.
- [ ] Type checks and lint pass.
- [ ] `git diff --check` passes.
- [ ] `Reused`, `Searched`, and `Gap` are recorded.
- [ ] No required item remains unchecked.

## Done criteria

- [ ] `permit_attachment` migration has the approved fields, nullable unique `code`, and cascade FK.
- [ ] API enforces auth, exact permissions, name/code/active validation, relation validation, audit values, and standard errors.
- [ ] Work-type delete removes linked attachments; attachment delete remains standard.
- [ ] Seed matches every design row and is idempotent.
- [ ] Web exposes only `name`, `description`, and `active`; no relation lookup or code field exists.
- [ ] Four routes and permission-gated navigation resolve below `Work Permit`.
- [ ] Focused checks, type/lint, diff check, authenticated browser, and verifier `PASS` are recorded.
- [ ] No framework package or unrelated module changed.

## STOP conditions

- Plan 082 is not `DONE`, the work-type table is missing, or the FK cannot be generated with `ON DELETE CASCADE` without changing an out-of-scope file.
- A design label, relation rule, seed value, or permission is missing or conflicts with the live legacy evidence.
- The UI requires a work-type lookup to render the approved screen; do not add one.
- A lookup/dataset-template route, compatibility adapter, or framework change appears necessary.
- Migration generation affects an unrelated table or predecessor migration.
- T3/browser remains unavailable after a valid retry; mark `BLOCKED` with `UI UNVERIFIED`.

## Reuse record

- **Reused**: Plan 082's permit module conventions, `business-categories` resource/API, project-vendor relation validation, standard Sprindle CRUD, schema-bound field catalogs, static radio source, and standard framework views.
- **Searched**: approved design, all listed legacy surfaces, architecture/framework docs, permit-work-types, business-categories, project-vendors, route registry, catalog, seed, input registry, route tests, manifest tests, and generated migration behavior.
- **Gap**: none expected. Do not edit `packages/is-vue-framework` if a gap appears; stop and report it.

## Maintenance notes

The cascade FK is part of the data contract for all future permit attachment
consumers. Keep hidden `permitWorkTypeId` semantics in the API/seed contract;
do not expose it in this master-data form or silently replace it with a lookup.
