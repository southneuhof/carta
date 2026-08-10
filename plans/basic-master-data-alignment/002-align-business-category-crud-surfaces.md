# Plan 002: Align Business Category CRUD surfaces

> **Implementation instructions**: Use `$ads-hk-module-slice`. Read this plan
> and the legacy files in full before editing. Run every verification command.
> If a STOP condition occurs, stop and report it. Update this plan row only
> after implementation and review.
>
> **Drift check (run first)**: `git diff --stat e153b7b..HEAD -- apps/api/src/routes/business-categories "apps/web/src/routes/(authenticated)/master-data/business-categories" docs/current-administration-form-inventory.md`
> If a listed file changed, compare the contract below with the live code. Stop
> if the API, resource, or legacy field meaning differs.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**:
  `plans/basic-master-data-alignment/001-separate-resource-modules.md` and
  `plans/001-repair-shared-active-form-fields.md`
- **Category**: bug
- **Planned at**: commit `e153b7b`, 2026-08-10

## Why this matters

Business Categories are a legacy catalog and the parent lookup for Divisions.
After Plan 001, this module owns its API and resource files. This plan gives
the list, detail, create, and edit surfaces one clear business-field contract.
It does not add a second form path or change the data model.

## Current state

- Legacy model:
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/BusinessCategories.php`
  defines list, detail, create, update, and delete with `name`, `code`,
  `description`, and `active`.
- Legacy frontend:
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/business-categories.ts`
  exposes the same four business fields.
- Plan 001 creates
  `apps/api/src/routes/business-categories/business-categories.entity.ts` and
  `business-categories.ts`. They retain generated UUIDs, required `name`,
  required unique `code`, optional `description`, default-true `active`, and
  normal CRUD permissions.
- Plan 001 creates the local web resource and operations files at
  `apps/web/src/routes/(authenticated)/master-data/business-categories/`.
  The existing create and edit pages stay `FormView` pages in this folder.
- Follow the colocated Settings resource pattern in
  `apps/web/src/routes/(authenticated)/settings/roles/roles.resource.ts` and
  `roles.resource.spec.ts`. Do not add route-local form state.

### Required field inventory

| Field | API create/update | Table | Detail | Create/edit form | Renderer | Server supplied |
|---|---|---|---|---|---|---|
| `name` | required / optional | yes | yes | yes | text | no |
| `code` | required, unique / optional | yes | yes | yes | text | no |
| `description` | optional / optional | yes | yes | yes | textarea | no |
| `active` | optional, defaults true / optional | yes | yes | yes | checkbox | default only |
| `id`, audit fields | no / no | no | no | no | — | yes |

Legacy allows an empty code. The approved current contract keeps a required,
unique code. Do not restore legacy numeric IDs, Laravel audit columns, or a
manual ID input.

## Commands you will need

| Purpose | Command | Expected result |
|---|---|---|
| Focused web test | `pnpm --filter @southneuhof/framework-web test -- business-categories.resource.spec.ts` | exit 0 |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0, no type errors |
| API type check | `pnpm --filter @southneuhof/api type-check` | exit 0, no type errors |
| Diff check | `git diff --check` | exit 0 |

## Scope

**In scope**:

- `apps/web/src/routes/(authenticated)/master-data/business-categories/business-categories.resource.ts`
- `apps/web/src/routes/(authenticated)/master-data/business-categories/business-categories.resource.spec.ts`
- `docs/current-administration-form-inventory.md`
- this plan index row.

**Read and verify only**:

- `apps/api/src/routes/business-categories/business-categories.entity.ts`
- `apps/api/src/routes/business-categories/business-categories.ts`
- all four Business Category route pages.

**Out of scope**:

- Divisions and their lookup behavior;
- all other resource modules, migrations, seed data, and framework packages;
- generated IDs, audit fields, native forms, and direct route fetches.

## Steps

### Step 1: Confirm the normal CRUD contract

Read the local API entity, model, resource, and all four route pages. Confirm
the server supplies IDs and audit data, while `name`, `code`, `description`,
and `active` use the required inventory. Do not write a migration, route, or
operation when the contract already matches.

**Verify**: `rg -n "businessCategories|businessCategoryModel|crypto.randomUUID|code.*unique" apps/api/src/routes/business-categories` matches the entity and model.

### Step 2: Make the local resource catalog complete

In `business-categories.resource.ts`, define all four business fields with
labels `Name`, `Code`, `Description`, and `Active`. Use renderers `text`,
`text`, `textarea`, and `checkbox`. Text and textarea fields have no source.

Set table, detail, and form field order to `name`, `code`, `description`,
`active`. Keep the existing normalized operations, schemas, permissions, route
targets, and FormView pages.

**Verify**: the focused web test passes after Step 3.

### Step 3: Add one local resource-surface test

Extend `business-categories.resource.spec.ts`. Assert table, detail, and form
resolve exactly the four required business fields in order. Assert form
renderers are `text`, `text`, `textarea`, and `checkbox`, with no source and
no ID or audit field. Do not add route snapshots, browser pixel tests, or a
CRUD test matrix.

**Verify**: run the focused web test. It exits 0.

### Step 4: Record and check the result

Update the Business Categories entry in
`docs/current-administration-form-inventory.md`. Mark Plan 002 DONE only after
review.

**Verify**: run both type checks and `git diff --check`. All exit 0.

## Done criteria

- [ ] List, detail, create, and edit use the four required business fields in
  the documented order.
- [ ] `code` and `name` remain required; `code` remains unique; IDs remain
  server-generated.
- [ ] The pages remain local `FormView` pages using the local resource.
- [ ] The focused web test, both type checks, and `git diff --check` exit 0.

## STOP conditions

Stop and report if the server no longer enforces required unique code, a
migration is needed, a renderer needs a framework change, or the work needs a
Division lookup change.

## Maintenance notes

Business Categories remain a Division lookup. Future Division work imports this
local resource. It must not ask users to enter an ID.
