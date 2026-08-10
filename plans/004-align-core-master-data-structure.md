# Plan 004: Align manual PTS prerequisite master data

> **Implementation instructions**: Use `$ads-hk-module-slice` for each module
> group. Follow this plan after Plan 003. Use one
> new Drizzle migration. Do not edit an applied migration or import legacy
> rows.
>
> **Drift check (run first)**: `git diff --stat abb232f..HEAD -- apps/api/src/routes/master-data apps/api/drizzle apps/api/src/__tests__ apps/web/src/routes/(authenticated)/master-data docs/manual-pts-parity.md`
> Compare changed field lists with the ledger before you change code.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: `plans/003-establish-legacy-parity-ledger.md`
- **Category**: migration
- **Planned at**: commit `abb232f`, 2026-08-10

## Why this matters

Manual PTS needs valid divisions, projects, work-item trees, PTS categories,
root causes, vendors, and number configuration. The current database holds
these records, but the legacy project `short_name` and UOM `uom_type` are
absent, while several retained fields are hidden from the web resource. This
plan gives the first PTS slice one agreed database and API contract.

## Current state

- `apps/api/src/routes/master-data/master-data.entity.ts:25-175` defines the
  ten direct PTS prerequisite tables. `projects` has no `shortName`; `uoms`
  has no `uomType`.
- `apps/api/src/routes/master-data/master-data.ts:49-131` validates active
  parents and work-item tree ownership. Extend this function; do not add a
  second validation path.
- `apps/api/src/routes/qhsse-pts/qhsse-pts.service.ts:69-125` is the current
  server-side style for validating active PTS references and a same-project
  leaf work item.
- `apps/web/src/routes/(authenticated)/master-data/master-data.resources.ts:118-176`
  displays only a small part of the current Division and Project contracts.
- Legacy fields are in `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/Projects.php`,
  `Uoms.php`, `WorkItems.php`, `PtsWorkCategories.php`, and `RootCauses.php`.
  The ledger from Plan 003 is the authority for their new mappings.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Generate migration | `pnpm --filter @southneuhof/api db:generate` | One new reviewed migration |
| API type check | `pnpm --filter @southneuhof/api type-check` | Exit 0, no errors |
| API lint | `pnpm --filter @southneuhof/api lint` | Exit 0 |
| API tests | `pnpm --filter @southneuhof/api test` | Exit 0 with the configured test database |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | Exit 0, no errors |

## Scope

**In scope:** `apps/api/src/routes/master-data/`, one generated API migration,
`apps/api/src/__tests__/master-data.spec.ts` (create),
`apps/web/src/routes/(authenticated)/master-data/`,
`docs/manual-pts-parity.md`.

**Out of scope:** new master-data families, QI, PTS transitions, data import,
framework packages, and non-PTS application routes.

## Git workflow

- Keep the current branch. Do not push or commit unless asked.
- Generate the migration from schema changes. Review its SQL before it is
  applied; do not hand-edit it after application.

## Steps

### Step 1: Apply the ledger field decisions

Add `projects.shortName` and `uoms.uomType` with a new migration. The project
field can be nullable during this overhaul; the UOM field can be nullable only
if the ledger marks old rows as valid without a type. Do not add duplicate
legacy tree fields: map legacy `category_id` and `level_1_id` to the current
same-project `parentId` tree and document that mapping.

Keep the current `isJo`, `statusCode`, thumbnails, project progress, dates,
location, volume, risk, and UOM relation. They are either legacy fields or
valid current additions. Do not add legacy numeric keys or Laravel audit
columns.

**Verify**: run the migration generator, inspect the one new SQL directory,
then run API type check. Both complete with no error.

### Step 2: Keep API rules at the boundary

Update the Drizzle entity schemas and `validateMaster` together. Trim
`shortName` and `uomType`; reject an active work item whose UOM is inactive;
preserve the existing inactive parent, same-project parent, and cycle checks.
Use `projectVendors.projectId` for vendor ownership; do not attach a vendor to
a division.

**Verify**: API lint and API type check exit 0.

### Step 3: Expose all retained fields to the resource catalog

In `master-data.resources.ts`, add a `defineFields` entry for every retained
database field. Put a short identity set in list tables, a complete business
set in details, and edit-safe fields in forms. Use current renderers:
`date` for dates, `number` for progress/volume, `checkbox` for boolean values,
`file` for retained upload keys, `location` for locations, and `textarea` for
descriptions. Audit timestamps stay in details only.

The resource catalog must contain the fields before Plan 005 connects lookup
sources. Do not hide a stored PTS prerequisite field only because PTS does not
read it today.

**Verify**: Web type check exits 0.

### Step 4: Add small domain coverage

Create `apps/api/src/__tests__/master-data.spec.ts` using the real Postgres
fixture style in `apps/api/src/__tests__/qhsse-pts.spec.ts:50-151`. Test only:

- retained Project and UOM fields survive create then detail;
- inactive parent or UOM rejects an active child;
- a work item cannot use a parent from another project or create a cycle.

Do not add a test per scalar field or a snapshot test.

**Verify**: API tests exit 0.

## Test plan

- Use `qhsse-pts.spec.ts` for database setup and authenticated calls.
- Add the three named domain cases in the new master-data test file.
- Run API tests and Web type check from the commands table.

## Done criteria

- [ ] The ledger maps every PTS prerequisite field.
- [ ] All retained fields have database, API-schema, and resource-field
  coverage.
- [ ] One generated migration, API checks, API tests, and Web type check pass.
- [ ] No file outside Scope changed.

## STOP conditions

- A legacy field does not map to one current business meaning.
- The change would rewrite issued PTS records.
- A required renderer is absent from `/input-catalog`.

## Maintenance notes

Add a database field, server validation, resource field, and ledger entry in
one change. Keep the PTS server as the final authority for relation validity.
