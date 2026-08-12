# Plan 042: Implement the complete manual PTS workflow API

> **Implementation instructions**: Follow this plan in order. Run each check
> before the next step. Extend the PTS foundation from plan 041; do not create a
> second workflow path. If a STOP condition occurs, stop and report it. When
> implementation and review are complete, update this plan row in
> `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 1b8ae46..HEAD -- apps/api/src/routes/qhsse-pts apps/api/src/authorization/catalog.ts apps/api/src/__tests__/qhsse-pts.spec.ts`
> Plan 041 is expected to change these files. Confirm that its done criteria are
> complete and use the live post-041 code as the baseline. Any other material
> mismatch is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: `plans/041-rebuild-manual-pts-report-foundation.md`
- **Category**: migration
- **Planned at**: commit `1b8ae46`, 2026-08-12

## Why this matters

The business process is a state machine with permission, assignee, activity,
notification, and concurrency rules. If routes implement these rules separately,
they will drift. Extend the PTS-specific action catalog and one transactional
executor so every transition has the same safety checks without adding a
generic workflow engine.

## Current state

- Before plan 041, `apps/api/src/routes/qhsse-pts/qhsse-pts.service.ts:20-39`
  maps draft action names to permissions, and `:510-511` starts a transaction and
  locks the report row. Plan 041 must replace this with one catalog/executor that
  currently supports soft delete.
- Before plan 041, `apps/api/src/routes/qhsse-pts/qhsse-pts.schemas.ts:19-66`
  exposes wrong names such as `complete-analysis` and `verification`. They must
  not survive this plan.
- `apps/api/src/authorization.ts:148-195` is the current source for effective
  project permissions and their union across coverage types. Reuse it.
- `apps/api/src/routes/notifications/notifications.entity.ts` owns the existing
  notification and activity tables. Do not add PTS-specific log tables.
- The authoritative transitions, values, payload rules, recipients, and error
  behavior are in
  `docs/superpowers/specs/2026-08-12-manual-pts-parity-design.md`, sections
  "State machine", "Workflow service", "Authorization", "Notifications and
  activity", and "Error behavior".

## Required state contract

Stored steps are exactly:

`report`, `high-disposition`, `low-disposition`, `temporary-plan`,
`management-notes`, `complete-report`, `follow-up-implementation`,
`follow-up-price`, `follow-up`, `implementation-report`,
`approved-implementation`, `realization`, `close`.

Stored statuses are exactly `open`, `on-progress`, and `close`.

Supported action names are exactly:

`disposition`, `temporary-plan`, `management-notes`, `complete-report`,
`follow-up-implementation`, `follow-up-price`, `implementation-report`,
`verify-implementation`, `realization`, `close`, and `delete`.

Disposition values are `approved`, `repair`, `downgrade`, and `demolish`.
Criteria values remain `low`, `medium`, and `high`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused tests | `pnpm --filter @southneuhof/api test -- qhsse-pts.spec.ts` | exit 0; all PTS tests pass |
| Type check | `pnpm --filter @southneuhof/api type-check` | exit 0; no errors |
| Lint | `pnpm --filter @southneuhof/api lint` | exit 0 |
| API suite | `pnpm --filter @southneuhof/api test` | exit 0; all API tests pass |
| Diff check | `git diff --check` | no output |

## Scope

**In scope**:

- `apps/api/src/routes/qhsse-pts/qhsse-pts.schemas.ts`
- `apps/api/src/routes/qhsse-pts/qhsse-pts.service.ts`
- `apps/api/src/routes/qhsse-pts/qhsse-pts.routes.ts`
- `apps/api/src/routes/qhsse-pts/qhsse-pts.ts`
- `apps/api/src/authorization/catalog.ts`
- `apps/api/src/__tests__/qhsse-pts.spec.ts`

**Out of scope**:

- Database shape changes after plan 041, unless a field in the approved model is
  missing. A missing approved field is a STOP condition before editing.
- All web and framework files.
- A generic workflow engine, event bus, queue, or policy framework.
- Quality Inspection, import, PDF/print, and Consultant/Contractor exceptions.
- Role IDs, role codes, or one active project role as transition inputs.

## Git workflow

- Suggested branch: `codex/042-manual-pts-workflow`.
- Suggested commit: `feat(api): implement manual PTS workflow`.
- Do not push or open a pull request unless the operator asks.

## Steps

### Step 1: Lock the action schemas and catalog

Define one discriminated action contract. Each catalog entry must contain its
input schema, project permission, allowed source step or steps, state update or
next-step function, activity text, and next notification target rule. Do not
put route or Vue details in the catalog.

Payload rules:

- disposition: one of the four disposition values; note is not required;
- temporary plan: required `temporaryFollowUpPlan`; no target date;
- management notes: required `managementNotes`; no target date;
- complete report: required `somUserId`, `followUpPlan`, and `targetDate`;
- implementation follow-up: required `implementationUserId` and `workMethod`;
- price follow-up: required `estimationCost`, `jobImplementorType`; vendor is
  required only when type is `vendor`;
- implementation report: required date, process image, and after image;
  description is optional;
- verification: `approved` or `rejected`; description is optional;
- realization: required actual cost and implementor type; actual vendor is
  required only when type is `vendor`;
- close: no business payload beyond the action identity;
- delete: keep the required reason from plan 041.

Confirm that plan 041 added every approved permission code, then wire the
workflow entries to them. Light disposition uses
`low-disposition-qhsse-pts`; medium and heavy use
`high-disposition-qhsse-pts`.

**Verify**:

- `rg -n "complete-analysis|verification:" apps/api/src/routes/qhsse-pts`
  must not show the old exact action names.
- `rg -n "code: ['\"]disposition-qhsse-pts['\"]" apps/api/src/authorization/catalog.ts`
  must return no exact generic permission.
- `pnpm --filter @southneuhof/api type-check` must exit 0.

### Step 2: Complete the transactional executor

For every action except no-op reads, the same executor must:

1. parse the selected action input;
2. verify project coverage and permission;
3. start a transaction;
4. lock the report row with `FOR UPDATE`;
5. reject deleted, repeated, invalid, and stale transitions;
6. reject closed reports for all actions except delete;
7. verify active references, selected vendor/project relation, and the selected
   implementation user;
8. update report and audit fields;
9. write one activity;
10. write required notifications; and
11. commit and return the current detail response.

Do not split permission, activity, or notification writes into route handlers.
Map invalid input to validation errors, missing coverage to not found, missing
permission to forbidden, and wrong/repeated/concurrent state to conflict through
the current application error system.

**Verify**:
`pnpm --filter @southneuhof/api test -- qhsse-pts.spec.ts`
must pass invalid-state, repeated-action, deleted-action, closed-action, and
concurrent-action cases.

### Step 3: Implement disposition and branch preparation

Transitions:

- creation is `open/report`;
- approved disposition is direct `close/close`;
- non-approved heavy is `on-progress/high-disposition`;
- non-approved light or medium is `on-progress/low-disposition`;
- `temporary-plan` is allowed at `high-disposition` and sets `temporary-plan`;
- `management-notes` is allowed at `temporary-plan` and sets
  `management-notes`;
- `complete-report` is allowed at `management-notes` or `low-disposition` and
  sets `complete-report`.

The action name remains `disposition`; its required permission is selected from
criteria, not from the submitted disposition value. Do not add role-based
bypass rules.

**Verify**:
focused tests must pass direct approved closure and light, medium, and heavy
branch cases with correct permissions and stored values.

### Step 4: Implement analysis and parallel follow-up

At `complete-report`, store SOM/maintenance manager, corrective plan, and target
date. The selected user must be active and have effective project coverage.
Then both follow-ups become available.

Implementation follow-up stores implementation user and work method. Price
follow-up stores estimated cost and planned implementor type/vendor. They can
finish in either order:

- after implementation first, step is `follow-up-implementation`;
- after cost first, step is `follow-up-price`;
- after the second action, step is `follow-up`.

Do not add duplicate done-at columns if the approved stored values and step are
enough to represent completion. The step itself must make impossible
combinations unrepresentable.

**Verify**:
focused tests must run both action orders and show that one action cannot be
submitted twice.

### Step 5: Implement completion, verification, realization, and close

Only the selected implementation user can submit the implementation report,
and that user must also have the project permission. Require the retained
process and after images and completion date. Store optional description.
Set `implementationStatusCode` to `waiting` and move to
`implementation-report`.

Verification rejection returns to `follow-up` and notifies the implementation
user. A new complete implementation report replaces the prior proof. Approval
moves to `approved-implementation`. Realization stores actual cost and actual
implementor type/vendor, then moves to `realization`. Close moves to
`close/close`.

**Verify**:
focused tests must pass assignee rejection, complete proof, rejection and
replacement, approval, realization, and final close.

### Step 6: Complete activity, recipients, and available actions

One activity row is required for creation and each successful action. Keep the
visible Indonesian business meaning from legacy. Store enough structured data
for actor, project, division, report, resulting step/status, optional decision,
optional note, and time.

Notification rules:

- creation: correct low/high disposition group;
- complete report: both follow-up groups;
- first follow-up: only the unfinished follow-up group;
- verification rejection: selected implementation user;
- each other transition: active users with the next permission;
- closure: final PTS completion notification.

Use the union of all active project grants, remove duplicates, and never notify
the actor. Compute `availableActions` on the server after all state, project,
permission, assignee, and delete checks.

**Verify**:
focused tests must assert exact recipient sets for project, division, and
all-project coverage and exclude unrelated, duplicate, inactive, and actor
records.

### Step 7: Run the API gate

**Verify**:

- `pnpm --filter @southneuhof/api test -- qhsse-pts.spec.ts`
- `pnpm --filter @southneuhof/api type-check`
- `pnpm --filter @southneuhof/api lint`
- `pnpm --filter @southneuhof/api test`
- `git diff --check`

All commands must exit 0. `git status --short` must show only in-scope files.

## Test plan

Keep one focused integration suite with these domain paths:

- approved disposition direct close;
- light and medium non-approved branch;
- heavy branch through temporary plan and management notes;
- both follow-up orders;
- implementation assignee and permission checks;
- required complete implementation proof;
- rejection, full resubmission, then approval;
- realization and close;
- delete reason and closed-record exception;
- low/high disposition permissions;
- project scope and exact notification recipients;
- activity rollback and notification rollback;
- two concurrent actions where only one succeeds.

Do not make one test for every field or repeat schema library tests.

## Done criteria

- [ ] Action names, steps, statuses, and disposition values are exact.
- [ ] One catalog and one transactional executor own all actions.
- [ ] All manual light, medium, heavy, and direct-close paths work.
- [ ] Follow-ups work in either order without duplicate completion.
- [ ] Implementation report enforces both permission and selected user.
- [ ] Rejection returns to follow-up and allows full replacement.
- [ ] Activities and notifications are transactional and recipients are exact.
- [ ] `availableActions` is server-authoritative.
- [ ] Closed/deleted/concurrent invalid transitions return conflict as designed.
- [ ] Focused and full API tests, type check, lint, and diff check pass.
- [ ] No file outside the in-scope list changed.

## STOP conditions

Stop and report if:

- plan 041 did not produce the approved fields and clean action executor base;
- a transition requires an unapproved role or Quality Inspection rule;
- activity or notification cannot join the report transaction;
- the database cannot lock the report row for the executor;
- current error normalization cannot express validation, not found, forbidden,
  and conflict without a shared-protocol change; or
- a check fails twice after a reasonable correction.

## Maintenance notes

The action catalog is PTS-specific. Do not turn it into a package or generic
workflow engine. A future Quality Inspection or role-exception design can add
explicit PTS actions after approval. Review every new transition for lock,
permission, activity, notification, and retry behavior.
