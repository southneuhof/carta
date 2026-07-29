# Plan 030: Freeze overtime canonical contract and migrate schema

> **Implementation instructions:** This is the first overtime parity plan. It
> defines one canonical contract before API or UI work starts. Do not implement
> filters or visual parity in this plan. Stop on every STOP condition.
>
> **Drift check:** `git diff --stat 7700799..HEAD -- apps/api/src/routes/overtimes apps/api/src/routes/organization apps/api/src/routes/employees apps/api/src/db.ts apps/api/drizzle.config.ts apps/api/src/__tests__ packages/contracts`

## Status

- **Priority:** P1
- **Effort:** L
- **Risk:** HIGH
- **Depends on:** none
- **Category:** migration
- **Planned at:** commit `7700799`, 2026-07-29

## Why this matters

Current overtime code and HKA TROM use different names, identifier types, and
field ownership. If API/UI work starts first, each layer will guess a different
shape. This plan produces a written mapping and one authoritative Drizzle/Zod
contract while preserving security invariants: applicant, section, creator, and
status remain server-derived.

## Evidence to read first

- Current: `apps/api/src/routes/overtimes/overtimes.entity.ts:25-69` uses text UUID
  `id`, `applicantEmployeeId`, `estimatedMinutes`, status default `draft`, and
  applicant/section relations.
- Current: `apps/api/src/routes/overtimes/overtimes.model.ts:34-52` derives
  applicant, section, creator, and draft status from identity.
- Reference:
  `/Users/gamer/Documents/projects/hka-trom/backend/database/migrations/2023_08_24_151444_create_overtimes.php`
  defines integer `id`, `section_id`, `applicant_id`, `estimated_duration`,
  verification columns, and timestamps.
- Reference:
  `/Users/gamer/Documents/projects/hka-trom/backend/app/Models/Overtimes.php`
  lists validation and relation/display fields. The later duration migration
  must be checked because historical schema and current reference may differ.

## Canonical contract decision

Before coding, write a mapping document or plan comment covering:

| Concern | Current repo | HKA reference | Required decision |
|---|---|---|---|
| Primary ID | text UUID | integer | preserve UUID, or explicit migration |
| Applicant | `applicant_employee_id` | `applicant_id` | canonical API/DB naming |
| Duration | `estimated_minutes` | `estimated_duration` | canonical API/DB naming |
| Status | draft/waiting/approved/rejected | waiting/approved/rejected in UI, legacy default waiting | preserve draft workflow or remove |
| Verification | `log_verifications` chain | columns + legacy log rows | source of truth |
| Realization | absent from current entity | legacy detail fields | nullable projection or defer |
| Timestamps | string timestamps | timestamptz | wire serialization |

Preferred safe default: preserve current UUID and draft/chain workflow, expose
HKA-compatible labels/aliases at the web boundary, and avoid destructive
primary-key migration unless existing data proves integer compatibility is
required. A weaker executor must not choose this default silently: record the
decision and rationale.

## Commands

| Purpose | Command | Expected |
|---|---|---|
| API typecheck | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| API tests | `pnpm --filter @southneuhof/api test` | all pass |
| Schema inspection | `pnpm --filter @southneuhof/api db:generate` | migration diff is intentional |
| Git scope | `git status --short` | only Scope paths changed |

## Scope

**In scope**

- `apps/api/src/routes/overtimes/overtimes.entity.ts`
- overtime migration/schema files and Drizzle config only as required
- focused entity/schema tests
- a mapping document under `docs/architecture/` only if needed to preserve the decision

**Out of scope**

- list filters/lookups (Plan 031)
- web fields/routes/menu (Plan 032)
- verification UI, DB refresh, seeds, acceptance (Plan 033)
- unrelated entities or global ID migration

## Steps

### Step 1: Inspect live schema and dependencies

Read current migrations, database URL target, all imports of overtime identity
and fields, and seed fixtures. Search for every use of `applicantEmployeeId`,
`estimatedMinutes`, and `overtimes.id`. Do not edit until every downstream
consumer is listed.

**Verify:** `rg -n "applicantEmployeeId|estimatedMinutes|overtimes\.id" apps packages`
produces a reviewed inventory with no unknown consumers.

### Step 2: Record canonical mapping and migration strategy

Document final field names/types and compatibility approach. If renaming DB
columns, create an explicit reversible migration plan. If keeping current
names, define HKA aliases at transport/UI layer. Decide whether realization
fields are unsupported or nullable read-only. Preserve caller-derived fields.

**Verify:** reviewer can answer identity, duration, status, verification, and
realization questions from the mapping alone.

### Step 3: Update entity schemas and relations

Implement only the chosen canonical shape in Drizzle/Zod. Keep create/update
schemas from accepting client-controlled applicant/section/status/creator.
Add verification/realization columns only if the mapping says current backend
owns them; otherwise do not add speculative columns. Keep relation materialization
names stable for Plan 032.

**Verify:** entity type/schema tests prove accepted create/update keys,
rejected derived keys, nullability, status enum, and relation output.

### Step 4: Generate and review migration

Generate migration, inspect SQL, and ensure no accidental drop/recreate of
unrelated tables. Add backfill only if data mapping is deterministic. Never
run reset here.

**Verify:** `pnpm --filter @southneuhof/api db:generate` produces only intentional
overtime migration; typecheck/tests pass.

## Test plan

- Entity schema tests for create/update/select.
- Migration review test or documented SQL review for existing rows.
- Existing `apps/api/src/__tests__/overtimes.spec.ts` remains green.

## Done criteria

- [ ] Canonical mapping committed in docs/plan implementation notes.
- [ ] Entity, relations, Zod schemas, and migration agree.
- [ ] Caller-derived invariants preserved.
- [ ] No filter/UI/verification work included.
- [ ] API typecheck/tests pass.

## STOP conditions

- Existing DB contains IDs/rows that cannot map deterministically.
- Integer primary-key migration would require broad unrelated changes.
- HKA legacy columns conflict with current chain source of truth.
- Generated SQL drops data or unrelated tables.

## Maintenance notes

Plans 031–033 must consume this contract, never reinterpret it. Any later field
rename needs migration, operations type, resource catalog, and seed updates.
