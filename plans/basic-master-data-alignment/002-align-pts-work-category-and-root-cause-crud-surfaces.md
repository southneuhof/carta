# Plan 002: Align PTS Work Category and Root Cause CRUD surfaces

> **Implementation instructions**: Use `$ads-hk-module-slice`. Follow this
> plan in order. Run every verification command. If a STOP condition occurs,
> stop and report it. After implementation and review, change this plan row in
> `plans/basic-master-data-alignment/README.md` to DONE. Do not update the
> parent Plan 002 status until all of its subsets are complete.
>
> **Drift check (run first)**: `git diff --stat 823c800..HEAD -- apps/api/src/routes/master-data/master-data.entity.ts apps/api/src/routes/master-data/master-data.ts apps/web/src/routes/(authenticated)/master-data/master-data.resources.ts apps/web/src/routes/(authenticated)/master-data/pts-work-categories apps/web/src/routes/(authenticated)/master-data/root-causes apps/web/src/routes/(authenticated)/master-data/master-data.resources.spec.ts docs/current-administration-form-inventory.md`
> If an in-scope file changed, compare it with the current-state facts below.
> Stop if its resource or API contract differs from this plan.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**:
  `plans/basic-master-data-alignment/001-align-business-category-crud-surfaces.md`
- **Category**: bug
- **Planned at**: commit `823c800`, 2026-08-10

## Why this matters

PTS Work Categories and Root Causes are simple legacy catalogs. They are not
manual PTS workflow screens. Their current resource contracts already provide
standard CRUD, but do not explicitly expose every business field on every
surface. This plan gives both modules the same clear four-field contract before
manual PTS work starts.

## Current state

- Legacy models:
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/PtsWorkCategories.php`
  and
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/RootCauses.php`
  each expose list, view, add, edit, and delete with `name`, `code`,
  `description`, and `active`. Legacy code validation allows an empty code;
  the approved new contract requires a unique code.
- Legacy frontend configs:
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/pts-work-categories.ts`
  and
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/root-causes.ts`.
  The PTS config shows a smaller list, but the legacy model lists all four
  business fields. Use the common four-field surface defined in this plan.
- `apps/api/src/routes/master-data/master-data.entity.ts:100-130,214-237`
  defines both tables with generated UUID IDs, required unique `code`,
  required `name`, optional `description`, and default-true `active`.
- `apps/api/src/routes/master-data/master-data.ts:34-58,173-174` provides
  ordinary CRUD routes and matching view/manage permissions. Root Cause delete
  also protects referenced Quality PTS data; do not change that protection.
- `apps/web/src/routes/(authenticated)/master-data/master-data.resources.ts:240-275`
  defines both resources. Each has a three-column table and a four-field form,
  but neither defines `description` explicitly or an explicit detail surface.
- Existing create and edit routes for both modules use `FormView`; for example,
  `apps/web/src/routes/(authenticated)/master-data/pts-work-categories/create.route.vue:1-6`
  and
  `apps/web/src/routes/(authenticated)/master-data/root-causes/[rootCauseId]/edit.route.vue:1-9`.
- Use the same resource pattern as the Business Category plan. Do not add
  native route state, direct route fetches, or framework changes.

### Required field inventory

The same inventory applies to both modules.

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
- `apps/web/src/routes/(authenticated)/master-data/pts-work-categories/`
- `apps/web/src/routes/(authenticated)/master-data/root-causes/`

**Out of scope**:

- Quality/manual PTS screens and Root Cause workflow use
- Root Cause referenced-record delete protection
- Number Variables, Number Configurations, UOMs, and every related master-data
  module
- migrations, seed changes, generated IDs, audit fields, native forms, and
  framework packages

## Git workflow

- Branch: `codex/002-functional-administration-forms`
- Commit message: `fix(web): align PTS catalog surfaces`
- Do not push, open a pull request, or modify `packages/is-vue-framework`.

## Steps

### Step 1: Confirm both ordinary CRUD contracts

Read the API entity, API model, and all create/edit routes listed in Current
state. Confirm that both resources already use generated UUIDs, required
unique codes, required names, optional descriptions, active defaults, standard
CRUD routes, and `FormView`. Do not make an API, migration, or route change
when those facts hold.

**Verify**: `rg -n "ptsWorkCategories|rootCauses|ptsWorkCategoryModel|rootCauseModel|crypto.randomUUID" apps/api/src/routes/master-data/{master-data.entity.ts,master-data.ts}` → matches both existing entities and models.

### Step 2: Complete both resource field catalogs

In `master-data.resources.ts`, define `name`, `code`, `description`, and
`active` explicitly for both resources. Use the field labels `Name`, `Code`,
`Description`, and `Active`; use `text`, `text`, `textarea`, and `checkbox`.
Do not attach a source to scalar fields.

Set each module's table, detail, and form fields to `name`, `code`,
`description`, `active`. Keep the current Zod schema bridge, Hono operations,
CRUD capabilities, permission strings, typed targets, and FormView routes.

**Verify**: `pnpm --filter @southneuhof/framework-web test -- master-data.resources.spec.ts` → exit 0 after the focused test in Step 3 exists.

### Step 3: Extend the focused resource-surface test

Extend `master-data.resources.spec.ts` with PTS Work Category and Root Cause
assertions. Use the existing resource runtime and `resolveFields` helper. For
each resource, assert the table, detail, and form surfaces contain exactly the
four required business fields and map to the correct scalar renderers. Assert
that no ID or audit field is in either form.

Do not duplicate the Business Category assertions, mount route snapshots, or
make a browser pixel test.

**Verify**: `pnpm --filter @southneuhof/framework-web test -- master-data.resources.spec.ts` → exit 0 and both new module assertions pass.

### Step 4: Record and check the result

Update the PTS Work Categories and Root Causes tables in
`docs/current-administration-form-inventory.md` to match the required field
inventory. Mark Plan 002 DONE in this folder's README only after review.

**Verify**: `pnpm --filter @southneuhof/framework-web type-check && pnpm --filter @southneuhof/api type-check && git diff --check` → all commands exit 0.

## Test plan

- Extend `master-data.resources.spec.ts` only; follow its established runtime
  setup and field-resolution assertions.
- Cover the resource field arrays and scalar renderer contract. The API does
  not change in this plan, so do not add unrelated API tests.
- Do not add framework tests. These resources use no special renderer/source
  combination.

## Done criteria

- [ ] Both modules show name, code, description, and active on the table,
  detail, create, and edit surfaces.
- [ ] Both server contracts retain required unique codes and server-generated
  UUIDs.
- [ ] Root Cause referenced-record delete protection is unchanged.
- [ ] Existing routes remain `FormView` routes with their existing resources.
- [ ] The focused web test, both type checks, and `git diff --check` exit 0.
- [ ] No file outside Scope is modified.
- [ ] The local plan index marks Plan 002 DONE after review.

## STOP conditions

Stop and report if any condition occurs:

- Either live schema no longer makes `code` unique and required, or a migration
  is needed to meet this inventory.
- The resource configuration needs a renderer or source not supplied by the
  current framework.
- A change would alter Root Cause reference protection or enter Quality/manual
  PTS scope.
- The work requires a Number Variable, Number Configuration, or framework
  package change.

## Maintenance notes

PTS Work Categories are prerequisite catalog data for later manual PTS work.
Root Causes can be referenced by Quality PTS data. Future work must retain the
four-field resource surface and the current server-side delete protection.
