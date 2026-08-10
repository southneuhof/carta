# Plan 003: Establish the manual PTS parity ledger

> **Implementation instructions**: Use `$ads-hk-module-slice` for this PTS
> inventory. Follow this plan step by step. Do not
> change application source, database migrations, or framework packages. This
> plan creates the contract for later plans.
>
> **Drift check (run first)**: `git diff --stat abb232f..HEAD -- apps/api/src/routes "apps/web/src/routes/(authenticated)/master-data" "apps/web/src/routes/(authenticated)/quality/pts" plans`
> If a cited file changed, compare the current field list with this plan. Stop
> if a legacy field already has a different mapping.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: `plans/002-make-current-administration-forms-functional.md`
- **Category**: docs
- **Planned at**: commit `abb232f`, 2026-08-10

## Why this matters

Manual PTS now has a working API and pages, but it has no reviewed record of
which legacy business fields it retains. The legacy PTS model has fields that
the new report schema does not expose, including `location_zone`, assigned
implementor, cost type, and rejected notes. A small ledger keeps the overhaul
close to the business reference without copying legacy technical design.

## Current state

- `apps/api/src/routes/qhsse-pts/qhsse-pts.entity.ts:12-116` defines the new
  PTS table. It already retains report identity, three images, cost values,
  vendor, state, and action dates.
- `apps/api/src/routes/qhsse-pts/qhsse-pts.schemas.ts:5-65` accepts only the
  report fields and current action payloads. It has no `locationZone`,
  `implementationUserId`, `workMethod`, cost-type, or rejected-note input.
- `apps/web/src/routes/(authenticated)/quality/pts/create.route.vue` has a
  hand-written report form. `pts.resource.ts:5-35` has no PTS form fields.
- `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/QhssePts.php:29-32`
  is the final legacy PTS field list. The legacy create configuration at
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/qhsse-pts.ts:6-17`
  confirms the report-stage fields.
- The form catalog already exists at
  `apps/web/src/routes/(demo)/input-catalog/` and is byte-identical to the
  requested framework source. Do not copy or modify it.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Ledger check | `rg -n '^## (Retained|Explicit exceptions|PTSDirect master data)' docs/manual-pts-parity.md` | Three headings |
| Markdown check | `git diff --check` | Exit 0 |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | Exit 0, no errors |

## Scope

**In scope:** `docs/manual-pts-parity.md`, `plans/README.md`.

**Out of scope:** application source, migrations, framework packages, QI PTS,
dashboards, legacy-row import, and all master data not used by manual PTS.

## Git workflow

- Keep the current branch. Do not commit, push, or open a pull request unless
  the operator asks.
- Use the existing direct Markdown style in `plans/README.md`.

## Steps

### Step 1: Record the PTS report contract

Create `docs/manual-pts-parity.md`. Under **Retained**, add a row for each
legacy report field: `date`, `division_id`, `project_id`,
`pts_work_category_id`, `work_item_category_id`, `work_item_id`,
`criteria_code`, root causes, `img_before`, `location`, `location_zone`, and
`description`. Map a new camel-case name only when its meaning is equal.

Record `root_cause_code` as replaced by the typed many-to-many
`qhsse_pts_root_cause.rootCauseId` relation. Record `number`, `source`,
`status_code`, `step_code`, and audit fields as server-owned values, not form
input.

**Verify**: run the Ledger check command; it returns the three headings.

### Step 2: Record each workflow field and planned mapping

Add action rows for: disposition; temporary plan; management notes; analysis
(`som_user_id`, `follow_up_plan`, `target_date`); implementation follow-up
(`implementation_user_id`, `work_method`); price follow-up
(`estimation_cost`, `job_implementor_type`, `project_vendor_id`);
implementation report; verification (`implementation_verification_description`,
`rejected_notes`); and realization (`actual_cost`,
`actual_job_implementor_type`, `actual_project_vendor_id`).

Use these names in later plans: `implementationUserId`, `workMethod`,
`followUpPlan`, `estimatedCost`, `jobImplementorType`,
`actualJobImplementorType`, and `rejectedNotes`. Map legacy
`actual_project_vendor_id` to the current `vendorId`; a vendor is required
only for the `vendor` cost type. Keep `closeNotes` and `closeDate` as explicit
new fields.

**Verify**: `rg -n 'implementationUserId|jobImplementorType|rejectedNotes|locationZone' docs/manual-pts-parity.md` returns four matches.

### Step 3: State the direct master-data boundary

Under **PTS direct master data**, list only Business Categories, Divisions,
Projects, UOMs, Work Items, Project Vendors, PTS Work Categories, Root Causes,
Number Variables, and Number Configurations. For each, list its legacy fields,
current table/route, and its owner plan (004 or 005).

Under **Explicit exceptions**, name these legacy items with their reason:
QI-created PTS, PTS dashboards and exports, legacy numeric IDs, Laravel audit
columns, legacy soft delete, and `role_id`. Do not list unrelated legacy menus.

**Verify**: `rg -n 'QI-created PTS|role_id|Number Configurations' docs/manual-pts-parity.md` returns three matches.

### Step 4: Update the plan index

Mark Plans 001 and 002 as DONE. Keep Plans 003–006 in the active manual PTS
execution order. Keep Plan 007 blocked until framework approval. Do not add
later feature slices to this plan index.

**Verify**: `git diff --check` exits 0.

## Test plan

No automated test is needed. A reviewer checks every mapping against the
legacy model and configuration cited above.

## Done criteria

- [ ] `docs/manual-pts-parity.md` maps every manual PTS business field or has
  an explicit exception.
- [ ] It has no unrelated legacy master-data row.
- [ ] The form catalog is marked as present and unchanged.
- [ ] `git diff --check` and the Web type check command exit 0.

## STOP conditions

- A legacy PTS field has two plausible current meanings.
- A retained field requires a new framework renderer.
- A mapping would restore the legacy magic role-ID branch.

## Maintenance notes

Update this ledger in the same change as every new PTS field. A field is not
complete until its database, API schema, list/detail output, and form location
are all recorded.
