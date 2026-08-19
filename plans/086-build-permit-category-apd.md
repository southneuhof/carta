# Plan 086: Implement permit-category-apd and nested permit-apd

> **Implementation instructions**: Execute this plan only after Plans 082–085
> are `DONE`. This plan owns both the parent `permit-category-apd` resource and
> its nested `permit-apd` child. Follow the dependency order below. Preserve
> unrelated dirty work. Do not add a standalone APD menu entry, a generic
> nested-resource abstraction, a lookup endpoint, or framework changes.
>
> **Drift check (run first)**:
> `git diff --stat b1feb0f..HEAD -- apps/api/src/routes/permit-category-apd apps/api/src/routes/permit-apd apps/api/src/routes/index.ts apps/api/src/authorization/catalog.ts apps/api/scripts/seed.ts apps/web/src/routes/'(authenticated)'/master-data/permit-category-apd apps/web/src/manifest/navigation.ts apps/web/src/routes/'(authenticated)'/master-data/index.route.vue apps/web/src/router/__tests__/routes.spec.ts apps/web/src/manifest/__tests__/manifest.spec.ts packages/is-vue-framework`
> Completed predecessor edits to shared files are expected. Compare them with
> live code; stop only for an unresolved parent/child contract or unrelated
> edit.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: `plans/082-build-permit-work-types.md`, `plans/083-build-permit-danger-source.md`, `plans/084-build-permit-attachment.md`, `plans/085-build-safety-checklist.md`
- **Category**: direction
- **Planned at**: commit `b1feb0f`, 2026-08-19

## Why this matters

The legacy APD master data has a parent category catalog and child APD records
that are edited together. A parent-only CRUD screen would lose the core
business relation. This plan adds two colocated API owners and one web parent
surface with APD CRUD rendered under the category detail page, while enforcing
parent scoping and blocking category deletion when children exist.

## Current state and authoritative contract

Read `docs/superpowers/specs/2026-08-19-permit-category-apd-design.md` before
implementation. It is the authority for exact labels, parent/child fields,
nested routes, permissions, seed values, relation rules, and exclusions. Do
not duplicate its eight parent or sixteen child seed names in this plan. Read
the design during execution and seed exactly what it contains.

Legacy evidence:

- `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/permit-category-apd.ts` — parent title `Kategori APD`, menu title `APD`, and visible fields.
- `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/permit-apd.ts` — child title `APD`, visible fields, parent-filtered child behavior, and child create contract.
- `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/permit-category-apd/permit-category-apd.vue` — parent list/detail surface.
- `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/PermitCategoryApd.php` and `PermitApd.php` — parent/child fields, required relation, validation, and CRUD behavior.
- `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/migrations/2024_12_23_054355_create_permit_work_category_apd.php` and `2024_12_23_054400_create_permit_apd.php` — table shapes and the child FK without cascade.
- `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/seeders/S51PermitApdSeeder.php` — exact parent/child identities and assignments.
- `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/menu.ts` plus shared CRUD files — parent menu placement and exact headings/labels/actions.

Current repository exemplars:

- `apps/api/src/routes/project-vendors/` — a relation-owned child resource with scoped list/detail/write authorization.
- `apps/api/src/routes/work-items/` and `inspection-test-plans/` — query filters, relation validation, and domain delete checks.
- `apps/web/src/routes/(authenticated)/master-data/projects/[projectId]/detail.route.vue` and its `detail/vendors/` child routes — parent detail with nested child CRUD and route-scoped resource actions.
- `apps/web/src/routes/(authenticated)/settings/users/[userId]/detail.route.vue` — parent detail plus nested child navigation pattern.
- `apps/web/src/routes/(authenticated)/master-data/business-categories/` — standard parent CRUD/resource tests.
- `apps/web/src/framework/hono/actions.ts`, `dataAdapter`, `inputs/registry.ts`, and `packages/is-vue-framework/src/resources/actionResource.ts` — typed actions, normalization, source rules, and named route targets.

Pattern anchors to compare during the drift check:

- `apps/api/src/routes/project-vendors/project-vendors.ts:46-161` filters and authorizes a relation-owned child on every list/detail/write operation; `apps/api/src/routes/business-categories/business-categories.ts:21-40` blocks parent deletes with a reference check.
- `apps/web/src/routes/(authenticated)/master-data/projects/[projectId]/detail.route.vue:1-22` renders a parent `DetailView` and nested child area; `detail/vendors/project-vendors.resource.ts:14-53` carries parent IDs through list, detail, create, update, and route targets.
- `apps/web/src/routes/(authenticated)/master-data/projects/[projectId]/detail/vendors/create.route.vue:1-11` is the standard nested `FormView` shell with `initialData`.
- `packages/is-vue-framework/src/resources/actionResource.ts:38-40,165-220` defines named route parameters, list/detail source parameters, and create/update initial data.

Use this flow:

```text
permit_category_apd
→ permit_apd.permit_category_apd_id
→ scoped authenticated API actions
→ parent resource + parent detail child resource
→ standard ListView / DetailView / FormView
```

The child list is rendered in the parent detail route. The child has no
navigation entry and no standalone master-data page.

## Ownership, routes, and contracts

- Parent API owner: `apps/api/src/routes/permit-category-apd/`.
- Child API owner: `apps/api/src/routes/permit-apd/`.
- Parent web owner and child route files:
  `apps/web/src/routes/(authenticated)/master-data/permit-category-apd/`.
- Relation owner: `permit-apd` owns the `permit_category_apd_id` foreign key;
  `permit-category-apd` owns the parent delete rule and nested screen.
- Navigation group: `master-data`, below `Work Permit`, exact menu label `APD`.
- Parent API base: `/permit-category-apd`.
- Child API base: `/permit-apd` with `permitCategoryApdId` as the required
  scope for child list/detail/update/delete and create.
- Permission realm: `system` for both resources.

Parent web routes:

- `/master-data/permit-category-apd`
- `/master-data/permit-category-apd/create`
- `/master-data/permit-category-apd/:permitCategoryApdId/detail`
- `/master-data/permit-category-apd/:permitCategoryApdId/edit`

Child web routes:

- child list is inline on the parent detail route;
- `/master-data/permit-category-apd/:permitCategoryApdId/detail/apd/create`;
- `/master-data/permit-category-apd/:permitCategoryApdId/detail/apd/:permitApdId/detail`;
- `/master-data/permit-category-apd/:permitCategoryApdId/detail/apd/:permitApdId/edit`.

Generated route names must be checked, not guessed. Follow the project-vendor
namespacing pattern and assert the generated names in `routes.spec.ts`.

### Parent field inventory

| Field | Legacy label | API create | API update | List/detail | Form renderer | Source | Server supplied |
|---|---|---:|---:|---:|---|---|---|
| `name` | `Nama` | required | editable | visible | `text` | user | no |
| `description` | `Deskripsi` | optional | editable | visible | `textarea` | user | no |
| `active` | `Status` | default `true` | editable | visible | `radio` | `Aktif`, `Tidak Aktif` | default only |
| `code` | `Kode` | nullable, unique | nullable, unique | API only | none | API client | no |
| audit fields | legacy audit fields | server | server | hidden | none | identity/time | yes |

### Child field inventory

| Field | Legacy label | API create | API update | List/detail | Form renderer | Source | Server supplied |
|---|---|---:|---:|---:|---|---|---|
| `name` | `Nama` | required | editable | visible | `text` | user | no |
| `description` | `Deskripsi` | optional | editable | visible | `textarea` | user | no |
| `active` | `Status` | default `true` | editable | visible | `radio` | `Aktif`, `Tidak Aktif` | default only |
| `permitCategoryApdId` | hidden relation | required from parent route | fixed/not editable | hidden | none | parent route | yes on create |
| `code` | `Kode` | nullable, unique | nullable, unique | API only | none | API client | no |
| audit fields | legacy audit fields | server | server | hidden | none | identity/time | yes |

Parent permissions:
`view-permit-category-apd`, `list-permit-category-apd`,
`detail-permit-category-apd`, `create-permit-category-apd`,
`update-permit-category-apd`, `delete-permit-category-apd`.

Child permissions:
`view-permit-apd`, `list-permit-apd`, `detail-permit-apd`,
`create-permit-apd`, `update-permit-apd`, `delete-permit-apd`.

Add exactly two system authorization modules, one per API resource. Do not add
permission codes for a standalone APD menu or a separate lookup endpoint.

## Route and action matrix

| Surface | Legacy evidence | New route/action | Permission | Reused pattern | Result/evidence | Status |
|---|---|---|---|---|---|---|
| Parent list entry | parent config/menu | `/master-data/permit-category-apd`, parent `resource.list()` | parent view/list | `ListView` | route/browser | TODO |
| Parent list row | shared CRUD list | parent detail/edit/delete | parent detail/update/delete | standard row actions | browser | TODO |
| Parent detail | parent detail surface | `/:permitCategoryApdId/detail` plus inline APD list | parent detail; child list | `DetailView` + `ListView` | browser | TODO |
| Parent create | parent create surface | `/create` | parent create | `FormView` | browser | TODO |
| Parent edit | parent edit surface | `/:permitCategoryApdId/edit` | parent update | `FormView` | browser | TODO |
| Child list | child filtered by category | inline on parent detail | child view/list | scoped `ListView` | browser | TODO |
| Child row | child CRUD list | child detail/edit/delete nested routes | child detail/update/delete | scoped resource | browser | TODO |
| Child create | child create with parent ID | `/detail/apd/create` | child create | `FormView`, initial parent ID | browser | TODO |
| Child edit | child edit, parent fixed | `/detail/apd/:permitApdId/edit` | child update | `FormView` | browser | TODO |
| Parent delete with children | legacy delete blocked | API validation error, UI failed action | parent delete | server reference check | API/browser | TODO |
| Standalone APD menu | explicitly absent | no menu entry | — | `NOT NEEDED` | manifest test | NOT NEEDED |

### User-facing label ledger

| Surface | Legacy label | New label | Status |
|---|---|---|---|
| Parent menu | `APD` | `APD` | TODO |
| Parent heading | `Kategori APD` | `Kategori APD` | TODO |
| Child heading | `APD` | `APD` | TODO |
| Parent/child fields | `Nama`, `Deskripsi`, `Status` | same | TODO |
| Active options | `Aktif`, `Tidak Aktif` | same | TODO |
| Parent create/detail/edit headings | exact shared CRUD text with `Kategori APD` | same | TODO |
| Child create/detail/edit headings | exact shared CRUD text with `APD` | same | TODO |
| Submit/success | exact shared CRUD text | same on route wrapper | TODO |
| Relation/code | hidden/API-only | not visible | APPROVED DIFFERENCE |
| Validation | `Harus diisi!` | repository standard error | APPROVED DIFFERENCE |
| Delete block | legacy blocked behavior | repository standard reference error | APPROVED DIFFERENCE |

## Commands and verification gates

| Purpose | Command | Expected result |
|---|---|---|
| Migration generation | `pnpm --filter @southneuhof/api db:generate` | one migration creating both approved tables; no unrelated schema change |
| Migration apply | `pnpm --filter @southneuhof/api db:migrate` | exit 0; child FK has no cascade |
| API tests | `pnpm --filter @southneuhof/api test -- permit-category-apd permit-apd` | parent/child focused tests pass |
| Web tests | `pnpm --filter @southneuhof/framework-web test -- permit-category-apd routes manifest` | focused tests pass |
| Type checks | `pnpm --filter @southneuhof/api type-check` and `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Lint | `pnpm --filter @southneuhof/api lint -- --quiet` and `pnpm --filter @southneuhof/framework-web lint:check --quiet` | exit 0 |
| Seed | `pnpm --filter @southneuhof/api db:seed` twice | exact parent/child design data, stable links, no duplicates |
| Diff | `git diff --check` | no output |

## Implementation steps

### Step 1: Add parent and child database entities and migration

Create the parent entity in
`apps/api/src/routes/permit-category-apd/permit-category-apd.entity.ts` and
the child entity in `apps/api/src/routes/permit-apd/permit-apd.entity.ts`.
Both tables use text UUID identity, name, nullable unique code, nullable
description, active default true, and audit fields. The child has required
`permitCategoryApdId` referencing the parent without `onDelete: 'cascade'`.
Keep the parent relation in the child API contract and omit it from child
update/form fields so a child cannot be moved by ordinary edit.

Generate one migration (or the smallest generated set if the local Drizzle
version splits it) and inspect the SQL. It must create both tables, the parent
FK, and no cascade on the child FK.

**Verify**: `pnpm --filter @southneuhof/api db:generate`, inspect SQL, then
`pnpm --filter @southneuhof/api db:migrate`.

### Step 2: Add scoped parent/child API routes and focused tests

Create `permit-category-apd.ts`, `permit-apd.ts`, and focused route tests in
their respective API folders. Use authenticated standard CRUD permissions.
Use the current app-owned route pattern for trim/name validation, nullable
code normalization and uniqueness, active default, and audit values.

For the child:

1. `list` accepts `permitCategoryApdId`, filters every row by it, and rejects
   an unknown or missing parent scope instead of returning another category's
   rows.
2. `detail`, `update`, and `delete` verify the requested child belongs to the
   supplied parent scope before returning or changing it. A mismatched scope
   is `notFound`, not a cross-parent leak.
3. `create` requires the parent ID, verifies the parent exists, and writes it
   from the route/resource initial data. The child update schema does not allow
   changing the parent.

The parent `delete` validation queries `permit_apd` and returns the repository
standard reference error while children exist. It must not cascade or delete
children. Parent and child list/detail/write results must be normalized record
or collection shapes. Do not add a consumer-owned lookup list or custom
workflow endpoint; the child scope is a normal relation filter.

Tests must cover both resources' CRUD, validation, exact permissions,
unauthenticated/denied requests, child parent scope and mismatch, required
relation validation, parent delete blocking, and successful parent deletion
after child deletion. Include a test that child delete only affects the
selected parent.

**Verify**: run the focused API tests and the API type check.

### Step 3: Add parent and scoped child resources

Create parent schema/resource and child schema/resource files under
`apps/web/src/routes/(authenticated)/master-data/permit-category-apd/`.
Use `defineSchema`/`fromZod`, `createHonoResourceActions`, `dataAdapter`,
`defineFields`, and `defineResource`.

Parent resource fields are `name`, `description`, `active`. Child resource
fields are `name`, `description`, `active`. Keep parent/child IDs, code, and
audit fields hidden. Use static radio options with exact labels and
`active: true` create initial data.

Create a function such as `permitApds(parentId: string)` only for this nested
resource. Its `list` and `detail` actions pass
`searchParameters: { permitCategoryApdId: parentId }` to the typed API; its
create action uses `initialData: { permitCategoryApdId: parentId }`; update
and delete remain scoped to the parent. Do not add a generic nested-resource
helper. The child resource's route targets must include both parent and child
IDs. Parent resource targets use only the parent ID.

The resource tests must assert parent/child field projections, exact labels and
radio options, hidden relation fields, child scope forwarded to list/detail,
child initial data, parent/child permissions, and route targets for all CRUD
surfaces.

**Verify**: run the focused web resource tests and web type check.

### Step 4: Add parent detail inline APD list and nested route shells

Create parent list/create/detail/edit route files. The parent detail route must
render a standard `DetailView` followed by the inline child `ListView` for the
selected parent. Reuse the project detail/vendor pattern for route-scoped
resources and `AppRouterView` only if the existing route tree needs it; do not
add a tab or standalone APD entry when the approved design says inline.

Create nested child `create.route.vue`, `[permitApdId]/detail.route.vue`, and
`[permitApdId]/edit.route.vue` under the parent detail route directory. Use
standard `FormView` and `DetailView` shells. Pass exact parent/child titles,
legacy `Submit`, and success messages on the route wrappers. The child forms
must not render a category selector, parent ID, code, or audit field.

Use the generated route names after route discovery; do not invent a duplicate
static path. Verify one URL for each nested action.

**Verify**: run route resolution tests, the web type check, and the focused
resource test.

### Step 5: Add navigation, seed, and route/manifest assertions

Add one parent menu entry under `Work Permit` with exact title `APD` and gate
it with `view-permit-category-apd`. Do not add a child menu entry. Add the
parent title to the master-data index only if the existing index convention
requires it; do not add a standalone APD route. Register both API domains and
both catalog modules. Seed the design's eight parents and sixteen children by
stable IDs, with every child linked to the correct parent and all rows active.

Update central route/manifest tests for parent routes, nested child routes,
the inline child surface, the parent permission gate, and the absence of a
standalone APD menu entry. Run the seed twice and inspect the parent/child
hierarchy.

**Verify**: focused API/web tests, catalog test, seed smoke, route tests,
manifest tests, and route-map diff review all pass.

### Step 6: Complete browser acceptance and independent verification

Run every plan command and fill the checklist. In an authenticated T3 preview
verify category list, category detail, inline APD list, APD create/edit/delete,
parent-scoped routes, exact parent/child titles and labels, no standalone menu,
permission-hidden navigation, parent deletion blocked with a child, failed
action state, and reload after child and parent writes. Record URL, surface,
action, IDs, visible result, and failure message.

Invoke `$verify-ads-hk-module` read-only. Only a `PASS` permits `DONE`.

## Copied module acceptance checklist

Use statuses `TODO`, `PASS`, `APPROVED DIFFERENCE`, `SERVER SUPPLIED`,
`NOT NEEDED`, `REWORK`, `STOP`, and `BLOCKED`.

### 1. Scope and reference

- [ ] Parent/child ownership is recorded: `permit-category-apd` owns parent delete rule; `permit-apd` owns child FK.
- [ ] Design read: `docs/superpowers/specs/2026-08-19-permit-category-apd-design.md`.
- [ ] Legacy parent/child models, migrations, seeder, configs, and list/detail/create/edit surfaces read.
- [ ] Exact parent/child labels and absent standalone menu evidence recorded.
- [ ] Current project-vendor nested resource and parent detail patterns read.
- [ ] Every difference is classified.

### 2. Route and action matrix

| Surface | Legacy evidence | New route/action | Realm | Reused pattern | Evidence | Status |
|---|---|---|---|---|---|---|
| Parent list | parent config/menu | `/master-data/permit-category-apd` | system | `ListView` | browser | TODO |
| Parent row | shared CRUD | parent detail/edit/delete | system | resource row actions | browser | TODO |
| Parent detail | parent detail | `/:permitCategoryApdId/detail` + inline child `ListView` | system | `DetailView` + nested list | browser | TODO |
| Parent create | shared CRUD | `/create` | system | `FormView` | browser | TODO |
| Parent edit | shared CRUD | `/:permitCategoryApdId/edit` | system | `FormView` | browser | TODO |
| Child list | child filtered by parent | inline on parent detail | system | scoped `ListView` | browser | TODO |
| Child create | child parent fixed | `/detail/apd/create` | system | scoped `FormView` | browser | TODO |
| Child detail | child CRUD | `/detail/apd/:permitApdId/detail` | system | `DetailView` | browser | TODO |
| Child edit | child parent fixed | `/detail/apd/:permitApdId/edit` | system | scoped `FormView` | browser | TODO |
| Parent delete block | legacy FK behavior | reference validation while children exist | system | API guard | API/browser | TODO |
| APD menu | none | absent | — | no standalone entry | manifest | NOT NEEDED |

### 2a. User-facing labels

| Surface | Legacy label | New label | Status |
|---|---|---|---|
| Menu | `APD` | `APD` | TODO |
| Parent heading | `Kategori APD` | `Kategori APD` | TODO |
| Child heading | `APD` | `APD` | TODO |
| Fields/options | `Nama`, `Deskripsi`, `Status`, `Aktif`, `Tidak Aktif` | same | TODO |
| Parent/child action headings | exact legacy CRUD text | same | TODO |
| Submit/success | exact legacy text | same on route wrappers | TODO |
| Relation/code | hidden/API-only | absent in forms/menu | APPROVED DIFFERENCE |
| Validation/delete block | legacy behavior | repository standard messages | APPROVED DIFFERENCE |

### 3. Contract and data checks

- [ ] Parent and child database/API/resource/route field names match.
- [ ] Child FK has no cascade and parent delete is blocked while children exist.
- [ ] Parent and child six-permission catalogs use the system realm.
- [ ] Child list/detail/update/delete enforce parent scope and no cross-parent leak.
- [ ] Child create requires the parent and update cannot move it.
- [ ] Seed hierarchy is idempotent and matches the design.
- [ ] Seed smoke check passes.

### 4. Workflow and UI checks

- [ ] Parent CRUD uses standard views.
- [ ] APD list is inline under category detail; no standalone menu exists.
- [ ] Child CRUD uses standard `FormView`/`DetailView` nested routes.
- [ ] Child forms hide category ID/code/audit fields and keep parent initial data.
- [ ] First load, failed actions, and reload after parent/child writes are recorded.
- [ ] Parent delete block and successful delete after child removal are recorded.
- [ ] Authenticated T3/browser evidence exists or plan is `BLOCKED`.
- [ ] Browser evidence includes URL, surface, action, test IDs, result, and failure text.

### 5. Independent verification

- [ ] `$verify-ads-hk-module` reviewed current plan, design, diff, legacy, checklist, seed, checks, and browser journey.
- [ ] Verdict is `PASS`.
- [ ] No verifier `REWORK` or `BLOCKED` item remains.

### 6. Final evidence

- [ ] Focused parent/child API tests pass.
- [ ] Focused web tests pass.
- [ ] Type checks and lint pass.
- [ ] `git diff --check` passes.
- [ ] `Reused`, `Searched`, and `Gap` are recorded.
- [ ] No required item remains unchecked.

## Done criteria

- [ ] Both approved tables and the non-cascading child FK exist.
- [ ] Parent and child APIs enforce authentication, exact permissions, validation, audit values, and parent scoping.
- [ ] Parent deletion is blocked while children exist and succeeds after child removal.
- [ ] Seed creates the exact approved hierarchy idempotently.
- [ ] Parent CRUD and inline child CRUD use schema-bound resources and standard framework surfaces.
- [ ] Child forms have no visible relation selector, parent ID, code, or audit fields.
- [ ] Navigation has one gated `APD` parent entry and no standalone APD entry.
- [ ] Focused checks, type/lint, diff check, authenticated browser, and verifier `PASS` are recorded.
- [ ] No framework package or unrelated module changed.

## STOP conditions

- A predecessor is not `DONE`, or the live code cannot support the parent/child contract without an unapproved decision.
- A child scope can be bypassed, a child can move parent through update, or parent delete relies only on a database error.
- Legacy labels, titles, seed assignments, or menu absence differ from the design without approval.
- The framework lacks the required nested standard surface; record the exact gap and stop before changing it.
- A lookup route, generic nested abstraction, standalone child menu, or compatibility path appears necessary.
- Migration generation changes unrelated tables or adds cascade to the child FK.
- T3/browser remains unavailable after a valid retry; mark `BLOCKED` with `UI UNVERIFIED`.

## Reuse record

- **Reused**: project-vendor nested CRUD, project detail `DetailView` pattern, `AppRouterView` where applicable, standard resources and route targets, scoped API list/detail conventions, schema-bound fields, static radio source, and current navigation/test owners.
- **Searched**: approved design, all listed legacy parent/child evidence, architecture/framework docs, project-vendors, work-items, ITP child data, permit predecessor plans, route registry/catalog/seed, input registry, route tests, and manifest tests.
- **Gap**: none expected. Keep any unexpected gap route-local only after recording it; do not edit `packages/is-vue-framework`.

## Maintenance notes

The parent-child scope is an authorization and data-integrity boundary, not
only a URL convention. Any future APD consumer must use the child owner and
preserve the non-cascading category delete rule. Do not add a standalone APD
menu or move the child relation into a generic framework abstraction.
