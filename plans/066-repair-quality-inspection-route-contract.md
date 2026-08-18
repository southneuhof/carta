# Plan 066: Make the Quality Inspection entry routes reachable

> **Implementation instructions**: Invoke the **Web UI Surface Reuse** skill
> before editing `apps/web`; record `Reused`, `Searched`, and `Gap` in the
> handoff. Read this plan fully. Preserve the existing Quality Inspection
> database, API service rules, and seed data. Do not edit framework source,
> `/me`, migrations, Todo, notifications, or PTS.
>
> **Drift check (run first)**: `git diff --stat 77b7f49 -- apps/web/src/router/guards.ts apps/web/src/router/__tests__/guards.spec.ts apps/api/src/routes/quality-inspection apps/api/src/__tests__ plans/README.md`
> If a current route shape differs from the excerpts below, STOP and report.

## Status

- **Priority**: P0
- **Effort**: M
- **Risk**: LOW
- **Depends on**: `plans/065-correct-quality-inspection-entry-and-development-seed.md`
- **Category**: bug
- **Planned at**: commit `77b7f49`, 2026-08-18

## Why this matters

Plan 065 makes the legacy-labelled manual entry control visible. The browser
check then found that the form route redirects to Dashboard and scheduled
routes return 404. These are two independent route-contract errors in the
Quality Inspection slice. Until both are fixed, the normal legacy form and
scheduled entry path are not usable even with correct data and authorization.

## Current state

- `apps/web/src/router/guards.ts:12-20` checks every resource action against
  browser permissions. It receives only system permissions from
  `apps/api/src/identity.ts:17-25`. `create-quality-inspection` is a project
  permission, so the QI create route is redirected before its server-filtered
  Projects list can be used.
- `packages/is-vue-framework/src/resources/routeAccess.ts:1-20` registers the
  action name and its permission. It exposes `action === 'create'`; no
  framework change is needed.
- `apps/api/src/authorization/catalog.ts:276-288` defines
  `create-quality-inspection` in the `quality-inspection-workflow` project
  realm. The API remains the permission authority for the selected project.
- `apps/api/src/routes/quality-inspection/quality-inspection.ts:77-87` nests
  custom endpoints under keys such as `createContext`, `schedules.list`, and
  `actions.:id.completeReport`.
- `packages/sprindle/src/model/define-model.ts` compiles each nesting key into
  a URL segment. Each explicit `path` in
  `apps/api/src/routes/quality-inspection/quality-inspection.routes.ts:86-149`
  adds a second segment. For example, the server exposes
  `/quality-inspection/schedules/list/schedules` while the Hono client calls
  `/quality-inspection/schedules/list`.
- The local database now passes `db:seed` and `db:smoke`; do not reset it.

## Commands you will need

| Purpose | Command | Expected result |
|---|---|---|
| API route test | `pnpm --filter @southneuhof/api exec node --env-file-if-exists=.env ./node_modules/vitest/vitest.mjs run src/__tests__/quality-inspection.spec.ts` | exit 0 |
| Web guard and QI tests | `pnpm --filter @southneuhof/framework-web test -- guards quality-inspection` | exit 0 |
| API type check | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | exit 0 |
| Seed check | `pnpm --filter @southneuhof/api db:seed && pnpm --filter @southneuhof/api db:smoke` | exit 0 |
| Diff check | `git diff --check` | no output |

## Suggested implementation toolkit

- **Must invoke `web-ui-surface-reuse`** for the create-route browser check.
  Reuse the current route-local `Buat Inspection/Test` control, `ListView`,
  `FormView`, and the Projects owner list.
- Read `apps/web/src/router/guards.ts`,
  `apps/web/src/router/__tests__/guards.spec.ts`,
  `apps/api/src/routes/quality-inspection/quality-inspection.ts`,
  `apps/api/src/routes/quality-inspection/quality-inspection.routes.ts`, and
  `packages/sprindle/src/model/__tests__/define-model.spec.ts` before editing.

## Scope

**In scope**:

- `apps/web/src/router/guards.ts`
- `apps/web/src/router/__tests__/guards.spec.ts`
- `apps/api/src/routes/quality-inspection/quality-inspection.routes.ts`
- focused Quality Inspection API route-contract tests
- `plans/README.md`

**Out of scope**:

- `packages/is-vue-framework` and `packages/sprindle`
- the browser identity payload, generic project-permission client state, QI
  database tables/migrations, QI services/schemas, PTS, Todo, notifications,
  and seed shape.

## Steps

### Step 1: Allow direct entry to a project-scoped create route

In `apps/web/src/router/guards.ts`, keep client-side rejection for every
system-scoped resource action. Add one narrow exception only for a registered
`create` action whose permission is in the **project** realm of the API
permission catalog. It must allow the route to load even when the browser
permission store cannot contain that project permission.

The exception applies only to direct route entry. It does not make the default
ListView Create control visible, does not grant a project permission, and does
not replace server authorization. Plan 065 already uses the server-filtered
Projects owner list to decide whether it shows **Buat Inspection/Test**. The
Quality Inspection create service must continue to call
`requireProjectRecord(..., 'create-quality-inspection')`.

Add focused guard tests:

- denied browser access may open a registered project-realm create action;
- denied browser access still cannot open a system-realm create action; and
- existing detail-route rejection remains unchanged.

**Verify**: `pnpm --filter @southneuhof/framework-web test -- guards quality-inspection`
exits 0.

### Step 2: Align custom QI API routes with their Hono client tree

For every custom route registered under `qualityInspectionModel.routes` in
`apps/api/src/routes/quality-inspection/quality-inspection.ts`, remove the
explicit `path` from its `defineRoute` declaration in
`quality-inspection.routes.ts`. The route-tree keys are the complete client
contract:

```text
createContext
schedules/list
schedules/:id/createContext
actions/:id/completeReport
actions/:id/workItems/:workItemRowId/verify
actions/:id/submitDocumentations
actions/:id/verify
```

Do not change standard `list`, `detail`, `create`, `update`, or `delete`
routes. Their tree keys and canonical route factories are already aligned.
Do not add compatibility aliases. The new application has no external QI API
compatibility requirement.

Add a focused API contract test that verifies each custom URL above is mounted
at the key-derived URL, not at a duplicated explicit path. A request without a
session may return 401 or 403; it must not return 404. Use the installed API
application or its generated OpenAPI document. Do not call the service or
require fixtures merely to test path registration.

**Verify**: the API route test and the focused Quality Inspection workflow test
both exit 0.

### Step 3: Repeat the seeded browser path

Run `db:seed` and `db:smoke` without resetting the database. In the T3 preview,
sign in as the existing seeded development administrator and confirm:

1. **Buat Inspection/Test** opens the normal legacy-labelled form and does not
   redirect to Dashboard.
2. The seeded division, project, category, root work item, leaf, and active
   ITP type can be selected.
3. **Jadwal Inspection/Test** opens its list and its seeded row opens the
   scheduled create form without a 404.

Do not submit a browser-created report unless needed to prove submission. If
T3 preview remains unavailable after a valid retry, report the exact reason.

**Verify**: run every command in the table and `git diff --check`.

## Test plan

- Extend the existing router-guard test file with the project-create exception
  and the system-create rejection.
- Add one focused QI route registration test. It must fail if a custom endpoint
  acquires both a route-tree segment and an explicit path segment again.
- Keep `db:smoke` as the seed readiness check from Plan 065.

## Done criteria

- [ ] The normal **Buat Inspection/Test** action opens its form for the seeded
  user.
- [ ] The browser permission guard still rejects system actions without their
  system permission.
- [ ] All QI custom API client calls reach a mounted route instead of 404.
- [ ] The scheduled list and scheduled form entry both work with the seeded
  schedule.
- [ ] Seed data remains idempotent and `db:smoke` passes.
- [ ] No framework, `/me`, schema, migration, PTS, Todo, or notification file
  changes occur.

## STOP conditions

Stop and report if:

- a project create route cannot be identified from the existing API permission
  catalog without a framework or `/me` change;
- removing a custom explicit path changes a standard CRUD URL;
- the browser discovers a third unplanned QI entry or data failure; or
- `db:seed` requires deletion of local data.

## Maintenance notes

The route guard may defer only project-scoped **create** actions to their
server-owned selector and mutation API. Do not widen that exception to detail,
update, delete, or system permissions. A custom Sprindle route nested under a
model tree must use its tree key as its URL segment; use an explicit `path`
only for an extra segment that the client tree also represents.
