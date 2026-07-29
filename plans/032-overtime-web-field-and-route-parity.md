# Plan 032: Implement overtime web field, form, and route parity

> **Implementation instructions:** Build UI parity on the frozen API contract from
> Plans 030–031. Use current resource/route architecture; do not reintroduce
> HKA's legacy BaseCRUD.
>
> **Drift check:** `git diff --stat 7700799..HEAD -- apps/web/src/routes/(authenticated)/hr/overtimes apps/web/src/manifest/navigation.ts apps/web/src/framework apps/web/src/router packages/is-vue-framework/src/fields`

## Status

- **Priority:** P1
- **Effort:** L
- **Risk:** MED
- **Depends on:** `plans/030-overtime-canonical-contract-and-schema.md`, `plans/031-overtime-api-lookups-and-filters.md`, `plans/029-public-input-catalog-demo.md`
- **Category:** migration
- **Planned at:** commit `7700799`, 2026-07-29

## Why this matters

Current resource fields are English and incomplete: form omits section/applicant,
list lacks HKA filters, and status is plain text. This plan translates the
reference config into typed fields, renderer props, and route-owned controls
without importing legacy architecture.

## Evidence

- Current `apps/web/src/routes/(authenticated)/hr/overtimes/overtimes.resource.ts:9-24`
  defines only date, start time, duration, applicant display, status, description,
  created time; form fields omit section/applicant.
- Reference
  `/Users/gamer/Documents/projects/hka-trom/frontend/src/app/configs/overtimes.ts:54-156`
  requires section/applicant/date/start/duration/description, Indonesian aliases,
  status chips, relation aliases, lookup dependencies, and “Menit” unit.
- Current route files: `index.route.vue` renders `ListView`; `create.route.vue`
  renders `FormView`; these are the correct integration points.

## Scope

**In scope**

- overtime operations/resource/route files
- typed filter adapter and field catalog
- focused resource/route tests
- manifest HR entry only if title/target requires correction

**Out of scope**

- API/schema changes (030–031)
- verification endpoint/UI (033)
- app shell (034)
- legacy BaseCRUD or unrelated modules

## Steps

### Step 1: Map API types into operations

Update `overtimes.operations.ts` types only from the canonical API operations.
Add typed list query input for all five filters. No `any`, `as unknown as`, or
client-side wire-name guessing.

**Verify:** web typecheck and operations type tests pass.

### Step 2: Define complete fields

Implement field order and labels matching HKA:
`Ruas`, `Karyawan`, `Tanggal Lembur`, `Waktu Mulai Lembur`,
`Estimasi Lama Lembur`, `Keterangan`, `Status`, timestamps, and available
verification/realization fields. Use relation display readers. Use date/time/
number renderers validated by Plan 029; duration shows `Menit`.

**Verify:** resource tests assert exact field keys/order/labels/renderer props.

### Step 3: Implement dependent form fields

Section lookup required. Applicant lookup hidden/disabled until section exists;
its query includes selected section and HKA applicant purpose. Clear applicant
when section changes if it is no longer valid. Preserve server-derived behavior:
UI selection must not bypass API ownership rules.

**Verify:** component/resource tests cover initial hidden state, section select,
query propagation, reset on section change, and validation.

### Step 4: Add list filters and status presentation

Expose section, employee, start/end date, job position, and status radio/chip
filters through existing table/query mechanisms. Use Indonesian status labels:
`Menunggu Verifikasi`, `Disetujui`, `Ditolak`; preserve draft display if current
workflow exposes it.

**Verify:** route test serializes filters into expected query keys and status
rendering is stable.

### Step 5: Keep route ownership explicit

Keep list/create/detail/edit route files ordinary Vue routes. Resource defines
data/field behavior; routes own custom slots and future verification controls.
Do not add a central module registry.

**Verify:** web tests/typecheck/build pass; route map has no unrelated changes.

## Test plan

- Resource tests modeled after existing `*.resource.spec.ts`.
- Web route tests for list/create/detail field projection and filter serialization.
- Manual parity checklist against every HKA config field/filter.

## Done criteria

- [ ] UI fields, labels, units, relations, dependent lookups, filters, and status
  formatting match reference within canonical contract limits.
- [ ] Routes use current resource-first architecture.
- [ ] Tests/typecheck/build pass.
- [ ] No verification/DB/shell work included; index updated.

## STOP conditions

- API contract from 030/031 cannot represent a required HKA field.
- Input catalog reveals renderer cannot support a required behavior without
  framework changes.
- HKA field depends on unavailable attendance/realization data.

## Maintenance notes

Any field change updates operations type, resource catalog, tests, and parity
checklist. Keep transport code out of resource files.
