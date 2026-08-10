# Plan 007: Normalize standard field labels and legacy module titles

> **Implementation instructions**: Follow this plan step by step. This plan
> changes the web field catalog, titles, and seed fixture defaults. Do not
> remove UOM or PTS `code` columns from the API or database. Stop if the
> requested change cannot work without a storage migration or a change to a
> downstream API contract.
>
> **Drift check (run first)**: `git diff --stat 909060f..HEAD -- apps/web/src/configs apps/web/src/manifest/navigation.ts "apps/web/src/routes/(authenticated)/master-data" plans/master-data-visual-parity`
> The repository has dirty and untracked work from the current master-data
> migration. Preserve it. If the current excerpts below do not match the live
> files, stop and report.

## Status: DONE

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: Plans 001–006 in this folder
- **Category**: tech-debt
- **Planned at**: commit `909060f`, 2026-08-10

## Why this matters

Several master-data resources replace truthful standard labels with module
labels such as `code → Division`, `code → UOM`, `name → Vendor / Subkon /
Mandor`, and `number → Project Number`. This makes the same field mean
different things in different screens and defeats the shared field-default
catalog. UOM and PTS Work Categories also expose `code` even though the legacy
frontend does not use it. This plan centralizes standard labels, removes those
two fields from web surfaces, and uses legacy module titles where they exist.

## Current state

- `apps/web/src/main.ts:57-64` registers `appFieldDefaults` with the framework.
  Framework field resolution applies default fields below resource metadata;
  `apps/web/src/configs/defaults.spec.ts:14-27` verifies that a resource
  override wins over a default.
- `apps/web/src/configs/defaults.ts:22-48` defines the app defaults. The
  current standard labels are `name → Nama`, `code → Kode`,
  `description → Keterangan`, and `active → Status`.
- The current resources override standard labels and renderers in multiple
  places. Examples:
  - `apps/web/src/routes/(authenticated)/master-data/divisions/divisions.resource.ts:14-23`
    labels `code` as `Division`.
  - `apps/web/src/routes/(authenticated)/master-data/projects/projects.resource.ts:14-28`
    labels `name` as `Project` and `number` as `Project Number`.
  - `apps/web/src/routes/(authenticated)/master-data/project-vendors/project-vendors.resource.ts:8-14`
    labels the standard `name` field as `Vendor / Subkon / Mandor`.
  - `apps/web/src/routes/(authenticated)/master-data/uoms/uoms.resource.ts:7-14`
    and `apps/web/src/routes/(authenticated)/master-data/pts-work-categories/pts-work-categories.resource.ts:7-14`
    include `code` on every surface.
- The current API still requires and stores UOM and PTS `code`:
  `apps/api/src/routes/uoms/uoms.entity.ts:13-30` and
  `apps/api/src/routes/pts-work-categories/pts-work-categories.entity.ts:13-29`.
  Current seed data writes both fields at `apps/api/scripts/seed.ts:180-247`,
  and current PTS lookup responses include category codes at
  `apps/api/src/routes/qhsse-pts/qhsse-pts.service.ts:344-352`. Keep this
  storage and API contract out of this plan.
- Seed changes are allowed for the default fixture rows. They do not make
  `code` optional for later API creates: both tables still have a required,
  unique `code`, and one shared default would collide after the first row.
- Legacy visual sources:
  - `frontend-ads-vuejs/src/menu.ts:39-58` uses `Divisi`, `Proyek`, and
    `Jenis Pekerjaan`.
  - `frontend-ads-vuejs/src/menu.ts:94-116` uses `Kategori Bisnis`,
    `Kategori Pekerjaan`, `Penyebab QHSSE`, and `Satuan`.
  - `frontend-ads-vuejs/src/app/configs/project-vendor.ts:1-8` uses the title
    `Vendor/Subkon/Mandor`.
  - `frontend-ads-vuejs/src/app/configs/uoms.ts:1-14` exposes only `name` and
    `active`; `frontend-ads-vuejs/src/app/configs/pts-work-categories.ts:1-5`
    exposes only `name` and `active`.

### Interpretation to use

Treat `Name` and `Code` as the required English labels. Change the shared app
defaults once, then remove duplicate standard labels from module resources.
Do not change the framework package. If the product decision is instead to
keep the defaults `Nama` and `Kode`, stop before Step 1 because that changes
the global UI result.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Web tests | `pnpm --filter @southneuhof/framework-web test` | Exit 0; all web tests pass |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | Exit 0; no TypeScript errors |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | Exit 0; no lint errors |
| Diff check | `git diff --check` | Exit 0 |

## Scope

**In scope**

- `apps/web/src/configs/defaults.ts`
- `apps/web/src/configs/defaults.spec.ts`
- `apps/web/src/manifest/navigation.ts`
- `apps/web/src/routes/(authenticated)/master-data/index.route.vue`
- Master-data resource files and their focused resource specs under
  `apps/web/src/routes/(authenticated)/master-data/`.
- Master-data route title files and the Work Item tree labels under the same
  folder.
- `apps/api/scripts/seed.ts`, only for default fixture values needed by the
  final field/title decision.
- This plan file and the parity-plan index.

**Out of scope**

- `packages/is-vue-framework` and all framework source.
- API entities, API validation, migrations, and downstream PTS response
  shapes. Seed data is limited to the explicit fixture-default change above.
- Settings, Quality PTS report fields, permissions, navigation behavior, and
  unrelated resource catalogs.
- Indonesian translation of every application string. Only the listed legacy
  module titles are in scope.

## Steps

### Step 1: Make shared standard labels authoritative

Update `apps/web/src/configs/defaults.ts` so the shared `name` and `code`
labels are `Name` and `Code`. Update the matching expectations in
`apps/web/src/configs/defaults.spec.ts`. Keep shared renderers and props in the
defaults. Do not add a new helper or a second alias map.

**Verify**: `pnpm --filter @southneuhof/framework-web test -- src/configs/defaults.spec.ts`
→ the defaults tests pass and expect `Name` and `Code`.

### Step 2: Remove duplicate standard labels from resources

In each master-data resource, delete local `label` and standard renderer
entries for `name`, `code`, `description`, `active`, and `number` where the
shared defaults already define them. Keep only real module behavior, such as
sortable configuration, relation labels, lookup sources, image/location
renderers, and non-standard fields.

Apply these rules:

- Division `code` uses the shared `Code` label, not `Division`.
- Project `name` uses the shared `Name` label, and `number` uses the shared
  default. Keep `shortName`, `integrationCode`, location, and relation labels
  because they are not generic defaults.
- Project Vendor `name` uses the shared `Name` label. The vendor wording moves
  to the module/page title.
- Work Item `name` and the tree `name` column use the shared `Name` label.
  Keep labels for derived fields such as category, UOM, and ITP indicators.
- Number Variable `code` uses `Code`; the Number Configuration relation label
  remains `Number Variable` because it describes the related resource, not the
  raw key.

Update focused resource tests only where they assert the old labels or old
field definitions. Do not add a broad snapshot test.

**Verify**: `pnpm --filter @southneuhof/framework-web test -- src/routes/\(authenticated\)/master-data`
→ all focused master-data resource tests pass.

### Step 3: Remove UOM and PTS code from web surfaces

Change only these web resources and their focused tests:

- UOM table, detail, and form become `name`, `active`.
- PTS Work Category table, detail, and form become `name`, `active`.

Do not remove `code` from the API schema or database. Keep the seed row valid;
change its fixture value only if the agreed default requires it. If the form
schema still requires a value after the web field removal, stop and report;
do not invent a client value or silently change API ownership. A seed value
does not solve that create-time requirement.

**Verify**: `rg -n "code|\['code'|\"code\"" "apps/web/src/routes/(authenticated)/master-data/uoms" "apps/web/src/routes/(authenticated)/master-data/pts-work-categories"`
→ no user-facing resource field list or form definition contains `code`.

### Step 4: Use legacy module titles

Update page titles, the master-data landing entries, and navigation entries
where the legacy app gives a title:

| Current module | Legacy title |
|---|---|
| Business Categories | `Kategori Bisnis` |
| Divisions | `Divisi` |
| Projects | `Proyek` |
| UOMs | `Satuan` |
| Work Items | `Jenis Pekerjaan` |
| Project Vendors | `Vendor/Subkon/Mandor` |
| PTS Work Categories | `Kategori Pekerjaan` |
| Root Causes | `Penyebab QHSSE` |

Keep Number Variables and Number Configurations in English because the legacy
frontend has no title or route for them. Keep route names and resource keys
unchanged; titles are presentation only.

**Verify**: `rg -n "UOMs|PTS Work Categories|Project Vendors|Business Categories|Root Causes|Work Items|Divisions|Projects" apps/web/src/manifest/navigation.ts "apps/web/src/routes/(authenticated)/master-data"`
→ no old user-facing module title remains in the in-scope files; the legacy
  titles above are present.

### Step 5: Run the web verification gate

Run the complete web test, type-check, lint, and diff checks. Review the diff
for unrelated edits before reporting completion.

**Verify**: run all commands in **Commands you will need** → all exit 0 and
`git status --short` shows only the in-scope files changed by this plan plus
the pre-existing dirty work.

## Test plan

- Update `apps/web/src/configs/defaults.spec.ts` for the shared `Name` and
  `Code` labels.
- Update the existing master-data resource specs for UOM and PTS field lists.
- Add only small label-resolution assertions to an existing resource spec if
  a local alias could return. Do not create one test per label.
- Use `resolveFields(..., defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields)`
  as the existing test pattern.

## Done criteria

- [x] Shared defaults resolve `name` to `Name` and `code` to `Code`.
- [x] No master-data resource locally aliases a standard `name` or `code`
      field with a module name.
- [x] UOM and PTS Work Category web surfaces contain only `name` and `active`.
- [x] UOM and PTS API/database `code` remains unchanged by this plan; seed
      changes, if any, are limited to valid default fixture rows.
- [x] Legacy module titles are used wherever the legacy app defines one.
- [x] Web tests, type-check, lint, and `git diff --check` pass.
- [x] No framework package or unrelated source file changed.

## STOP conditions

Stop and report if:

- The exact `Name`/`Code` interpretation is not approved because changing
  `apps/web/src/configs/defaults.ts` affects every app resource.
- Removing UOM or PTS `code` from a form requires a new server-generated value,
  API schema change, migration, or downstream response change.
- The requested seed default needs a shared value for a unique field. Do not
  choose one without a product decision; use a generated value or a storage
  change only in a separate plan.
- A framework component does not apply app defaults when the local label is
  removed. Do not edit `packages/is-vue-framework`.
- A requested legacy title is not present in the cited legacy menu/config.
- A verification command fails twice after a reasonable fix attempt.

## Maintenance notes

- New standard fields must use `apps/web/src/configs/defaults.ts`; review
  resource catalogs for duplicate `label` or renderer entries before adding
  them.
- If UOM or PTS code becomes a real user-owned field, add a separate product
  decision and resource/API plan. Do not restore it as a local alias.
- Reviewers should check both the resource field definitions and the route
  titles. A correct field catalog with an old page title is incomplete.
