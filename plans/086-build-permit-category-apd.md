# Plan 086: Implement permit-category-apd and nested permit-apd

> **Implementation instructions**: Execute this plan only after Plans 082–085
> are `DONE`. This plan owns both the parent `permit-category-apd` resource and
> its nested `permit-apd` child. Follow the dependency order below. Preserve
> unrelated dirty work. Do not add a standalone APD menu entry, a generic
> nested-resource abstraction, a lookup endpoint, or framework changes. Use
> High or Extra High reasoning only (`high` or `xhigh`); never use Low or
> Medium. If delegated, use GPT 5.6 Luna at Extra High reasoning and do not set
> a service tier.
>
> **Drift check (run first)**:
> `git diff --stat 4e94c94..HEAD -- apps/api/src/routes/permit-category-apd apps/api/src/routes/permit-apd apps/api/src/routes/index.ts apps/api/src/authorization/catalog.ts apps/api/scripts/seed.ts apps/web/src/routes/'(authenticated)'/master-data/permit-category-apd apps/web/src/manifest/navigation.ts apps/web/src/routes/'(authenticated)'/master-data/index.route.vue apps/web/src/router/__tests__/routes.spec.ts apps/web/src/manifest/__tests__/manifest.spec.ts packages/is-vue-framework`
> Completed predecessor edits to shared files are expected. Compare them with
> live code; stop only for an unresolved parent/child contract or unrelated
> edit.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: `plans/082-build-permit-work-types.md`, `plans/083-build-permit-danger-source.md`, `plans/084-build-permit-attachment.md`, `plans/085-build-safety-checklist.md`
- **Category**: direction
- **Planned at**: commit `4e94c94`, 2026-08-19

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

The parent detail route renders the child route area. The APD child index route
owns the list, and the child create/detail/edit routes are its sibling routes.
The child has no standalone menu entry or standalone master-data page.

## Fast-path classification

This plan is not eligible for `simple-master-data`. It owns a parent/child
relation, scoped child API actions, nested route surfaces, and a parent-delete
workflow guard. These are outside the bounded standard-CRUD fast path. Do not
run `pnpm scaffold:master-data`; keep the parent and child field inventories
explicit and follow the full module workflow. Use High or Extra High reasoning
only, and do not set a service tier when delegating.

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

- `/master-data/permit-category-apd/:permitCategoryApdId/detail/apd`;
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
| Parent list entry | parent config/menu | `/master-data/permit-category-apd`, parent `resource.list()` | parent view/list | `ListView` | route/browser | PASS |
| Parent list row | shared CRUD list | parent detail/edit/delete | parent detail/update/delete | standard row actions | browser | PASS |
| Parent detail | parent detail surface | `/:permitCategoryApdId/detail` plus nested APD route area | parent detail; child route | `DetailView` + `AppRouterView` | browser | PASS |
| Parent create | parent create surface | `/create` | parent create | `FormView` | browser | PASS |
| Parent edit | parent edit surface | `/:permitCategoryApdId/edit` | parent update | `FormView` | browser | PASS |
| Child list | child filtered by category | `/:permitCategoryApdId/detail/apd` | child view/list | scoped `ListView` | browser | PASS |
| Child row | child CRUD list | child detail/edit/delete nested routes | child detail/update/delete | scoped resource | browser | PASS |
| Child create | child create with parent ID | `/detail/apd/create` | child create | `FormView`, initial parent ID | browser | PASS |
| Child edit | child edit, parent fixed | `/detail/apd/:permitApdId/edit` | child update | `FormView` | browser | PASS |
| Parent delete with children | legacy delete blocked | API validation error, UI failed action | parent delete | server reference check | API/browser | PASS |
| Standalone APD menu | explicitly absent | no menu entry | — | `NOT NEEDED` | manifest test | NOT NEEDED |

### User-facing label ledger

| Surface | Legacy label | New label | Status |
|---|---|---|---|
| Parent menu | `APD` | `APD` | PASS |
| Parent heading | `Kategori APD` | `Kategori APD` | PASS |
| Child heading | `APD` | `APD` | PASS |
| Parent/child fields | `Nama`, `Deskripsi`, `Status` | same | PASS |
| Active options | `Aktif`, `Tidak Aktif` | same | PASS |
| Parent create/detail/edit headings | exact shared CRUD text with `Kategori APD` | same | PASS |
| Child create/detail/edit headings | exact shared CRUD text with `APD` | same | PASS |
| Submit/success | exact shared CRUD text | same on route wrapper | PASS |
| Relation/code | hidden/API-only | not visible | APPROVED DIFFERENCE |
| Validation | `Harus diisi!` | repository standard error | APPROVED DIFFERENCE |
| Delete block | legacy blocked behavior | repository standard reference error | APPROVED DIFFERENCE |

## Commands and verification gates

| Purpose | Command | Expected result |
|---|---|---|
| Migration generation | `pnpm --filter @southneuhof/api db:generate` | one migration creating both approved tables; no unrelated schema change |
| Migration apply | `pnpm --filter @southneuhof/api db:migrate` | exit 0; child FK has no cascade |
| API tests | `pnpm --filter @southneuhof/api test:focused -- src/routes/permit-category-apd/permit-category-apd.routes.spec.ts src/routes/permit-apd/permit-apd.routes.spec.ts` | two focused API files pass |
| Web tests | `pnpm --filter @southneuhof/framework-web test:focused -- 'routes/(authenticated)/master-data/permit-category-apd/permit-category-apd.resource.spec.ts' 'routes/(authenticated)/master-data/permit-category-apd/permit-apd.resource.spec.ts' 'router/__tests__/routes.spec.ts' 'manifest/__tests__/manifest.spec.ts'` | focused parent/child resource, route, and manifest tests pass |
| Type checks | `pnpm --filter @southneuhof/api type-check` and `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Lint | `pnpm --filter @southneuhof/api lint:focused -- src/routes/permit-category-apd src/routes/permit-apd` and `pnpm --filter @southneuhof/framework-web lint:focused -- 'src/routes/(authenticated)/master-data/permit-category-apd' 'src/routes/(authenticated)/master-data/index.route.vue' 'src/manifest/navigation.ts' 'src/manifest/__tests__/manifest.spec.ts' 'src/router/__tests__/routes.spec.ts'` | exit 0; existing warnings are recorded |
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

### Step 4: Add parent detail outlet and nested route shells

Create parent list/create/detail/edit route files. The parent detail route must
render only the parent `DetailView`, the standard nested-route tab entry, and
`AppRouterView`. Reuse the project detail/vendor pattern: add an `apd/index`
route that owns the scoped child `ListView`, so child create/detail/edit
replaces that list in the router outlet. Do not add a standalone APD menu entry.

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

Update central route/manifest tests for parent routes, the nested child index
and CRUD routes, the parent permission gate, and the absence of a standalone
APD menu entry. Run the seed twice and inspect the parent/child hierarchy.

**Verify**: focused API/web tests, catalog test, seed smoke, route tests,
manifest tests, and route-map diff review all pass.

### Step 6: Complete browser acceptance and independent verification

Run every plan command and fill the checklist. In an authenticated Codex browser
verify category list, category detail, nested APD list, APD create/edit/delete,
parent-scoped routes, exact parent/child titles and labels, no standalone menu,
permission-hidden navigation, parent deletion blocked with a child, failed
action state, and reload after child and parent writes. Record URL, surface,
action, IDs, visible result, and failure message.

Invoke `$verify-ads-hk-module` read-only. Only a `PASS` permits `DONE`.

## Execution evidence

- Migration: `apps/api/drizzle/20260819141536_damp_scarlet_witch/migration.sql` creates only `permit_category_apd` and `permit_apd`; the child foreign key has no cascade.
- API focused tests: two files, four tests passed. They cover authentication, exact permissions, validation, audited CRUD, nullable unique codes, parent scope, mismatch `404`, fixed parent relation, child deletion, and parent delete blocking.
- Web focused tests: parent/child resource, route, and manifest tests passed (four files, thirteen tests). API and web type checks passed. Focused API lint passed; focused web lint passed with existing Prettier warnings and no errors. `git diff --check` passed.
- Seed ran twice. Database verification found eight parents and sixteen children with the exact approved names and assignments, with no duplicate stable IDs.
- Authenticated Codex browser evidence:
  - `/master-data/permit-category-apd` showed the `APD` menu entry, eight seeded categories, and only `Nama`, `Deskripsi`, `Status`.
  - `/master-data/permit-category-apd/permit-category-apd-1/detail/apd` showed `Detail Kategori APD`, the nested `APD` list, and `Helmet`.
  - Temporary parent `03fcb363-7e9f-4c36-b07a-853538b1f80b` covered parent create, child create at `/detail/apd/create`, child detail, child edit, reload with `Browser Helmet 086 Updated`, child delete, and an empty nested list after delete.
  - A seeded parent delete attempt showed `Could not delete record.` while children existed. After child removal, the temporary parent was deleted successfully and the final list returned to the eight seeded rows. Temporary parent `961be3fe-d8a0-4b15-ad9a-c9f8691d433f` also covered parent edit and was removed.
- Route architecture correction verified in the authenticated browser: the parent detail owns the parent summary and nested route outlet; `/master-data/permit-category-apd/permit-category-apd-1/detail/apd` shows the APD list, while `/master-data/permit-category-apd/permit-category-apd-1/detail/apd/create` shows `Tambah APD` without `Helmet`. The child form replaces the child list instead of rendering below it.
- Route registry regression verified by navigating from category 1 to category 2 without a full reload: category 2 loads its scoped APD list without `Route action conflict`. The child resource uses one stable route metadata key and a parent-scoped list namespace.
- Read-only `$verify-ads-hk-module` review verdict: `PASS`. Reused the project-vendor nested resource, standard framework views, scoped API conventions, schema-bound fields, and existing route/navigation owners. No framework package change or unresolved gap remains.

## Copied module acceptance checklist

Use statuses `TODO`, `PASS`, `APPROVED DIFFERENCE`, `SERVER SUPPLIED`,
`NOT NEEDED`, `REWORK`, `STOP`, and `BLOCKED`.

### 1. Scope and reference

- [x] Parent/child ownership is recorded: `permit-category-apd` owns parent delete rule; `permit-apd` owns child FK.
- [x] Design read: `docs/superpowers/specs/2026-08-19-permit-category-apd-design.md`.
- [x] Legacy parent/child models, migrations, seeder, configs, and list/detail/create/edit surfaces read.
- [x] Exact parent/child labels and absent standalone menu evidence recorded.
- [x] Current project-vendor nested resource and parent detail patterns read.
- [x] Every difference is classified.

### 2. Route and action matrix

| Surface | Legacy evidence | New route/action | Realm | Reused pattern | Evidence | Status |
|---|---|---|---|---|---|---|
| Parent list | parent config/menu | `/master-data/permit-category-apd` | system | `ListView` | browser | PASS |
| Parent row | shared CRUD | parent detail/edit/delete | system | resource row actions | browser | PASS |
| Parent detail | parent detail | `/:permitCategoryApdId/detail` + nested child outlet | system | `DetailView` + `AppRouterView` | browser | PASS |
| Parent create | shared CRUD | `/create` | system | `FormView` | browser | PASS |
| Parent edit | shared CRUD | `/:permitCategoryApdId/edit` | system | `FormView` | browser | PASS |
| Child list | child filtered by parent | `/detail/apd` | system | scoped `ListView` child route | browser | PASS |
| Child create | child parent fixed | `/detail/apd/create` | system | scoped `FormView` | browser | PASS |
| Child detail | child CRUD | `/detail/apd/:permitApdId/detail` | system | `DetailView` | browser | PASS |
| Child edit | child parent fixed | `/detail/apd/:permitApdId/edit` | system | scoped `FormView` | browser | PASS |
| Parent delete block | legacy FK behavior | reference validation while children exist | system | API guard | API/browser | PASS |
| APD menu | none | absent | — | no standalone entry | manifest | NOT NEEDED |

### 2a. User-facing labels

| Surface | Legacy label | New label | Status |
|---|---|---|---|
| Menu | `APD` | `APD` | PASS |
| Parent heading | `Kategori APD` | `Kategori APD` | PASS |
| Child heading | `APD` | `APD` | PASS |
| Fields/options | `Nama`, `Deskripsi`, `Status`, `Aktif`, `Tidak Aktif` | same | PASS |
| Parent/child action headings | exact legacy CRUD text | same | PASS |
| Submit/success | exact legacy text | same on route wrappers | PASS |
| Relation/code | hidden/API-only | absent in forms/menu | APPROVED DIFFERENCE |
| Validation/delete block | legacy behavior | repository standard messages | APPROVED DIFFERENCE |

### 3. Contract and data checks

- [x] Parent and child database/API/resource/route field names match.
- [x] Child FK has no cascade and parent delete is blocked while children exist.
- [x] Parent and child six-permission catalogs use the system realm.
- [x] Child list/detail/update/delete enforce parent scope and no cross-parent leak.
- [x] Child create requires the parent and update cannot move it.
- [x] Seed hierarchy is idempotent and matches the design.
- [x] Seed smoke check passes.

### 4. Workflow and UI checks

- [x] Parent CRUD uses standard views.
- [x] APD list is a nested child route under category detail; no standalone menu exists.
- [x] Child CRUD uses standard `FormView`/`DetailView` nested routes.
- [x] Child forms hide category ID/code/audit fields and keep parent initial data.
- [x] First load, failed actions, and reload after parent/child writes are recorded.
- [x] Parent delete block and successful delete after child removal are recorded.
- [x] Authenticated Codex browser evidence exists.
- [x] Browser evidence includes URL, surface, action, test IDs, result, and failure text.

### 5. Independent verification

- [x] `$verify-ads-hk-module` reviewed current plan, design, diff, legacy, checklist, seed, checks, and browser journey.
- [x] Verdict is `PASS`.
- [x] No verifier `REWORK` or `BLOCKED` item remains.

### 6. Final evidence

- [x] Focused parent/child API tests pass.
- [x] Focused web tests pass.
- [x] Type checks and lint pass.
- [x] `git diff --check` passes.
- [x] `Reused`, `Searched`, and `Gap` are recorded.
- [x] No required item remains unchecked.

## Done criteria

- [x] Both approved tables and the non-cascading child FK exist.
- [x] Parent and child APIs enforce authentication, exact permissions, validation, audit values, and parent scoping.
- [x] Parent deletion is blocked while children exist and succeeds after child removal.
- [x] Seed creates the exact approved hierarchy idempotently.
- [x] Parent CRUD and nested child CRUD use schema-bound resources and standard framework surfaces.
- [x] Child forms have no visible relation selector, parent ID, code, or audit fields.
- [x] Navigation has one gated `APD` parent entry and no standalone APD entry.
- [x] Focused checks, type/lint, diff check, authenticated browser, and verifier `PASS` are recorded.
- [x] No framework package or unrelated module changed.

## STOP conditions

- A predecessor is not `DONE`, or the live code cannot support the parent/child contract without an unapproved decision.
- A child scope can be bypassed, a child can move parent through update, or parent delete relies only on a database error.
- Legacy labels, titles, seed assignments, or menu absence differ from the design without approval.
- The framework lacks the required nested standard surface; record the exact gap and stop before changing it.
- A lookup route, generic nested abstraction, standalone child menu, or compatibility path appears necessary.
- Migration generation changes unrelated tables or adds cascade to the child FK.
- Authenticated Codex browser remains unavailable after a valid retry; mark `BLOCKED` with `UI UNVERIFIED`.

## Reuse record

- **Reused**: project-vendor nested CRUD, project detail `DetailView` pattern, `AppRouterView` where applicable, standard resources and route targets, scoped API list/detail conventions, schema-bound fields, static radio source, and current navigation/test owners.
- **Searched**: approved design, all listed legacy parent/child evidence, architecture/framework docs, project-vendors, work-items, ITP child data, permit predecessor plans, route registry/catalog/seed, input registry, route tests, and manifest tests.
- **Gap**: none expected. Keep any unexpected gap route-local only after recording it; do not edit `packages/is-vue-framework`.

## Maintenance notes

The parent-child scope is an authorization and data-integrity boundary, not
only a URL convention. Any future APD consumer must use the child owner and
preserve the non-cascading category delete rule. Do not add a standalone APD
menu or move the child relation into a generic framework abstraction.
