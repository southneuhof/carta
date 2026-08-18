# Plan 065: Restore the legacy Inspection/Test entry path and seed data

> **Implementation instructions**: Follow this plan in order. Invoke the
> **Web UI Surface Reuse** skill before editing `apps/web`. Read its required
> documents and report `Reused`, `Searched`, and `Gap` in the handoff. Use the
> existing Projects owner list; do not add a Quality Inspection lookup or a
> framework change. Update this plan row in `plans/README.md` after the
> implementation and review pass.
>
> **Drift check (run first)**: `git diff --stat 77b7f49 -- apps/web/src/routes/(authenticated)/quality/quality-inspection apps/api/scripts/seed.ts apps/api/scripts/smoke-db.ts plans/README.md`
> If the live code differs from the excerpts below, STOP and report. Do not
> replace the current Quality Inspection database or API state machine.

## Status

- **Priority**: P0
- **Effort**: M
- **Risk**: LOW
- **Depends on**: `plans/062-build-quality-inspection-api-and-data-contract.md`, `plans/063-build-quality-inspection-resource-and-report-creation.md`, `plans/064-build-quality-inspection-detail-workflow-and-evidence.md`
- **Category**: bug
- **Planned at**: commit `77b7f49`, 2026-08-18

## Why this matters

Legacy Quality Inspection has a normal create form. The new application has
that form route, but a user with a project-scoped create grant cannot reach it
from the list. The framework default Create control checks browser permissions,
but `/me` sends system permissions only. The API correctly keeps project
permissions server-side. This plan restores the normal legacy entry path with
the existing server-filtered Projects list and provides usable development data.

## Current state

- Legacy configuration declares a normal create form with `division_id`,
  `project_id`, `target_date`, `quality_work_category_id`,
  `work_item_category_id`, `location_zone`, and selected items:
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/quality-inspection.ts:11-25`.
- `apps/web/src/routes/(authenticated)/quality/quality-inspection/create.route.vue:49-53`
  already renders that normal form.
- `apps/web/src/routes/(authenticated)/quality/quality-inspection/quality-inspection.resource.ts:44-48`
  declares `create-quality-inspection` as the create action permission.
- `packages/is-vue-framework/src/resources/actionResource.ts:431` sets the
  ListView `createRoute` only when the browser access adapter grants that
  permission. `packages/is-vue-framework/src/components/views/ListView.vue:447-451`
  then renders the default Create control.
- `apps/api/src/identity.ts:17-25` resolves `SystemIdentity`; `apps/api/src/authorization.ts:72-122`
  intentionally returns only system-role permissions. Project permission
  checks stay server-side in `apps/api/src/authorization.ts:201-237`.
- `apps/api/src/routes/projects/projects.ts:15-18, 118-134` already accepts
  `permission=create-quality-inspection` and returns only the caller's active,
  permitted projects. It is the owner list for the normal form lookup.
- `apps/api/scripts/seed.ts:151-235` seeds the default active ITPs. It does
  not seed a schedule or Quality Inspection report. The current development
  database has an active seeded ITP but no Quality Inspection report.

## Commands you will need

| Purpose | Command | Expected result |
|---|---|---|
| Web focused tests | `pnpm --filter @southneuhof/framework-web test -- quality-inspection` | exit 0 |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | exit 0 |
| API focused tests | `pnpm --filter @southneuhof/api exec node --env-file-if-exists=.env ./node_modules/vitest/vitest.mjs run src/__tests__/quality-inspection.spec.ts` | exit 0 |
| Seed data | `pnpm --filter @southneuhof/api db:seed` | exit 0 |
| Seed smoke check | `pnpm --filter @southneuhof/api db:smoke` | exit 0 |
| Diff check | `git diff --check` | no output |

## Suggested implementation toolkit

- **Must invoke `web-ui-surface-reuse`** for the list control and browser
  check. Reuse `ListView`, `Button`, and the existing Projects resource.
- Read `docs/architecture/web-application-architecture.md`,
  `packages/is-vue-framework/README.md`,
  `apps/web/src/routes/(authenticated)/quality/quality-inspection/index.route.vue`,
  and `apps/web/src/routes/(authenticated)/quality/quality-inspection/quality-inspection.resource.ts`.
- Read `apps/api/AGENTS.md` before database commands. Do not run `db:reset` or
  `db:refresh`; the request needs seeded data, not deletion of local data.

## Scope

**In scope**:

- `apps/web/src/routes/(authenticated)/quality/quality-inspection/index.route.vue`
- a focused Quality Inspection web test only when it tests the visible manual
  entry action without duplicating framework tests
- `apps/api/scripts/seed.ts`
- `apps/api/scripts/smoke-db.ts`
- `plans/README.md`

**Out of scope**:

- Quality Inspection tables, migrations, API routes, schemas, workflow, PTS,
  Todo, notifications, and framework source.
- Changes to `/me` or generic project-permission exposure. The Projects owner
  list already provides the needed server-filtered capability.
- A schedule manager or a generic create-permission helper.

## Steps

### Step 1: Add the normal legacy entry action from the server-filtered Projects list

In `apps/web/src/routes/(authenticated)/quality/quality-inspection/index.route.vue`,
load the existing `projects` resource list with these search parameters:

```ts
{ permission: 'create-quality-inspection', active: true }
```

Set a route-local boolean only when that list contains at least one project.
Render a `Button` in the ListView controls only for that boolean. Its exact
legacy label is **Buat Inspection/Test** and it navigates to
`quality-quality-inspection-create`. Keep **Jadwal Inspection/Test** as the
separate scheduled entry action, but do not show either create entry to a user
without a server-permitted project.

Do not make the browser permission store contain project permissions. Do not
set the resource create action permission to `null`; that would hide the
project-scope reason and show a create action to unauthorised users. The API
remains the authority and the existing project lookup continues to filter
projects by `create-quality-inspection`.

**Verify**: the focused web check proves the manual button is rendered after
the Projects owner list returns one permitted project, and is not rendered for
an empty result. `pnpm --filter @southneuhof/framework-web test -- quality-inspection`
exits 0.

### Step 2: Seed a normal report and a scheduled origin without a schema change

In `apps/api/scripts/seed.ts`, retain the existing default division, project,
category, work-item leaf, and three active ITP records. Add an idempotent,
active `work_item_schedule` row for `work-item-category-default`, with fixed
seed dates and the seeded administrator as both audit users.

After number configurations and ITP plans exist, add one idempotent normal
Inspection/Test report through `createQualityInspection`. It must use the
default division, project, work-item category, selected leaf, and at least one
active ITP type. Use a fixed seed-only `locationZone` marker and query for a
non-deleted report with that marker before creating it. Do not insert a second
report on a repeated `db:seed` run.

The report must remain at the legacy initial state: `statusCode = open` and
`stepCode = report`. Do not seed Todo, notifications, PTS, uploaded photos, or
an automatic workflow transition.

**Verify**: run `pnpm --filter @southneuhof/api db:seed` twice. Both commands
exit 0 and the second run does not create another marker report or schedule.

### Step 3: Extend the development database smoke check

In `apps/api/scripts/smoke-db.ts`, add read-only checks for the seed contract:

- the seeded administrator has `view-quality-inspection` and
  `create-quality-inspection` for `project-default`;
- an active ITP exists for `work-item-default`;
- the one active seeded schedule exists; and
- one non-deleted marker Inspection/Test report exists at `open` / `report`.

Give failures direct messages that name the missing seed record. Do not print
environment values or credentials.

**Verify**: `pnpm --filter @southneuhof/api db:smoke` exits 0 after each seed
run.

### Step 4: Check the seeded user flow in the real browser

Use the T3 preview. Start the local API and web development services if no
usable preview is already running. Sign in with the existing documented seeded
development administrator. On **Inspection/Test**, confirm all of these:

1. The seeded normal report appears.
2. **Buat Inspection/Test** is visible and opens the normal create form.
3. The form can select the seeded division, project, category, root work item,
   seeded leaf, and active ITP type.
4. **Jadwal Inspection/Test** shows the seeded schedule and its row action
   opens the scheduled create form.

Do not submit a browser-created report unless the form needs a real submission
to prove the fix. If a browser session is unavailable after a valid T3 retry,
record the exact reason and complete all automated and database checks.

**Verify**: report the browser result and run the commands in the table above.

## Test plan

- Add one focused web test for the route-local manual entry visibility if it
  can call the owner list without replacing the resource boundary with mocks.
  Do not test ListView itself; framework tests already cover `createRoute`.
- The extended `db:smoke` command is the durable seed regression check.
- Run the focused API Quality Inspection workflow test to confirm that the
  seed import and service call do not change report creation rules.

## Done criteria

- [ ] A user with at least one active, server-permitted project sees **Buat Inspection/Test** and can open the normal form.
- [ ] A user with no permitted project sees neither normal nor scheduled creation action.
- [ ] The API still enforces `create-quality-inspection` for the selected project.
- [ ] `db:seed` is idempotent and supplies one normal report, one schedule,
  the normal form lookup chain, and project permissions for the seeded user.
- [ ] `db:smoke`, focused tests, type checks, lint, and `git diff --check` pass.
- [ ] No migration, framework, Todo, notification, or PTS file changes.

## STOP conditions

Stop and report if:

- the Projects owner list cannot filter by `create-quality-inspection` without
  changing its API contract;
- the seed service call requires a database migration or writes a Todo,
  notification, or PTS;
- the manual button needs a framework source edit; or
- a non-destructive `db:seed` cannot make the local database usable.

## Maintenance notes

The browser must not infer project authorization from `/me`. For another
project-scoped create screen, use its owner list or a server capability already
owned by that resource. Keep the Quality Inspection seed in the initial report
state so it remains a safe create-form example.
