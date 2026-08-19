# Plan 068: Defer Quality Inspection recap Excel export

> **Implementation instructions**: This is a scope record, not an execution
> plan. Do not modify application source. Mark this plan DEFERRED in
> `plans/README.md` and report that no implementation was performed.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans/067-align-quality-inspection-list-parity.md
- **Category**: direction
- **Planned at**: commit `08b3028`, 2026-08-19

## Why this matters

Legacy Quality Inspection has a list-level recap Excel export. The user has
explicitly deferred this feature. Recording the decision prevents an agent
from adding an export endpoint while implementing list parity.

## Current state

- Legacy configuration enables list export at
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/components/composites/CRUD/CRUDList.vue:151-164`.
- Legacy routes register
  `quality-inspection/export-recap/excel` in
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/routes/api.php:136`.
- The current framework already has a generic Excel button in
  `packages/is-vue-framework/src/components/views/ListView.vue:429-444`, but
  that is not the legacy recap contract.
- The current approved QI slice includes only closed-report evidence export.

## Scope

**In scope**:

- This decision record.
- `plans/README.md` status and deferred-work note.

**Out of scope**:

- API routes, Excel generation, web buttons, filters, and tests for recap
  export.

## Steps

### Step 1: Record the deferral

Set the Plan 068 status to `DEFERRED (user decision)` in `plans/README.md`.
Keep the feature in the findings/deferred section with its legacy evidence.

**Verify**: `rg -n "068|recap Excel|DEFERRED" plans/README.md` shows the plan and
the deferral.

## Done criteria

- [ ] No application source changed.
- [ ] Plan 068 is marked deferred.
- [ ] The implementation agent does not execute this plan.

## STOP conditions

Stop and report if another plan adds an export endpoint or export control as a
dependency of this deferred feature.

## Maintenance notes

When export work is approved, create a new plan after the current sequence.
Define the Excel data contract, filters, authorization, and file verification
before adding the button.
