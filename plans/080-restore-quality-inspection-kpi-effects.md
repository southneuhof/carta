# Plan 080: Restore Quality Inspection KPI side effects

> **Implementation instructions**: Read this plan fully. This plan is mainly
> API/database work and does not require a web UI change. Do not invent a new
> KPI framework. First locate an existing KPI write contract in the current
> repository. If none exists, stop and report the missing architecture instead
> of adding a speculative table or migration.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: plans/076-align-quality-inspection-workflow-actions.md
- **Category**: tech-debt
- **Planned at**: commit `08b3028`, 2026-08-19

## Why this matters

The legacy module updates KPI data when item inspections complete, when a report
returns to repair, and when an inspected report is deleted. The current QI
service has no visible KPI integration. If the new application has an approved
KPI sink, QI must update it in the same transaction as the business action. If
it does not, creating a new KPI architecture is larger than this parity task
and must be a separate decision.

## Current state

- The current repository search at plan time found no `increaseKpi`,
  `decreaseKpi`, or KPI service in `apps/api/src` or `apps/web/src`.
- Legacy item verification calls `increaseKpi` at
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Services/QualityInspectionWorkItemItp/VerifyQualityInspectionWorkItemItp.php:102-110`.
- Legacy report repair calls `decreaseKpi` at
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Services/QualityInspection/VerifyQualityInspection.php:47-66`.
- Legacy delete calls `decreaseKpi` for inspected/submitted reports at
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/QualityInspection.php:525-537`.
- Current QI actions are transactional in
  `apps/api/src/routes/quality-inspection/quality-inspection.service.ts:444-514`.

## Commands you will need

| Purpose | Command | Expected result |
|---|---|---|
| Search KPI contract | `rg -n "KPI|kpi|increaseKpi|decreaseKpi" apps packages docs` | either an existing contract or no current implementation |
| API focused test | `pnpm --filter @southneuhof/api exec node --env-file-if-exists=.env ./node_modules/vitest/vitest.mjs run src/__tests__/quality-inspection.spec.ts` | exit 0 |
| API type check | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| Diff check | `git diff --check` | no output |

## Scope

**In scope**:

- Integration with an existing current KPI contract, if one is found.
- Transactional QI KPI calls for item verification, repair, and qualifying
  delete.
- Focused API tests.
- `plans/README.md` status row.

**Out of scope**:

- Creating a generic KPI framework.
- Creating a new KPI database schema without explicit architecture approval.
- Notifications, Todo, mobile, web UI, and framework source.

## Steps

### Step 1: Find and verify the current KPI sink

Search the repository and read the owner module. Identify its write function,
event shape, transaction requirements, and idempotency rules. If the search
finds no current contract, stop and report that Plan 080 is blocked by missing
KPI architecture.

**Verify**: the existing KPI owner test or type contract is identified.

### Step 2: Map legacy side effects to current actions

If a contract exists, map:

- Item approved/rejected: increase the item KPI once per completed item
  verification.
- Report repair: decrease the prior item KPI contribution before resetting
  current item results.
- Delete after inspection: decrease the report's item contributions once.

Use the current append-only event IDs and report state to prevent duplicate
updates. Keep all writes inside the existing QI transaction.

**Verify**: API tests cover each action once and repeated calls fail before a
second KPI update.

### Step 3: Test rollback behavior

Force the KPI write to fail in a focused test and prove the QI action rolls
back with it. Do not leave a report state and KPI state out of sync.

**Verify**: the transaction test exits 0 and shows no partial QI update.

## Test plan

- Add QI API tests beside the existing workflow tests.
- Follow the current KPI owner's test pattern if one exists.
- If no owner exists, write no implementation tests; report the blocker.

## Done criteria

- [ ] Existing KPI contract is found and used, or the plan is explicitly
  blocked with evidence.
- [ ] KPI updates are transactional and idempotent.
- [ ] Item verification, repair, and qualifying delete are covered.
- [ ] No speculative KPI architecture is added.
- [ ] `plans/README.md` marks Plan 080 DONE or BLOCKED with the reason.

## STOP conditions

Stop and report if:

- no current KPI contract exists;
- KPI meaning cannot be mapped to current event/state data;
- the owner requires a new migration or cross-module architecture; or
- idempotent rollback cannot be guaranteed.

## Maintenance notes

KPI updates must remain coupled to the business transaction. Reviewers should
check duplicate calls after retry, repair, and soft delete.
