# Plan 001: Align Business Category CRUD surfaces

> **Implementation instructions**: Use `$ads-hk-module-slice`. Follow this
> plan in order. Run every verification command. If a STOP condition occurs,
> stop and report it. After implementation and review, change this plan row in
> `plans/basic-master-data-alignment/README.md` to DONE. Do not update the
> parent Plan 002 status until all of its subsets are complete.
>
> **Drift check (run first)**: `git diff --stat 823c800..HEAD -- apps/api/src/routes/master-data/master-data.entity.ts apps/api/src/routes/master-data/master-data.ts apps/web/src/routes/(authenticated)/master-data/master-data.resources.ts apps/web/src/routes/(authenticated)/master-data/business-categories apps/web/src/routes/(authenticated)/master-data/master-data.resources.spec.ts docs/current-administration-form-inventory.md`
> If an in-scope file changed, compare it with the current-state facts below.
> Stop if its resource or API contract differs from this plan.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: shared active-form-field baseline in
  `plans/001-repair-shared-active-form-fields.md`
- **Category**: bug
- **Planned at**: commit `823c800`, 2026-08-10

## Why this matters

Business Categories are a legacy master-data catalog and the parent lookup for
Divisions. The current resource has standard CRUD and uses `FormView`, but its
table and detail surfaces do not explicitly expose all business fields. This
plan makes the field contract clear and equal across list, detail, create, and
edit. It does not add a second form path or change the data model.

## Current state

- Legacy model:
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/BusinessCategories.php`
  defines list, view, add, edit, and delete with `name`, `description`,
  `code`, and `active`. Legacy code validation permits an empty code; the
  accepted new contract requires a unique code.
- Legacy frontend:
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/business-categories.ts`
  exposes `name`, `code`, `description`, and `active`.
- `apps/api/src/routes/master-data/master-data.entity.ts:19-29` defines the
  `business_categories` table. `id` uses `crypto.randomUUID()`, `code` and
  `name` are required, `code` is unique, and `active` defaults to `true`.
- `apps/api/src/routes/master-data/master-data.ts:34-58,167` gives the model
  normal list/detail/create/update/delete routes with view/manage permission
  checks and trims `code` before write.
- `apps/web/src/routes/(authenticated)/master-data/master-data.resources.ts:103-123`
  defines the resource. It currently has table fields `code`, `name`, and
  `active`; its form includes `description`, but it has no explicit detail
  surface or explicit description field definition.
- The create and edit routes already use `FormView`:
  `apps/web/src/routes/(authenticated)/master-data/business-categories/create.route.vue:1-6`
  and
  `apps/web/src/routes/(authenticated)/master-data/business-categories/[businessCategoryId]/edit.route.vue:1-9`.
- Follow the existing resource pattern in
  `apps/web/src/routes/(authenticated)/master-data/master-data.resources.ts:132-146`:
  `defineFields`, explicit table/detail/form field arrays, Zod schema bridge,
  and standard resource capabilities. Do not add native route state.

### Required field inventory

| Field | API create/update | Table | Detail | Create/edit form | Renderer | Server supplied |
|---|---|---|---|---|---|---|
| `name` | required / optional | yes | yes | yes | text | no |
| `code` | required, unique / optional | yes | yes | yes | text | no |
| `description` | optional / optional | yes | yes | yes | textarea | no |
| `active` | optional, defaults true / optional | yes | yes | yes | checkbox | default only |
| `id`, audit fields | no / no | no | no | no | — | yes |

## Commands you will need

| Purpose | Command | Expected result |
|---|---|---|
| Focused web test | `pnpm --filter @southneuhof/framework-web test -- master-data.resources.spec.ts` | exit 0 |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0, no type errors |
| API type check | `pnpm --filter @southneuhof/api type-check` | exit 0, no type errors |
| Diff check | `git diff --check` | exit 0 |

## Scope

**In scope**:

- `apps/web/src/routes/(authenticated)/master-data/master-data.resources.ts`
- `apps/web/src/routes/(authenticated)/master-data/master-data.resources.spec.ts`
- `docs/current-administration-form-inventory.md`
- `plans/basic-master-data-alignment/README.md` status row

**Read and verify, but do not modify unless this plan's STOP conditions are
cleared by a plan revision**:

- `apps/api/src/routes/master-data/master-data.entity.ts`
- `apps/api/src/routes/master-data/master-data.ts`
- `apps/web/src/routes/(authenticated)/master-data/business-categories/`

**Out of scope**:

- Divisions and their Business Category lookup behavior
- all other master-data modules, migrations, seed changes, and framework code
- client-generated IDs, manually entered audit fields, and native forms

## Git workflow

- Branch: `codex/002-functional-administration-forms`
- Commit message: `fix(web): align business category surfaces`
- Do not push, open a pull request, or modify `packages/is-vue-framework`.

## Steps

### Step 1: Confirm the normal CRUD contract

Read the API entity, API model, and the two Business Category routes named in
Current state. Confirm that the existing server contract already has generated
UUIDs, required unique `code`, required `name`, optional `description`,
defaulted `active`, and normal CRUD permissions. Do not write a migration,
route, or operation when those facts hold.

**Verify**: `rg -n "businessCategories|businessCategoryModel|crypto.randomUUID|code.*unique" apps/api/src/routes/master-data/{master-data.entity.ts,master-data.ts}` → matches the existing entity and model.

### Step 2: Make the resource field catalog complete

In `master-data.resources.ts`, make the Business Category field definitions
explicit for all four business fields. Use `Code`, `Name`, `Description`, and
`Active` as field labels. Use the existing `text`, `textarea`, and `checkbox`
renderers. Do not give text or textarea fields a source.

Set table, detail, and form field arrays to the required inventory order:
`name`, `code`, `description`, `active`. Keep the existing Zod schema bridge,
normalized Hono operations, permissions, targets, and `FormView` routes.

**Verify**: `pnpm --filter @southneuhof/framework-web test -- master-data.resources.spec.ts` → exit 0 after the focused test in Step 3 exists.

### Step 3: Add one focused resource-surface regression test

Extend `master-data.resources.spec.ts` using its existing resource-runtime
setup. Assert Business Categories resolve the same four business fields on the
table, detail, and form surfaces, and that their form renderers are `text`,
`text`, `textarea`, and `checkbox`. Assert that no ID or audit field is in the
form fields. Do not add route snapshots, browser pixel tests, or a CRUD test
matrix.

**Verify**: `pnpm --filter @southneuhof/framework-web test -- master-data.resources.spec.ts` → exit 0 and the new Business Category assertion passes.

### Step 4: Record and check the result

Update the Business Categories table in
`docs/current-administration-form-inventory.md` to match the required field
inventory. Mark Plan 001 DONE in this folder's README only after review.

**Verify**: `pnpm --filter @southneuhof/framework-web type-check && pnpm --filter @southneuhof/api type-check && git diff --check` → all commands exit 0.

## Test plan

- Extend `master-data.resources.spec.ts`; use its existing `resolveFields`
  helper and resource runtime setup.
- Cover only the standard field surface and renderer contract. The API already
  has a generic CRUD model and this plan does not change it.
- Do not add a framework test. A normal resource configuration has no special
  source or renderer combination.

## Done criteria

- [ ] Business Category list, detail, create, and edit use the four required
  business fields in the documented order.
- [ ] `code` and `name` remain required in the server contract; `code` remains
  unique; IDs remain server-generated.
- [ ] The routes remain `FormView` routes with the existing resource.
- [ ] The focused web test, both type checks, and `git diff --check` exit 0.
- [ ] No file outside Scope is modified.
- [ ] The local plan index marks Plan 001 DONE after review.

## STOP conditions

Stop and report if any condition occurs:

- The live schema no longer makes `code` unique and required, or the API needs
  a database migration to meet the field inventory.
- A resource field requires a renderer or source that the existing framework
  does not support.
- The work needs a Division lookup or any change outside the listed scope.
- An existing source change makes the legacy field meaning unclear.

## Maintenance notes

Business Categories remain a Division lookup. Future Division work must use
this resource as its source and must not add an ID text input. If new business
fields are later added, update all three resource surfaces and this inventory
together.
