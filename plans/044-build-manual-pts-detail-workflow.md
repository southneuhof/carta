# Plan 044: Build the manual PTS detail and action screens

> **Implementation instructions**: Follow this plan in order. Run each check
> before the next step. Extend the PTS web resource from plan 043. The API is the
> authority for available actions. If a STOP condition occurs, stop and report
> it. When implementation and review are complete, update this plan row in
> `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 1b8ae46..HEAD -- apps/web/src/routes/'(authenticated)'/quality/pts apps/api/src/routes/qhsse-pts packages/is-vue-framework`
> Plans 040-043 are expected to change these paths. Confirm their done criteria
> and use the live code as the baseline. Any other material mismatch is a STOP
> condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans 042 and 043
- **Category**: migration
- **Planned at**: commit `1b8ae46`, 2026-08-12

## Why this matters

The detail page is where users complete the manual PTS process. It must show the
completed business record in legacy order and expose only the action that the
API permits now. The route must not copy the state machine, or the UI and API
will disagree after the first workflow change.

## Current state

- Plan 043 creates the PTS resource, action transport, invalidation helper, list,
  create, and edit routes. Extend those files instead of adding another client.
- `apps/web/src/routes/(authenticated)/master-data/projects/[projectId]/detail.route.vue:15-19`
  shows the current route-owned composition around framework detail surfaces.
- Framework reuse is required by `AGENTS.md`: use existing `Detail`, `Card`,
  `DialogForm`, `ConfirmationDialog`, `ImagePreview`, `Timeline`, `Chip`, and
  field renderers.
- The detail composition and action payloads are fixed in
  `docs/superpowers/specs/2026-08-12-manual-pts-parity-design.md`, sections
  "Field rules", "Web screens: Detail", "Refresh and form behavior", and
  "Error behavior".

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused tests | `pnpm --filter @southneuhof/framework-web test -- pts` | exit 0; PTS tests pass |
| Type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0; no errors |
| Lint | `pnpm --filter @southneuhof/framework-web lint:check` | exit 0 |
| API tests | `pnpm --filter @southneuhof/api test -- qhsse-pts.spec.ts` | exit 0 |
| Diff check | `git diff --check` | no output |

## Suggested implementation toolkit

- Read and use `.agents/skills/web-ui-surface-reuse/SKILL.md`.
- Read `docs/architecture/web-application-architecture.md`,
  `packages/is-vue-framework/README.md`, and the completed plan-043 PTS resource
  before editing.
- Use the real browser for the light and heavy flows after focused tests pass.

## Scope

**In scope**:

- `apps/web/src/routes/(authenticated)/quality/pts/[ptsId]/detail.route.vue`
  (create)
- route-local PTS detail section components only if the route becomes hard to
  read; keep each component tied to one named business section
- PTS schema, actions, resource, labels, and helper files created by plan 043
- focused route/resource tests in the PTS directory
- generated route type files only if the existing route generator updates them

**Out of scope**:

- Framework, API, database, and shared app adapter changes.
- List, card-grid, create, and edit redesign.
- A client workflow engine, local permission map, or step-to-action map.
- Generic process-section, workflow-dialog, or action-card components.
- Quality Inspection, import, print/PDF, and role-specific behavior.

## Reuse requirement

Reuse `Detail`, `Card`, `DialogForm`, `Form`, `ConfirmationDialog`,
`ImagePreview`, `Timeline`, `Chip`, `Button`, and the existing lookup, text,
textarea, date, currency, radio, and image renderers. Keep the final report:

- **Reused**: the exact surfaces used;
- **Searched**: `packages/is-vue-framework/src/components`, renderers, current
  app detail/dialog routes, and the completed PTS resource;
- **Gap**: "none" unless a real gap is found. A real gap is a STOP condition,
  not permission to edit the framework.

## Git workflow

- Suggested branch: `codex/044-pts-detail-workflow`.
- Suggested commit: `feat(web): add manual PTS workflow screens`.
- Do not push or open a pull request unless the operator asks.

## Steps

### Step 1: Define readable detail sections and action field sets

Extend the PTS field catalog with display and form behavior for workflow fields.
Keep shared labels and options in the schema/resource layer. Define business
section arrays in report order so the template does not contain many field-name
conditions.

Section order:

1. before, process, and after images;
2. report summary with criteria and status chips;
3. completed process sections in business order;
4. current available action;
5. separate verification card when verification is available;
6. activity history.

Do not use numeric step indexes or infer completion from local action rules. Use
returned values for completed sections and `availableActions` for controls.

**Verify**:
focused resource tests must assert shared action labels/options and section
order without snapshotting framework markup.

### Step 2: Build the report summary and completed process history

Create the detail route around the PTS detail resource. Use framework `Card`
and `Detail` for each named section. Use `ImagePreview` for retained images,
chips for criteria/status, and `Timeline` for ordered activity. Show absent
process/after images as absent data, not broken images.

Render completed business data in this order when present: disposition,
temporary plan, management notes, complete report, implementation follow-up,
price follow-up, implementation report, verification, realization, and close.
Keep visible Indonesian labels from the resource catalog.

**Verify**:
focused tests must render representative light, heavy, rejected, and closed
detail records and assert section order and optional-section absence.

### Step 3: Add disposition and heavy-branch dialogs

Render the disposition dialog only when the API returns `disposition`. Use the
four exact values and labels:

- `approved`: Tetap Dipakai;
- `repair`: Diperbaiki;
- `downgrade`: Diturunkan Mutu (dengan persetujuan pengguna jasa);
- `demolish`: Dibongkar dan Dikerjakan Ulang.

Do not require a note. Add required text dialogs for temporary plan and
management notes only when their action names are returned. Do not add target
dates to these dialogs.

Use the PTS action/invalidate helper from plan 043 for every submit.

**Verify**:
focused tests must assert exact payloads, required fields, labels, success
refresh order, and failure-open behavior.

### Step 4: Add complete-report and parallel follow-up dialogs

The complete-report dialog requires SOM/maintenance manager, corrective plan,
and target date. Use the project-scoped user source from the API.

Implementation follow-up requires implementation user and work method. Price
follow-up requires estimated cost and implementor type. Show and require vendor
only when type is `vendor`; label the option Vendor/Subkon. The page can show
both follow-up actions when the API returns both, or only the unfinished one
after the first completes. Do not decide this from local step values.

**Verify**:
focused tests must cover internal/vendor conditional fields and both API-provided
follow-up availability sets.

### Step 5: Add implementation, verification, realization, and close actions

Implementation report requires date, process image, and after image; description
is optional. There is no partial implementation mode.

Put verification in a separate card. Use `approved` and `rejected`; notes are
optional. Realization requires actual cost and actual implementor type, with
actual vendor required only for `vendor`. Use `ConfirmationDialog` for close
because close has no form payload. Use `DialogForm` for all actions with fields.

The route does not check the current user against `implementationUserId`. The
API decides whether the action is present and accepts the submission.

**Verify**:
focused tests must cover complete image proof, optional descriptions, rejection
payload, vendor condition, close confirmation, and server error display.

### Step 6: Prove refresh and error behavior for every action

For each action, assert this sequence on success: await action, await
`pts.invalidate({ id })`, active list/detail refetch, close, success message.
For each failure class, keep the dialog open, show the normalized error, do not
show success, and do not invalidate valid data.

Use one helper, not one copy per dialog. Do not change framework custom-action
semantics.

**Verify**:
focused tests must parameterize the shared success/failure contract across all
action names without making one brittle DOM test per form field.

### Step 7: Run focused browser flows

Run one light path and one heavy path in the real application. The light path
must include verification rejection and full implementation resubmission. The
heavy path must include temporary plan and management notes. Confirm that each
submit updates the visible detail without a page reload.

Record the tested route, path, and result in the implementation handoff. Do not
add screenshots to git unless the existing test harness requires them.

**Verify**:
the observed record reaches `close/close` in both flows and the browser shows
the new activity after each action without manual reload.

### Step 8: Run the web gate

**Verify**:

- `pnpm --filter @southneuhof/framework-web test -- pts`
- `pnpm --filter @southneuhof/framework-web type-check`
- `pnpm --filter @southneuhof/framework-web lint:check`
- `pnpm --filter @southneuhof/api test -- qhsse-pts.spec.ts`
- `git diff --check`

All commands must exit 0. `git status --short` must show only in-scope files.

## Test plan

Add focused tests for:

- detail section order for light, heavy, rejected, and closed records;
- image, summary, status, and activity rendering;
- dialogs controlled only by `availableActions`;
- each action's exact field set and payload;
- vendor conditional fields;
- complete implementation image proof;
- rejection and resubmission availability;
- shared success invalidation and failed-action behavior;
- close confirmation.

Do not duplicate the API state machine in fixtures or assertions. Fixtures state
which actions the API returned; the UI test checks only the rendered response.

## Done criteria

- [ ] Detail sections follow the approved business order.
- [ ] Actions render only from API `availableActions`.
- [ ] All action forms use exact fields, values, and required rules.
- [ ] Verification is separate and rejection supports resubmission.
- [ ] All successful actions refresh without page reload.
- [ ] Failed actions keep their dialogs and good cache state.
- [ ] No client state machine, role checks, or framework changes exist.
- [ ] Light and heavy real-browser flows reach close.
- [ ] Focused tests, type check, lint, API check, and diff check pass.
- [ ] Reuse report contains Reused, Searched, and Gap.

## STOP conditions

Stop and report if:

- the API omits an approved action, field, display value, or activity value;
- the route needs to infer an action not present in `availableActions`;
- an action form needs a missing framework surface or renderer;
- refresh cannot use the plan-043 PTS helper and resource invalidation;
- the real browser behavior differs from the approved state contract; or
- a check fails twice after a reasonable correction.

## Maintenance notes

The server owns transitions and permissions. A future action must first exist in
the API catalog and detail contract. Keep section definitions as plain route
data; do not create a workflow rendering framework until another domain proves
the same contract.

