# Plan 064: Build Quality Inspection workflow, PTS completion, and evidence

> **Implementation instructions**: Start only after plans 062 and 063 are DONE.
> Invoke the **Web UI Surface Reuse** skill before editing `apps/web`; state
> `Reused`, `Searched`, and `Gap` in the handoff. Keep all custom workflow UI
> route-local. Run every verification command and update this plan row in
> `plans/README.md` only after implementation and review.
>
> **Drift check (run first)**: `git diff --stat 77b7f49..HEAD -- apps/web/src apps/api/src/routes/{quality-inspection,qhsse-pts} packages/is-vue-framework`

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: `plans/062-build-quality-inspection-api-and-data-contract.md`, `plans/063-build-quality-inspection-resource-and-report-creation.md`
- **Category**: migration
- **Planned at**: commit `77b7f49`, 2026-08-18

## Why this matters

The legacy quality process is a real work flow, not CRUD. This plan presents
the server-owned state machine, preserves immutable inspection history, lets a
PTS user complete a QI-created PTS, and keeps the closed-report proof layout.

## Current state

- The authoritative state flow is `quality-inspection-design.md:67-107`; item
  verification and PTS rules are lines 265-338; photo and final rules are lines
  352-419; detail/evidence requirements are lines 448-478.
- `apps/web/src/routes/(authenticated)/quality/pts/[ptsId]/detail.route.vue`
  is the nearest route-local Detail, DialogForm, action, timeline, and refresh
  pattern. Reuse its action-then-invalidate approach.
- The app already includes `vue-to-print` and `qrcode.vue`. They are the
  smallest existing solution for legacy closed-report evidence. Do not add a
  PDF/print dependency or framework printing surface.
- Plan 062 adds `qi-report` PTS and the `complete-qi-report` action. The PTS
  page must expose this action only for that server-reported action.

## Commands you will need

| Purpose | Command | Expected result |
|---|---|---|
| Web focused tests | `pnpm --filter @southneuhof/framework-web test -- quality-inspection` | exit 0 |
| PTS web tests | `pnpm --filter @southneuhof/framework-web test -- pts` | exit 0 |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | exit 0 |
| API focused tests | `pnpm --filter @southneuhof/api test -- quality-inspection qhsse-pts` | exit 0 |
| Diff check | `git diff --check` | no output |

## Suggested implementation toolkit

- **Must invoke `web-ui-surface-reuse`** for DetailView, Detail, Table,
  DialogForm, Timeline, Button, Card, ImagePreview, print, and PTS action
  choices.
- Invoke `build-resource-form` before adding the QI and PTS action schemas.
- Read the web architecture, framework README, current PTS detail route, and
  `apps/web/package.json` before editing.

## Scope

**In scope**:

- Quality Inspection detail route and route-local action/photo/evidence components
- Quality Inspection resource/action schema additions for plan 062 workflow APIs
- the smallest QHSSE PTS schema/resource/detail-route change to expose
  `complete-qi-report`
- focused QI and PTS web tests

**Out of scope**:

- API/data changes beyond plan 062 corrections, manual PTS create changes,
  generic workflow/print/photo components, framework source, Todo/notifications,
  schedule CRUD, IBPRP, and any export for non-closed reports.

## Steps

### Step 1: Add the Quality Inspection detail and workflow action forms

Use `DetailView` for the report standard detail. Route-local `Card`, `Detail`,
`Table`, `Timeline`, `DialogForm`, `ConfirmationDialog`, `Button`, `Chip`, and
`ImagePreview` show the report, schedule origin, selected items/volume, ITP
snapshots, current results, PTS number/status/rejection history, four photo
slots, and immutable event history. Use these legacy section labels: `Detail
Laporan`, `Prosedur & Penyelesaian`, `Daftar Item Pekerjaan`, and `Foto Sudut
Pengambilan`.

Show the exact legacy action labels: `Lengkapi Prosedur & Penyelesaian`,
`Terima`, `Tolak`, `Submit Inspection Data`, `Verifikasi Laporan`, and
`Download Bukti Kerja`. The complete form uses `Inspection Point` and
`Prosedur / Metode Kerja`; item verification uses optional `Catatan`; final
result choices show `Diterima`, `Ditolak`, `Diperbaiki`, `Ditunda`. Render only
the server-reported allowed action at the expected step. Do not reproduce state
checks in client logic.

**Verify**: focused route/action tests prove correct action visibility, action
payloads, optimistic controls disabled during mutation, and reload after every
successful action.

### Step 2: Implement the fixed documentation form

Create a route-local fixed four-slot photo form. It uses the registered image
field/upload path once per exact legacy name (`sudut 1` through `sudut 4`), with
an optional `Catatan` per slot. It sends all four values through the one submit
action and presents server errors. Do not add a dynamic attachment list or a
generic photo-grid component.

**Verify**: component tests prove all exact slots render, unavailable submit
when a local upload is absent, optional descriptions serialize, and successful
submit refreshes the detail.

### Step 3: Expose QI-created PTS completion

Extend the existing PTS detail route/action schema only for the server action
`complete-qi-report`. Use the current route-local `DialogForm`, normal root
cause input, and existing field renderers to collect the required report
completion data. Show it only when the PTS action list contains it; do not show
or allow source editing. The action label is the legacy `Lengkapi Laporan`.

**Verify**: PTS focused tests prove the action is hidden for manual PTS, posts
the intended fields for a QI PTS, and reloads the normal PTS workflow after
success.

### Step 4: Keep the closed-report evidence export

Create one route-local `QualityInspectionEvidenceExport.vue` fed only by the
detail response. Use existing `vue-to-print` and `qrcode.vue`; include report
detail/procedure, selected item and ITP criteria, the reporter QR identity,
and four photos. `Download Bukti Kerja` exists only for `close` reports and
`show-quality-inspection`; otherwise it is absent. This is print/export from
the existing data, not a new backend report endpoint.

**Verify**: focused render tests prove closed-only gating and the required
evidence sections. In an authenticated browser session, open a closed record,
confirm the action and print preview contain the number, items, QR, and four
photo labels.

## Test plan

Model new tests after the current PTS detail/action tests. Cover one transition
form per step, exact action/label gating, PTS QI-only action visibility, photo
payload completeness, detail history presentation, and closed-only export.
Avoid framework component snapshots and browser coordinate tests.

## Done criteria

- [ ] Detail has every approved legacy section and only server-authorized actions.
- [ ] Four exact photo slots, report/item/PTS histories, and independent PTS status are visible.
- [ ] QI PTS completion is available only for QI-source PTS and preserves the ordinary PTS flow.
- [ ] Evidence export is closed-only, shows the legacy evidence material, and uses installed dependencies.
- [ ] No generic component, framework edit, schedule/Todo/notification behavior, or non-closed export exists.
- [ ] Focused tests, type checks, lint, API tests, browser check, and diff check pass.

## STOP conditions

- The API does not return server-authorized actions or the evidence data listed above.
- A required action needs a framework component change or a new client dependency.
- Browser review needs a production action, a changed backend export endpoint, or missing photo data.

## Maintenance notes

The print component is deliberately route-local because Quality Inspection is
its only consumer. A later reusable evidence format needs an explicit framework
decision before it is extracted.
