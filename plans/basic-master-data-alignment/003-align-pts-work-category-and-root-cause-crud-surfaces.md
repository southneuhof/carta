# Plan 003: Align PTS Work Category and Root Cause CRUD surfaces

> **Implementation instructions**: Use `$ads-hk-module-slice`. Read this plan
> and both legacy modules in full before editing. Run every verification command.
> If a STOP condition occurs, stop and report it. Update this plan row only
> after implementation and review.
>
> **Drift check (run first)**: `git diff --stat e153b7b..HEAD -- apps/api/src/routes/pts-work-categories apps/api/src/routes/root-causes "apps/web/src/routes/(authenticated)/master-data/pts-work-categories" "apps/web/src/routes/(authenticated)/master-data/root-causes" docs/current-administration-form-inventory.md`
> If a listed file changed, compare the contract below with the live code. Stop
> if the API, resource, or legacy field meaning differs.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**:
  `plans/basic-master-data-alignment/001-separate-resource-modules.md` and
  `plans/basic-master-data-alignment/002-align-business-category-crud-surfaces.md`
- **Category**: bug
- **Planned at**: commit `e153b7b`, 2026-08-10

## Why this matters

PTS Work Categories and Root Causes are ordinary legacy catalogs. They are not
manual PTS workflow screens. After Plan 001, each owns a local API and web
module. This plan gives both modules the same clear four-field contract before
manual PTS work starts.

## Current state

- Legacy models:
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/PtsWorkCategories.php`
  and
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/RootCauses.php`
  define list, detail, create, update, and delete with `name`, `code`,
  `description`, and `active`.
- Legacy frontend configs:
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/pts-work-categories.ts`
  and
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/root-causes.ts`
  expose the catalog fields.
- Plan 001 creates one API module and one local web resource module for each
  catalog. Both retain generated UUIDs, required unique code, required name,
  optional description, active default, normal CRUD permissions, and FormView
  pages.
- Root Cause delete protection for referenced QHSSE PTS data stays in the local
  Root Cause API module. It is not a field-parity change.
- Follow the local Settings resource and resource-test pattern. Do not add
  native forms, direct route fetches, or framework changes.

### Required field inventory

| Field | API create/update | Table | Detail | Create/edit form | Renderer | Server supplied |
|---|---|---|---|---|---|---|
| `name` | required / optional | yes | yes | yes | text | no |
| `code` | required, unique / optional | yes | yes | yes | text | no |
| `description` | optional / optional | yes | yes | yes | textarea | no |
| `active` | optional, defaults true / optional | yes | yes | yes | checkbox | default only |
| `id`, audit fields | no / no | no | no | no | — | yes |

Legacy permits an empty code. The approved current contract keeps a required,
unique code. Do not restore legacy numeric IDs or Laravel audit fields.

## Commands you will need

| Purpose | Command | Expected result |
|---|---|---|
| PTS Work Category test | `pnpm --filter @southneuhof/framework-web test -- pts-work-categories.resource.spec.ts` | exit 0 |
| Root Cause test | `pnpm --filter @southneuhof/framework-web test -- root-causes.resource.spec.ts` | exit 0 |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0, no type errors |
| API type check | `pnpm --filter @southneuhof/api type-check` | exit 0, no type errors |
| Diff check | `git diff --check` | exit 0 |

## Scope

**In scope**:

- the local PTS Work Category resource and resource-spec files;
- the local Root Cause resource and resource-spec files;
- `docs/current-administration-form-inventory.md`; and
- this plan index row.

**Read and verify only**:

- `apps/api/src/routes/pts-work-categories/`;
- `apps/api/src/routes/root-causes/`; and
- all local list, create, detail, and edit pages for both modules.

**Out of scope**:

- Quality and manual PTS screens or Root Cause workflow use;
- Root Cause delete protection;
- Number Variables, Number Configurations, UOMs, and all related modules;
- migrations, seed data, generated IDs, audit fields, native forms, and
  framework packages.

## Steps

### Step 1: Confirm both normal CRUD contracts

Read the two local API entities and models and every listed page. Confirm both
resources use generated IDs, required unique code, required name, optional
description, active default, normal CRUD permissions, and FormView. Do not make
an API, migration, or route change when these facts hold.

**Verify**: `rg -n "ptsWorkCategories|rootCauses|ptsWorkCategoryModel|rootCauseModel|crypto.randomUUID" apps/api/src/routes/{pts-work-categories,root-causes}` matches both local entities and models.

### Step 2: Complete both local resource catalogs

In each local `*.resource.ts`, define `name`, `code`, `description`, and
`active` with labels `Name`, `Code`, `Description`, and `Active`. Use `text`,
`text`, `textarea`, and `checkbox`. Scalar fields have no source.

Set table, detail, and form field order to `name`, `code`, `description`,
`active`. Keep normalized operations, schemas, permissions, route targets, and
FormView pages.

**Verify**: the focused web tests pass after Step 3.

### Step 3: Add one local resource-surface test for each catalog

Extend each local `*.resource.spec.ts`. Assert table, detail, and form resolve
exactly the four required business fields in order. Assert the scalar form
renderers, no source, and no ID or audit field. Do not add route snapshots,
browser pixel tests, or duplicate Business Category assertions.

**Verify**: run the focused web tests. They exit 0.

### Step 4: Record and check the result

Update PTS Work Categories and Root Causes in
`docs/current-administration-form-inventory.md`. Mark Plan 003 DONE only after
review.

**Verify**: run both type checks and `git diff --check`. All exit 0.

## Done criteria

- [ ] Both modules show name, code, description, and active on list, detail,
  create, and edit surfaces.
- [ ] Both server contracts keep required unique code and server-generated IDs.
- [ ] Root Cause referenced-record delete protection is unchanged.
- [ ] Pages remain local FormView pages using their local resources.
- [ ] Focused web tests, both type checks, and `git diff --check` exit 0.

## STOP conditions

Stop and report if a server contract needs a migration, a resource needs an
unsupported renderer or source, Root Cause delete protection changes, or work
enters Quality/manual PTS, Number Variable, Number Configuration, or framework
scope.

## Maintenance notes

PTS Work Categories are manual PTS prerequisite data. Root Causes can be
referenced by Quality PTS data. Future work must retain their local ownership
and current server-side delete protection.
