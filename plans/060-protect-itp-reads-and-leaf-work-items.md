# Plan 060: Protect ITP reads and leaf work items

> **Implementation instructions**: Start only after Plan 055 is DONE. Keep the
> change in the API routes that own ITP access and work-item validation. Do not
> add a migration, a compatibility endpoint, or a framework change. Update the
> plan index only after implementation and review.
>
> **Drift check (run first)**:
> `git diff --stat b0bf0c2..HEAD -- apps/api/src/routes/inspection-test-plans apps/api/src/routes/work-items apps/api/src/__tests__ plans`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/055-build-itp-api-contract.md`
- **Category**: bug, security
- **Planned at**: commit `b0bf0c2`, 2026-08-18

## Why this matters

An ITP is a manual record for one leaf work item. It is not a project default.
The ITP read routes now return the full work-item tree after only a coverage
check. A covered user without the same `view-projects` permission as the web
route can call them directly. Also, adding or moving a child below a leaf with
an active ITP leaves an ITP on a non-leaf work item.

The legacy system deletes the parent ITP in that case. This plan uses the safer
approved rule: reject the topology change. It must not silently delete ITP
data.

## Current state

- `inspection-test-plans.routes.ts` authenticates through `caller()`, but its
  template, tree, and detail reads have no `requirePermission` guard.
  `apps/web/src/manifest/navigation.ts` already uses `view-projects` to show
  the ITP route.
- `inspection-test-plans.service.ts:332-373` reads every active work item and
  attaches every active ITP, even if a later work-item change made the item a
  parent.
- `work-items.ts:26-72` validates parent identity, project, activity, and
  level. It does not check whether the proposed parent has an active ITP.
- Legacy `WorkItems.php:320-327` removes a parent ITP when a child is added.
  Do not copy that destructive behavior.
- Plan 055 requires leaf-only ITP creation. This plan closes the reverse path:
  a leaf with an ITP must not become a parent.

## Commands you will need

| Purpose | Command | Expected result |
|---|---|---|
| ITP API tests | `pnpm --filter @southneuhof/api test -- inspection-test-plans` | exit 0 |
| Scope API tests | `pnpm --filter @southneuhof/api test -- project-authorization` | exit 0 |
| API type check | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| API lint | `pnpm --filter @southneuhof/api lint` | exit 0 |
| Whitespace check | `git diff --check` | no output |

API integration tests use the local test database and create fixture rows. Do
not run them against shared or production data.

## Scope

**In scope**:

- `apps/api/src/routes/inspection-test-plans/inspection-test-plans.routes.ts`
- `apps/api/src/routes/work-items/work-items.ts`
- `apps/api/src/__tests__/project-authorization.spec.ts`
- `plans/README.md` status only after review

**Out of scope**:

- Database schema, migration, seed values, ITP type values, and ITP write
  validation.
- Existing invalid parent ITP records, bulk repair, soft delete, or legacy data
  migration.
- The ITP web route, TreeTable, Work Items web route, and permission catalog.
- A new ITP read permission. The existing `view-projects` grant is the policy.

## Steps

### Step 1: Require the existing ITP read grant

Add `authenticated()` and `requirePermission('view-projects')` to the template,
tree, and detail ITP routes. Keep `caller()` and the service coverage check.
The route guard gives a `403` for a signed-in user without the system read
grant. The service keeps its `404` behavior for an inaccessible project or ITP.

Do not require a write permission for reads. Do not create a second read code.

**Verify**: a user with coverage and `view-projects` receives the template and
tree. A user with coverage but without `view-projects` receives `403`. A user
with the grant but without coverage receives `404`.

### Step 2: Preserve the leaf-work-item invariant

In `validateWorkItem`, when a create or update supplies a `parentId`, query for
an active ITP that belongs to that proposed parent. If one exists, return the
clear validation message: `Work item with an active ITP cannot receive a child.`

Apply this before insert or update. It must cover both adding a new child and
moving an existing work item below an ITP leaf. Leave a child deletion alone:
when a parent becomes a leaf again, ITP creation remains manual.

Do not deactivate the ITP, change existing parent rows, or add an ITP-specific
permission requirement to the work-item operation.

**Verify**: a normal child create and move still work. A create or move below
an active ITP leaf returns a validation error and leaves both the ITP and the
work-item tree unchanged.

### Step 3: Add only boundary tests

Extend the existing project authorization fixture with `view-projects` for its
normal system role. Add endpoint checks for the ITP template, tree, and one
detail record. Deactivate that one role permission in one test and verify `403`;
use an uncovered project and verify `404`.

In that same authenticated fixture, insert one valid active ITP for a leaf.
Exercise the Work Items create and update endpoints with a valid child payload.
Verify both requests fail with the leaf-invariant message and no row is inserted
or moved. Keep a successful non-ITP-parent case.

Do not add column tests, a mock database, or a test that repeats framework
authorization behavior.

### Step 4: Run the API gate

Run both focused suites, type check, lint, and the whitespace check. Inspect
the diff to confirm that no seed, migration, framework, or client file changed.

## Done criteria

- [ ] Template, tree, and detail reads require authentication and
  `view-projects`, then retain project coverage checks.
- [ ] A covered user without the read grant cannot call ITP reads directly.
- [ ] Create and update cannot place a child below an active ITP parent.
- [ ] The rejected topology change does not alter ITP or work-item records.
- [ ] Normal child create and move remain available.
- [ ] Focused API tests, type check, lint, and whitespace check pass.
- [ ] No migration, seed, catalog, framework, or web file changed.

## STOP conditions

- `view-projects` is not the permission used by the ITP navigation route.
- Current API tests cannot establish an authenticated user with coverage and
  without one system permission.
- The only implementation requires deleting an ITP or changing the database
  schema.
- The check exposes another data-access policy decision.

## Maintenance notes

If a future workflow needs to convert an ITP leaf into a parent, give it an
explicit review action that retires or moves the ITP. Do not restore legacy
automatic deletion.
