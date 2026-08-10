# Plan 007: Make manual PTS master-data forms usable

> **Implementation instructions**: Follow this plan after Plan 006. Use the
> existing route-local resource pattern. Do not add a CRUD builder, a UI
> dependency, or a new framework renderer.
>
> **Drift check (run first)**: `git diff --stat abb232f..HEAD -- apps/web/src/routes/(authenticated)/master-data apps/web/src/routes/(demo) apps/api/src/routes/master-data docs/manual-pts-parity.md`
> Stop if the input catalog or a needed resource contract differs from this
> plan.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/006-align-core-master-data-structure.md`
- **Category**: bug
- **Planned at**: commit `abb232f`, 2026-08-10

## Why this matters

The PTS prerequisite tables have routes, but their forms use relationship UUIDs
as text. For example, `businessCategoryId`, `divisionId`, `projectId`,
`parentId`, `uomId`, and `numberVariableCode` are raw text inputs in
`master-data.resources.ts`. An administrator cannot safely create the records
that manual PTS needs without internal IDs.

## Current state

- `apps/web/src/routes/(authenticated)/master-data/master-data.resources.ts:118-176`
  uses `renderer: 'text'` for Division and Project relationships.
- The route tree already has list, create, detail, and edit pages for all ten
  PTS prerequisite masters under
  `apps/web/src/routes/(authenticated)/master-data/`.
- `/Users/gamer/Documents/projects/is-framework/apps/web/src/routes/(authenticated)/hr/overtimes/overtime-lookups.resource.ts:1-50`
  is the reference pattern for read-only lookup resources.
- `/Users/gamer/Documents/projects/is-framework/apps/web/src/routes/(authenticated)/hr/overtimes/overtimes.resource.ts:13-34`
  shows lookup `source`, dependent search parameters, and `resetWhen`.
- The requested input catalog is already present and byte-identical at
  `apps/web/src/routes/(demo)/input-catalog/`. It is a renderer smoke page,
  not a file to copy again.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Web tests | `pnpm --filter @southneuhof/framework-web test` | Exit 0 |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | Exit 0, no errors |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | Exit 0; warnings may remain if unchanged |

## Scope

**In scope:** `apps/web/src/routes/(authenticated)/master-data/`, focused
resource tests beside it, `apps/web/src/manifest/navigation.ts` only if a
current PTS prerequisite route is absent, and `docs/manual-pts-parity.md`.

**Out of scope:** database changes, PTS transaction pages, copied catalog
files, framework packages, and master-data families outside manual PTS.

## Git workflow

- Keep the current branch. Do not commit or push unless asked.
- Match the local `overtime-lookups.resource.ts` and `overtimes.resource.ts`
  structure. Do not move that reference code.

## Steps

### Step 1: Add typed lookup sources once

Create one adjacent lookup resource file for the existing PTS prerequisite
operations. Reuse the exact `createHonoResourceOperations` handlers already
created in `master-data.resources.ts`; do not create a second API endpoint.
Each row displays a business label: `code — name`, Project `number — name`,
or name when it has no code.

**Verify**: Web type check exits 0 and the lookup file has no `any` cast.

### Step 2: Replace every relationship text field

Set lookup sources for Division business category, Project division, Work Item
project/parent/UOM, Project Vendor project, and Number Configuration variable.
Hide or disable a child lookup until its parent is present. Parent changes
reset every child value. Filter to active candidates when the server has the
same active-state rule.

Do not use a text UUID as a fallback. `checkbox-group` is only for a real
many-to-many field; no prerequisite master form needs it.

**Verify**: a focused resource test checks that each named relationship has
`renderer: 'lookup'`, a typed source, and the required reset rule.

### Step 3: Complete visible projections

Use `read` functions to show relationship labels in tables and details. Keep
`active` visible. Put Plan 006 fields in their correct forms/details but do
not put thumbnails or long descriptions in list tables. Keep the existing
single Master Data navigation group.

**Verify**: mount one parent form, one child form, and Number Configuration;
each relationship is a lookup control, not a text input.

### Step 4: Run the renderer smoke check

Start the web application and open `/input-catalog`. Confirm `lookup`, `file`,
`image`, `date`, `number`, `checkbox`, `textarea`, and `location` render.
Do not change this route.

**Verify**: run all three commands from the commands table.

## Test plan

- Add a resource configuration test beside `master-data.resources.ts`.
- Use `overtimes.resource.spec.ts:70-130` as the test structure.
- Assert field configuration and reset behavior. Do not snapshot pages or call
  the live API from a browser unit test.

## Done criteria

- [ ] No manual-PTS prerequisite relation uses a text renderer.
- [ ] Parent changes reset every dependent selection.
- [ ] Tables and details show labels, not UUIDs.
- [ ] Web tests, type check, and lint check exit as specified.
- [ ] The input catalog files remain unchanged.

## STOP conditions

- The lookup renderer cannot use an existing master resource.
- A needed renderer is not available in `/input-catalog`.
- The server needs an API filter that does not exist; add it only with a server
  validation test, otherwise stop and report.

## Maintenance notes

Every new relation needs a lookup source and a reset rule in the same change.
The server remains the authority for parent, active-state, and project checks.
