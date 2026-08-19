# Plan 081: Align Quality Inspection language and UI surfaces

> **Implementation instructions**: Read this plan fully. Invoke the
> **Web UI Surface Reuse** skill before editing `apps/web`; record `Reused`,
> `Searched`, and `Gap`. Reuse the framework surfaces already present in the
> module and in `/quality/pts`. Do not add generic local components or edit
> framework source. Product labels must match the legacy labels; plan prose
> remains Simplified Technical English.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/079-match-quality-inspection-evidence-export.md, plans/080-restore-quality-inspection-kpi-effects.md
- **Category**: tech-debt
- **Planned at**: commit `08b3028`, 2026-08-19

## Why this matters

The current QI screens mix Indonesian legacy labels with English helper text,
raw status codes, and route-specific controls. This makes the module look
different from the legacy system and from the current PTS framework standards.
The final pass should remove unwanted copy drift and confirm that every screen
uses the approved framework surface for its job.

## Current state

- English copy exists in the current selector at
  `apps/web/src/routes/(authenticated)/quality/quality-inspection/QualityInspectionWorkItemSelector.vue:82-112`.
- English copy exists in the documentation form at
  `apps/web/src/routes/(authenticated)/quality/quality-inspection/QualityInspectionDocumentationForm.vue:34-46`.
- English schedule helper text exists at
  `apps/web/src/routes/(authenticated)/quality/quality-inspection/schedules/[scheduleId]/create.route.vue:36`.
- The current detail route contains raw PTS status and snapshot messages at
  `apps/web/src/routes/(authenticated)/quality/quality-inspection/[qualityInspectionId]/detail.route.vue:88-91`.
- The legacy vocabulary is defined at
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/quality-inspection.ts:120-142`.
- The PTS route demonstrates the current framework standard for list filters,
  card grids, dialogs, chips, images, and action buttons:
  `apps/web/src/routes/(authenticated)/quality/pts/index.route.vue` and
  `apps/web/src/routes/(authenticated)/quality/pts/[ptsId]/detail.route.vue`.

## Commands you will need

| Purpose | Command | Expected result |
|---|---|---|
| Web focused tests | `pnpm --filter @southneuhof/framework-web test -- quality-inspection pts` | exit 0 |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | exit 0 |
| Language scan | `rg -n "Only active|Select at least|Upload the four|No file selected|No snapshot|No linked PTS|scheduled origins|Target Pelaksanaan is entered" apps/web/src/routes/(authenticated)/quality/quality-inspection` | no unwanted matches |
| Diff check | `git diff --check` | no output |

## Scope

**In scope**:

- QI labels, helper text, empty states, result/status labels, and action copy.
- QI route use of framework buttons, cards, tables, forms, dialogs, filters,
  chips, and image previews.
- Focused web tests and UI review.
- `plans/README.md` status row.

**Out of scope**:

- New design-system components.
- Framework source.
- Product label translation outside Quality Inspection.
- Backend behavior, KPI, Todo, notifications, mobile, and recap export.

## Steps

### Step 1: Build one QI label map

Use the existing QI schema label maps for status, step, result, and ITP type.
Add missing display labels only where the current schema has no field. Use the
legacy terms:

- `Inspection/Test`
- `Divisi`
- `Proyek`
- `Kategori Pekerjaan`
- `Jenis Pekerjaan`
- `Item Pekerjaan`
- `Metode Inspeksi`
- `Volume`
- `Satuan`
- `High Risk`
- `Inspection Point`
- `Prosedur / Metode Kerja`
- `Foto Sudut Pengambilan`
- `Kriteria/Tolok Ukur Penerimaan (Material)`
- `Kriteria/Tolok Ukur Penerimaan (Proses)`
- `Kriteria/Tolok Ukur Penerimaan (Product)`

Do not change API codes or internal TypeScript names.

**Verify**: the language scan has no unwanted current English helper text and
the web typecheck passes.

### Step 2: Remove route-local framework reinvention

Review all QI routes against the surface table:

- Standard list: `ListView`.
- Standard create/edit: `FormView`.
- Standard detail: `DetailView` and `Detail`.
- Collection: `Table` or `TreeTable`.
- Dialog action: `DialogForm`.
- Filter chips: `ChipFilter`.
- Images: `ImagePreview`.
- Buttons, cards, chips, loading, and alerts: framework base components.

Keep custom route code only for QI domain workflows, the fixed selector, the
fixed photo slots, and the card content that the framework cannot infer.

**Verify**: implementation report lists `Reused`, `Searched`, and `Gap` with
exact framework paths. No framework source changed.

### Step 3: Check accessibility and responsive behavior

Confirm action buttons have semantic labels, icon-only buttons have `aria-label`,
radio groups have visible labels, tables remain readable at narrow width, and
image previews have useful slot labels. Fix only QI route code.

**Verify**: focused web tests pass and T3 preview checks desktop and narrow
viewports.

### Step 4: Run the final UI review

Use T3 preview to review list, create, scheduled create, detail, workflow
dialogs, PTS link, documentation, and closed evidence. Compare labels and
action placement with `/quality/pts` patterns and the legacy QI surface.

**Verify**: browser review passes or every limitation is reported.

## Test plan

- Extend only focused QI route tests for visible labels, standard controls, and
  accessibility names.
- Use existing PTS route tests as structural examples.
- Do not add low-value full-page snapshots.

## Done criteria

- [ ] Unwanted English helper and empty-state copy is removed.
- [ ] Legacy product labels are consistent across QI surfaces.
- [ ] Standard framework controls are used wherever they fit.
- [ ] Any real framework gap is recorded and no framework code is edited.
- [ ] Focused tests, typecheck, lint, language scan, and diff check pass.
- [ ] Browser review is complete or explicitly reported.
- [ ] `plans/README.md` marks Plan 081 DONE after review.

## STOP conditions

Stop and report if:

- a requested label conflicts with the approved API code or design;
- a surface requires a framework capability that does not exist;
- changing a shared framework component would be the smallest apparent fix; or
- the browser review reveals a separate functional defect outside these plans.

## Maintenance notes

New QI copy should use the central label map. Reviewers should reject new
route-local native controls when an existing framework renderer or component
can express the requirement.
