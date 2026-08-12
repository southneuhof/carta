# Plan 041: Rebuild the manual PTS report foundation

> **Implementation instructions**: Follow this plan in order. Run each check
> before the next step. Replace the current PTS draft; do not preserve its
> contract. If a STOP condition occurs, stop and report it. When implementation
> and review are complete, update this plan row in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 1b8ae46..HEAD -- apps/api/src/routes/qhsse-pts apps/api/src/authorization apps/api/src/__tests__/qhsse-pts.spec.ts apps/api/drizzle`
> A material mismatch with the current-state excerpts is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: `plans/040-add-collection-presentation-foundation.md`
- **Category**: migration
- **Planned at**: commit `1b8ae46`, 2026-08-12

## Why this matters

The current API draft has the wrong fields, action names, permissions, and
state values. The manual PTS slice needs a clean persistence and report API
before workflow and web work can be reliable. This plan replaces the draft
without a compatibility layer and establishes the transaction and authorization
boundaries that plan 042 will extend.

## Current state

- `apps/api/src/routes/qhsse-pts/qhsse-pts.entity.ts:23-81` contains draft fields
  such as `date`, `source`, disposition notes, dated temporary plans, `analysis`,
  draft follow-up fields, and `closed`-style data that do not match the approved
  manual contract.
- `apps/api/src/routes/qhsse-pts/qhsse-pts.schemas.ts:5-66` requires the wrong
  create fields and exposes wrong action names and payloads.
- `apps/api/src/authorization/catalog.ts:186-201` has one generic
  `disposition-qhsse-pts` permission. The approved contract needs separate low
  and high disposition permissions.
- `apps/api/src/routes/qhsse-pts/qhsse-pts.service.ts` already uses project
  authorization helpers, database transactions, report row locks, activities,
  and notifications. Reuse those project-wide primitives, but replace the PTS
  draft behavior.
- `apps/api/src/__tests__/qhsse-pts.spec.ts:33-55` expects draft step values such
  as `analysis` and `implementation`; these are not approved state values.
- `apps/api/package.json:12-17` supplies the Drizzle generation and migration
  commands.
- The full approved data and field contract is in
  `docs/superpowers/specs/2026-08-12-manual-pts-parity-design.md`, sections
  "Manual PTS data model", "Field rules", "Authorization", and "API surface".

## Required report contract

The main table must contain:

- report fields: `id`, `divisionId`, `projectId`, `number`,
  `ptsWorkCategoryId`, `workItemCategoryId`, `workItemId`, `locationZone`,
  `criteriaCode`, `imgBefore`, `location`, `description`;
- workflow fields: `somUserId`, `dispositionStatusCode`,
  `temporaryFollowUpPlan`, `managementNotes`, `followUpPlan`, `targetDate`,
  `implementationUserId`, `workMethod`, `estimationCost`, `jobImplementorType`,
  `projectVendorId`, `implementationDate`, `imgProcess`, `imgAfter`,
  `implementationDescription`, `implementationStatusCode`,
  `implementationVerificationDescription`, `actualCost`,
  `actualJobImplementorType`, `actualProjectVendorId`, `statusCode`, `stepCode`;
- audit fields: `createdBy`, `updatedBy`, `createdAt`, `updatedAt`, `deletedBy`,
  `deletedAt`, `deletedReason`.

The root-cause join table has `(qhssePtsId, rootCauseId)` as its composite
primary key. Keep the project/year number counter. Do not add `date`, `source`,
`rootCauseCode`, `rejectedNotes`, `ptsNotes`, creator `roleId`, or Quality
Inspection fields.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Generate migration | `pnpm --filter @southneuhof/api db:generate` | exit 0; one new migration directory |
| API tests | `pnpm --filter @southneuhof/api test -- qhsse-pts.spec.ts` | exit 0; focused tests pass |
| Type check | `pnpm --filter @southneuhof/api type-check` | exit 0; no errors |
| Lint | `pnpm --filter @southneuhof/api lint` | exit 0 |
| Diff check | `git diff --check` | no output |

Do not run `db:reset`, `db:refresh`, or `db:push` in a shared environment. The
executor can run the generated migration only against the task's disposable
local test database.

## Scope

**In scope**:

- `apps/api/src/routes/qhsse-pts/qhsse-pts.entity.ts`
- `apps/api/src/routes/qhsse-pts/qhsse-pts.schemas.ts`
- `apps/api/src/routes/qhsse-pts/qhsse-pts.service.ts`
- `apps/api/src/routes/qhsse-pts/qhsse-pts.routes.ts`
- `apps/api/src/routes/qhsse-pts/qhsse-pts.ts`
- `apps/api/src/authorization/catalog.ts`
- `apps/api/src/__tests__/qhsse-pts.spec.ts`
- one generated directory under `apps/api/drizzle/`

**Out of scope**:

- All `apps/web` and framework files.
- Workflow actions other than reason-based soft delete.
- Quality Inspection, historical import, print/PDF, and role-specific branches.
- Changes to common authorization, uploads, notifications, activities, number
  configuration, projects, users, work items, vendors, or lookup behavior.
- A data backfill or compatibility API for the current draft.

## Git workflow

- Suggested branch: `codex/041-manual-pts-foundation`.
- Suggested commit: `feat(api): rebuild manual PTS reports`.
- Do not push or open a pull request unless the operator asks.

## Steps

### Step 1: Replace the database shape and generate one migration

Change the PTS Drizzle entity to the exact contract above. Use existing column
types and relation conventions. Use decimal columns for estimated and actual
cost. Use user foreign keys for SOM, implementation assignee, creator, updater,
and deleter. Use vendor foreign keys for planned and actual vendor. Keep indexes
for project, division, status/step, and the list date basis (`createdAt`).

Keep the counter primary key `(projectId, year)`. Use `createdAt` for start-month
and end-month filters because the approved model removes the draft report
`date`. Generate one migration. Since
no legacy import is approved, the migration can replace the draft columns
directly. Do not add temporary old/new columns or copy draft values.

**Verify**:

- `pnpm --filter @southneuhof/api db:generate`
- `rg -n "date|source|analysis|temporary_plan_target|close_notes" apps/api/src/routes/qhsse-pts/qhsse-pts.entity.ts`

The first command must generate one migration. The second must have no matches
for removed draft columns; a match in a comment that explains removal is also
unnecessary and must be removed.

### Step 2: Replace trust-boundary schemas and permission catalog entries

Define create and update schemas from the approved manual report fields.
Creation requires division, project, PTS work category, work-item category,
work item, criteria, at least one root cause, location, and before image.
`locationZone` and `description` are optional. The before image must use the
existing retained-upload validation. Update can replace root causes and is
available only while `stepCode === 'report'`.

Add all approved permission codes to the QHSSE PTS catalog. In this plan, wire
view, show, create, update, delete, low-disposition, and high-disposition. Remove
the generic disposition code. Plan 042 will wire the remaining action codes.

**Verify**:

- `rg -n "low-disposition-qhsse-pts|high-disposition-qhsse-pts" apps/api/src/authorization/catalog.ts`
  must show both codes.
- `rg -n "code: ['\"]disposition-qhsse-pts['\"]" apps/api/src/authorization/catalog.ts`
  must return no exact generic code entry.
- `pnpm --filter @southneuhof/api type-check` must exit 0.

### Step 3: Implement scoped lookups and report reads

Implement one lookup response for active divisions, projects, PTS work
categories, work-item categories/items, root causes, project users, and project
vendors. Apply project coverage and active-state rules on the server. Project
options for creation require `create-qhsse-pts`. A selected project must belong
to the selected division. A work-item category and leaf must be active, belong
to the project, and have the selected parent relation. Root causes and vendors
must be active. Project users must have effective coverage for the project.

Implement list and detail reads that exclude soft-deleted reports. List returns
only projects with view permission. Detail outside coverage returns not found.
Return relation display names, criteria/status values, images, root causes, and
record operations needed by table and card views. Detail also returns ordered
activity and current `availableActions` after server checks.

**Verify**:
`pnpm --filter @southneuhof/api test -- qhsse-pts.spec.ts`
must pass focused lookup, relation, project-scope, and soft-delete visibility
tests.

### Step 4: Implement transactional create and pre-disposition update

Create the report, number, root-cause rows, and creation activity in one
transaction. Allocate the next project/year number with an upsert or row lock in
that same transaction, then format it with the active number configuration. A
concurrent create cannot allocate the same number.

Update only at `stepCode === 'report'`. Recheck all changed relations and replace
root-cause rows in the update transaction. Preserve created audit fields and set
updated audit fields from the caller.

On creation, notify the low-disposition permission group for light criteria and
the high-disposition group for medium or heavy criteria. Use the existing union
of project, division, and all-project coverage. Remove duplicate recipients and
exclude the actor. Notification and activity failure must roll back creation.

**Verify**:
`pnpm --filter @southneuhof/api test -- qhsse-pts.spec.ts`
must pass create, update-step, relation, unique-number, activity, and recipient
tests.

### Step 5: Establish the action endpoint with soft delete only

Keep one typed endpoint at `/:id/actions/:action`. Establish the action catalog
and transactional executor shape that plan 042 will extend, but add only the
`delete` action now. It requires `deletedReason`, delete permission, and a row
lock. It records `deletedBy`, `deletedAt`, the reason, and one activity. It does
not delete images or root-cause rows. It is allowed for closed reports; all
other future actions will reject closed reports.

Do not expose standard `DELETE` or hard delete. Remove the draft delete route.

**Verify**:

- `rg -n "method: ['\"]delete['\"]|\.delete\(qhssePts\)" apps/api/src/routes/qhsse-pts`
  must return no standard or hard-delete implementation.
- `pnpm --filter @southneuhof/api test -- qhsse-pts.spec.ts`
  must pass missing-reason, successful-delete, closed-delete, activity, and
  hidden-from-normal-read tests.

### Step 6: Run the foundation gate

Run all focused checks and inspect the generated migration. Confirm that it
contains only the clean draft replacement and no legacy data import.

**Verify**:

- `pnpm --filter @southneuhof/api test -- qhsse-pts.spec.ts`
- `pnpm --filter @southneuhof/api type-check`
- `pnpm --filter @southneuhof/api lint`
- `git diff --check`

All commands must exit 0. `git status --short` must show only in-scope files.

## Test plan

Use `apps/api/src/__tests__/qhsse-pts.spec.ts` as the focused integration test.
Keep only domain-significant cases:

- required create contract and retained before image;
- project/division, work-item parent, active root-cause, user, and vendor checks;
- at least one root cause and replacement on update;
- two creates in the same project/year get different numbers;
- a concurrent create check proves the database constraint/locking behavior;
- list and detail project coverage;
- update allowed only at `report`;
- creation activity and low/high notification recipients;
- reason-required soft delete, including a closed record;
- deleted records leave list/detail and child/image references remain.

Do not write one test per column or duplicate Zod's own behavior.

## Done criteria

- [ ] The entity matches the approved manual-only field list.
- [ ] Removed draft and Quality Inspection fields are absent.
- [ ] One generated migration replaces the draft without a data backfill.
- [ ] Generic disposition permission is absent; low and high codes exist.
- [ ] Create, list, detail, update-at-report, lookups, and soft delete work.
- [ ] Number allocation is transaction safe.
- [ ] Root causes use the composite primary key and require at least one row.
- [ ] Normal reads exclude deleted reports.
- [ ] Creation activity and recipients follow project coverage.
- [ ] Focused tests, type check, lint, and diff check pass.
- [ ] No file outside the in-scope list changed.

## STOP conditions

Stop and report if:

- the active number configuration cannot be used inside the creation
  transaction;
- safe numbering requires a change to a shared number-config contract;
- a required lookup needs a role-code filter that the approved design deferred;
- a migration needs historical PTS data mapping or compatibility columns;
- upload retention cannot be checked before the report write;
- notification or activity writes cannot share the report transaction; or
- a check fails twice after a reasonable correction.

## Maintenance notes

Plan 042 must extend the same action catalog and executor; it must not replace
them with another workflow path. Review the migration carefully because no
backward compatibility or data import is approved. Future Quality Inspection
work needs a new design and must not reuse absent fields by guesswork.
