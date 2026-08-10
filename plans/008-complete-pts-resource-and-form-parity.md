# Plan 008: Complete manual PTS field and screen parity

> **Implementation instructions**: Follow this plan after Plans 005 and 007.
> Keep all workflow authority on the server. Use resource-owned field
> declarations for ordinary report fields; keep route-local action forms for
> the branching workflow.
>
> **Drift check (run first)**: `git diff --stat abb232f..HEAD -- apps/api/src/routes/qhsse-pts apps/api/drizzle apps/api/src/__tests__/qhsse-pts.spec.ts apps/web/src/routes/(authenticated)/quality/pts apps/web/src/routes/(authenticated)/master-data docs/manual-pts-parity.md`
> Compare all action field names with the ledger. Stop if an action already
> has a different business meaning.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: `plans/005-establish-legacy-parity-ledger.md`, `plans/007-make-core-master-data-forms-usable.md`
- **Category**: migration
- **Planned at**: commit `abb232f`, 2026-08-10

## Why this matters

The manual PTS workflow works, but current code loses business data from the
legacy workflow. The create schema has no `locationZone`; action schemas do
not capture the assigned implementor, work method, cost type, actual cost type,
or rejection note. The PTS resource also has no form field definitions, while
the create page duplicates form and lookup mechanics. This plan makes the
database, API, list, detail, and forms agree.

## Current state

- `apps/api/src/routes/qhsse-pts/qhsse-pts.entity.ts:19-82` has the current
  PTS fields. It has `somUserId` but never writes it; it has no fields for
  `locationZone`, implementation user/method, estimated cost/type/vendor,
  actual cost type/vendor, or rejected notes.
- `apps/api/src/routes/qhsse-pts/qhsse-pts.schemas.ts:5-65` is the only
  authorable report/action input contract.
- `apps/api/src/routes/qhsse-pts/qhsse-pts.service.ts:461-544` validates the
  server transition under a row lock and persists each action. Extend this
  function; do not reproduce transitions in Vue.
- `apps/web/src/routes/(authenticated)/quality/pts/pts.resource.ts:5-35` has
  a list-only field catalog. The create route has manual controls and the
  detail route has route-local action forms.
- Legacy source confirms report fields in
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/qhsse-pts.ts:6-17`
  and action payloads in
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Services/QhssePts/`.
  In particular, `FollowUpImplementationQhssePts.php:48-49`,
  `FollowUpPriceQhssePts.php:42-44`, and the verification/realization services
  are the field evidence.
- `apps/api/src/__tests__/qhsse-pts.spec.ts:170-296` is the existing real
  database test for permissions, paths, notifications, and concurrent actions.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Generate migration | `pnpm --filter @southneuhof/api db:generate` | One new reviewed migration |
| API tests | `pnpm --filter @southneuhof/api test` | Exit 0 with the configured test database |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | Exit 0 |
| API type check | `pnpm --filter @southneuhof/api type-check` | Exit 0, no errors |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | Exit 0, no errors |
| API lint | `pnpm --filter @southneuhof/api lint` | Exit 0 |

## Scope

**In scope:** `apps/api/src/routes/qhsse-pts/`, one generated API migration,
`apps/api/src/__tests__/qhsse-pts.spec.ts`,
`apps/web/src/routes/(authenticated)/quality/pts/`, PTS lookup resources from
Plan 007, and `docs/manual-pts-parity.md`.

**Out of scope:** Quality Inspection PTS, generic workflows, dashboards,
exports, notification redesign, framework packages, legacy URLs, and legacy
data import.

## Git workflow

- Keep the current branch. Do not push or commit unless asked.
- Generate and review the migration. Do not hand-edit it after it is applied.
- Use the route organization in
  `/Users/gamer/Documents/projects/is-framework/apps/web/src/routes/(authenticated)/hr/overtimes/`:
  resource/operations next to list/create/edit/detail routes.

## Steps

### Step 1: Add the retained PTS contract as one migration

Use the Plan 005 ledger to add current-name fields to `qhssePts`:
`locationZone`, `implementationUserId`, `workMethod`, `followUpPlan`,
`estimatedCost`, `jobImplementorType`, `estimatedVendorId`,
`actualJobImplementorType`, and `rejectedNotes`. Keep the existing `vendorId`
as the current mapping for legacy `actual_project_vendor_id`; do not add a
duplicate actual-vendor column. Keep `implementationPlan` only as a documented
new field; do not treat it as a replacement for the assigned user or work
method.

Use relations to Users and Project Vendors. Do not add `roleId`, legacy integer
keys, `active`, Laravel timestamps, or an `implementationStatusCode` copy.
The current `closeNotes` and `closeDate` remain an explicit safer new close
record.

**Verify**: run the migration generator, review the one new SQL directory, and
run API type check.

### Step 2: Extend input schemas and server persistence

Extend report create/update with `locationZone`. Extend actions as follows:

- analysis: `somUserId`, `followUpPlan`, and `targetDate`;
- implementation follow-up: `implementationUserId`, `workMethod`;
- price follow-up: `estimatedCost`, `jobImplementorType`, optional
  `estimatedVendorId` only for `vendor`;
- implementation report: date, description, cost, process image, after image;
- verification: decision, note, and write `rejectedNotes` only on rejection;
- realization: actual cost, `actualJobImplementorType`, optional `vendorId`
  only for `vendor`.

Extend the PTS lookup endpoint with active project users for the selected
project. Validate the target user has an active project assignment. Validate
each vendor belongs to the PTS project and is active. Reject an unknown cost
type. Maintain the current row lock, permission checks, activity, and
notification behavior.

**Verify**: API type check and API lint exit 0.

### Step 3: Define PTS fields and remove duplicated report form plumbing

Define every report field in `pts.resource.ts`: date, division, project, PTS
work category, work-item category, leaf work item, criteria, root causes,
before image, location zone, location, and description. Use the typed lookup
resources from Plan 007 and dependent `behavior.resetWhen`. Use `radio` for
the three criteria, `checkbox-group` for root causes, `location` for location,
and the existing retained-upload flow for images.

Add a route-local read-only Project User lookup resource for action forms; it
loads only active members of the PTS project. Replace `create.route.vue` with `FormView`, or the same resource-owned `Form`
pattern if retained upload needs a small route-owned adapter. Do not send
number, source, status, step, audit fields, or action fields from this form.
Keep workflow action forms route-local in `[ptsId]/detail.route.vue`, because
the server supplies `availableActions`.

**Verify**: Web type check exits 0. A test changes division and project, then
checks that child selections reset and the submitted create value has no
server-owned field.

### Step 4: Render the full retained record and action data

Update the list and detail projections to show useful identity, report fields,
root causes, photos, each retained action value, activity, current status, and
close evidence. Use human labels for users, vendors, cost types, and
disposition values. Show `rejectedNotes` after a rejected verification. Do not
infer an action from `stepCode`; render only actions in `availableActions`.

**Verify**: a route test renders an active row with available actions and a
closed row without them. It also renders a legacy-parity action value.

### Step 5: Add focused regression coverage

Extend `qhsse-pts.spec.ts` with one path that persists the newly retained
fields and proves cross-project users/vendors are rejected. Extend
`pts.route.spec.ts` with resource-form field coverage, dependent resets, and
detail display. Keep the current concurrent-action test; do not add snapshots
or test every scalar alone.

**Verify**: run API tests, Web tests, then both type checks.

## Test plan

- API: retained field persistence; vendor/type conditional validation;
  implementation-user project access; reject note persistence; existing low,
  high, and concurrent workflow cases remain green.
- Web: resource form fields; dependent lookup reset; no server-owned report
  input; active/closed detail rendering.
- Use the existing PTS API and route tests named above. Do not use live browser
  network calls.

## Done criteria

- [ ] Every manual PTS legacy business field is retained or explicitly
  excluded in `docs/manual-pts-parity.md`.
- [ ] Each retained field has database, schema, validation, persistence,
  list/detail, and form/action coverage.
- [ ] The report resource owns ordinary report fields; action availability is
  still server-authoritative.
- [ ] Generated migration, API and Web tests, type checks, and API lint pass.
- [ ] No framework package changed.

## STOP conditions

- A ledger mapping needs a different workflow transition.
- The user/project model cannot identify an active implementation assignee.
- The existing renderer cannot retain an image or multiple root causes.
- Work requires QI-created PTS, a generic engine, or a framework change.

## Maintenance notes

For every new PTS business field, change the entity, input schema, server
persistence, PTS resource/detail, and one domain test together. Keep workflow
state and access control in `qhsse-pts.service.ts`.
