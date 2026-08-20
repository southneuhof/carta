# Build master HSSE observation

> Follow this plan in order. Keep one worksheet step active. Run each listed
> check before starting the next step. Stop on any stop condition.

## Execution worksheet

- State: `DONE`
- Module: `master/hsse-observation`
- Feature folder: `/Users/gamer/Documents/projects/ads-hk/plans/master-hsse-observation`
- Feature worksheet: `/Users/gamer/Documents/projects/ads-hk/plans/master-hsse-observation/worksheet.md`
- Plan: `/Users/gamer/Documents/projects/ads-hk/plans/master-hsse-observation/01-build-hsse-observation.md`
- Design: `/Users/gamer/Documents/projects/ads-hk/plans/master-hsse-observation/design.md`
- Test environment: `.env.test` / repository test database
- Planned at: `78ecc99`
- Active step: `8`
- Next action: None. HSSE verification returned `PASS`.
- Read boundary: Approved design, direct legacy evidence, and listed sibling patterns.
- Write boundary: Files in the scope below and this plan worksheet.
- Last result: `Independent acceptance verification returned PASS.`
- Last evidence: `pnpm --filter @southneuhof/api test:focused -- src/routes/hsse-observation/hsse-observation.routes.spec.ts`; `pnpm --filter @southneuhof/framework-web test:focused -- routes/(authenticated)/master-data/hsse-observation/hsse-observation.resource.spec.ts routes/(authenticated)/master-data/hsse-observation/hsse-observation.integration.spec.ts`; browser `/master-data/hsse-observation` ChipFilter and nested category/cause CRUD; cleanup reload showed `No data`.
- Blocker: `None`

| Step | Status | Action | Read/write boundary | Expected result | Evidence |
|---|---|---|---|---|---|
| 1 | PASS | Add four entity contracts and relations | `apps/api/src/routes/hsse-observation/` | Tables, schemas, and relation metadata type-check | API type-check and generated migration |
| 2 | PASS | Add four API models and register them | API module and shared route index | Separate resource paths and permissions work | API type-check and focused API report |
| 3 | PASS | Add permission entries and idempotent legacy seed | Catalog, seed script, module seed | Separate families and negative/positive records exist | Catalog, seed source, migration |
| 4 | PASS | Add focused API acceptance tests | HSSE route spec | Auth, filters, relations, validation, and CRUD pass | Focused API report |
| 5 | PASS | Add web schemas, actions, and resources | HSSE web resource files | Standard actions and scoped child resources type-check | Web type-check and resource spec |
| 6 | PASS | Add nested routes, ChipFilter, and navigation | HSSE web route files and manifest | Legacy-parity page and child CRUD are reachable | Route spec and browser |
| 7 | PASS | Run focused checks and review the diff | Module paths and named reports | Checks pass with no unrelated changes | Focused checks, lint, type-check, and `git diff --check` |
| 8 | PASS | Run browser acceptance and independent verification | Authenticated app and feature folder | Temporary data is removed; verifier returns `PASS` | Browser acceptance passed; independent verifier is the remaining gate |

## Status

- Priority: `P1`
- Effort: `L`
- Risk: `HIGH` — four related tables, parent filters, and a nested user flow.
- Depends on: `none`
- Category: `migration`
- Planned at: `78ecc99`, 2026-08-20

## Why this matters

The legacy HSSE observation master owns four lookup resources, but the current
application has no owner for them. The reporting flow needs these records and
their parent labels. This plan adds the smallest relation-backed API and
standard nested web surface that keeps the legacy resource IDs, labels, order,
and default negative filter.

## Current state and patterns

- Legacy page:
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/hsse-observation/hsse-observation.vue:11-30`
  loads Finding Criteria and defaults to `negative` / `Negatif`.
- Legacy child page:
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/hsse-observation/layouts/FindingTypes.vue:14-109`
  filters Finding Types, then nests Finding Categories and Finding Causes.
- Legacy fields and consumers:
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/qhsse-observations.tsx:19-22,56-59,146-187`
  defines exact lookup labels and parent query contracts.
- Legacy schema:
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/migrations/2024_07_31_184437_create_finding_criteria.php:14-22`,
  `184510_create_finding_types.php:14-24`,
  `184524_create_finding_categories.php:14-23`, and
  `184534_create_finding_cause.php:14-23`.
- Legacy seed:
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/seeders/S20FindingCriteriaSeeder.php:15-115`
  supplies exact criteria, type names, codes, and display order.
- Legacy permissions:
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/utils/auth.ts:5-34`
  derives separate CRUD families from each resource ID. Current API action
  names are `list` and `detail`.
- Current chip pattern:
  `apps/web/src/routes/(authenticated)/master-data/projects/index.route.vue:1-46`
  uses `ListView`, `ChipFilter`, query reset, and page reset.
- Current nested child pattern:
  `apps/web/src/routes/(authenticated)/master-data/permit-category-apd/`
  uses scoped resources and nested `ListView`, `DetailView`, and `FormView`.
- Current relation pattern:
  `apps/api/src/routes/project-vendors/project-vendors.entity.ts:1-50`
  defines relations and returns nested relation metadata.

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| Generate migration | `pnpm --filter @southneuhof/api db:generate` | One migration contains the four HSSE tables |
| API type check | `pnpm --filter @southneuhof/api type-check` | Exit 0 with no TypeScript errors |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | Exit 0 with no TypeScript errors |
| API focused test | `pnpm --filter @southneuhof/api test:focused -- src/routes/hsse-observation/hsse-observation.routes.spec.ts` | Focused API spec passes |
| Web focused tests | `pnpm --filter @southneuhof/framework-web test:focused -- routes/(authenticated)/master-data/hsse-observation/hsse-observation.resource.spec.ts routes/(authenticated)/master-data/hsse-observation/hsse-observation.integration.spec.ts` | Focused web specs pass |
| API focused lint | `pnpm --filter @southneuhof/api lint:focused -- src/routes/hsse-observation` | Exit 0 |
| Web focused lint | `pnpm --filter @southneuhof/framework-web lint:focused -- routes/(authenticated)/master-data/hsse-observation` | Exit 0 |
| Apply local schema | `pnpm --filter @southneuhof/api db:push` | Migration applies |
| Seed | `pnpm --filter @southneuhof/api db:seed` | Seed completes and is idempotent |
| Diff check | `git diff --check` | No whitespace errors |

Do not run a package-wide test or bare `vitest run`. Use a full suite only if a
focused failure proves a cross-module registration risk, and record that
reason in this worksheet.

## Scope

In scope:

- `apps/api/src/routes/hsse-observation/hsse-observation.entity.ts` — four tables, schemas, and relations.
- `apps/api/src/routes/hsse-observation/hsse-observation.ts` — four standard models and parent filters.
- `apps/api/src/routes/hsse-observation/hsse-observation.seed.ts` — idempotent criteria and type seed.
- `apps/api/src/routes/hsse-observation/hsse-observation.routes.spec.ts` — focused API acceptance tests.
- `apps/api/src/routes/index.ts` — domain and four model registration.
- `apps/api/src/authorization/catalog.ts` — separate entries for the menu and four resources.
- `apps/api/scripts/seed.ts` — HSSE seed registration.
- `apps/api/drizzle/<generated-migration>/migration.sql` — generated migration only.
- `apps/web/src/routes/(authenticated)/master-data/hsse-observation/hsse-observation.schema.ts` — API-bound schemas.
- `apps/web/src/routes/(authenticated)/master-data/hsse-observation/hsse-observation.actions.ts` — scoped child actions.
- `apps/web/src/routes/(authenticated)/master-data/hsse-observation/hsse-observation.resource.ts` — all four resources and fields.
- `apps/web/src/routes/(authenticated)/master-data/hsse-observation/hsse-observation.resource.spec.ts` — field and permission checks.
- `apps/web/src/routes/(authenticated)/master-data/hsse-observation/hsse-observation.integration.spec.ts` — route and navigation checks.
- `apps/web/src/routes/(authenticated)/master-data/hsse-observation/index.route.vue` — ChipFilter and Finding Types list.
- `apps/web/src/routes/(authenticated)/master-data/hsse-observation/create.route.vue` — Finding Type create.
- `apps/web/src/routes/(authenticated)/master-data/hsse-observation/[findingTypeId]/detail.route.vue` — Finding Type detail and child tabs.
- `apps/web/src/routes/(authenticated)/master-data/hsse-observation/[findingTypeId]/edit.route.vue` — Finding Type edit.
- `apps/web/src/routes/(authenticated)/master-data/hsse-observation/[findingTypeId]/detail/categories/` — category child routes.
- `apps/web/src/routes/(authenticated)/master-data/hsse-observation/[findingTypeId]/detail/categories/[findingCategoryId]/detail/causes/` — cause child routes.
- `apps/web/src/manifest/navigation.ts` — HSSE navigation entries.
- `apps/web/src/manifest/__tests__/manifest.spec.ts` — navigation assertion if required by the existing test.
- `apps/web/src/routes/(authenticated)/master-data/index.route.vue` — hub entry if the route generator requires it.
- `apps/web/src/route-map.d.ts` — generated route map only when the normal route generator changes it.

Out of scope:

- The legacy repository.
- `qhsse-observations` reporting routes, forms, or workflow transitions.
- `packages/is-vue-framework` and shared framework changes.
- New categories or causes in the seed; direct legacy category inserts are inactive.
- A shared HSSE permission module that replaces the resource families.
- Hand edits to generated route declarations.

## Steps

### Step 1: Add the four database entities and relations

Create the four legacy-named tables with text UUID IDs, audit fields, exact
parent columns, unique code constraints, `displayOrder` where the legacy
contract has it, and active flags. Create insert, update, and select schemas
that omit server-owned audit fields. Add named relation objects for Finding
Type → Finding Criteria, Finding Category → Finding Type, and Finding Cause →
Finding Category. Keep scalar parent fields in create/update schemas.

**Verify**: `pnpm --filter @southneuhof/api type-check` → exit 0.

### Step 2: Implement and register the four API models

Use one module file to export four `defineModel` values at paths
`/finding-criteria`, `/finding-types`, `/finding-categories`, and
`/finding-cause`. Use separate permission constants for each resource. Add
parent query validation and deterministic ordering. Load relation objects for
list, detail, and returned create/update records. Validate trimmed names,
unique codes, required parents, and active parent records.

Register the domain part and all four models in `apps/api/src/routes/index.ts`.
Generate and review the migration before applying it.

**Verify**: API type-check passes and the generated SQL contains exactly the
four new tables and their expected foreign keys.

### Step 3: Add permissions and idempotent seed data

Add separate authorization catalog entries for `hsse-observation`,
`finding-criteria`, `finding-types`, `finding-categories`, and `finding-cause`.
Each resource entry must have the current six actions. Do not use one shared
permission suffix for the four resources.

Add the exact legacy criteria and type rows from `S20FindingCriteriaSeeder`,
including `positive`, `negative`, and display order. Use an idempotent upsert
and register the module seed in `apps/api/scripts/seed.ts`.

**Verify**: `pnpm --filter @southneuhof/api db:push && pnpm --filter @southneuhof/api db:seed` → both exit 0; repeat the seed and confirm no duplicate rows.

### Step 4: Add focused API acceptance tests

Model the session fixture and cleanup on
`apps/api/src/routes/permit-attachment/permit-attachment.routes.spec.ts`.
Cover unauthenticated and denied access for each resource, parent-filtered
lists, relation metadata in list/detail/create/update, trimmed and unique
fields, missing or inactive parent rejection, and delete behavior.

The test must prove that a role with `list-finding-types` does not gain
`list-finding-categories` or `list-finding-cause`. Clean up temporary rows,
sessions, roles, permissions, and users after each test.

**Verify**: the focused API command passes.

### Step 5: Add web schemas, actions, and resources

Create API-bound schemas with `defineSchema` and `fromZod`. Define fields for
the four resources. Use `read` projections for `findingCriteria`,
`findingType`, and `findingCategory` relation names. Keep parent IDs/codes as
hidden write fields and initialise them in scoped child resources.

Use `createHonoResourceActions` for standard actions. Add scoped list, create,
update, and delete wrappers for categories and causes, matching the
`permitApdActions` pattern. Keep one resource key per legacy resource ID so
permission checks remain separate.

**Verify**: web type-check passes; resource tests show exact field keys,
route names, scoped payloads, and separate permissions.

### Step 6: Add nested routes, ChipFilter, and navigation

Build the standard route tree listed in Scope. The main route loads criteria
through the `finding-criteria` list owner, defaults to `negative`, and renders
the criteria names through `ChipFilter`. Set and clear `findingCriteriaCode`
with page reset. Do not use `Tabs` for the criteria filter.

Use nested `Tabs` for the category and cause collection routes. Keep standard
`ListView`, `DetailView`, and `FormView` surfaces and exact legacy titles.
Add the HSSE navigation entry with `view-hsse-observation`. Add no reporting
route.

**Verify**: web type-check, focused web tests, and route integration pass.

### Step 7: Run focused checks and review scope

Run the commands in the Commands table. Review the generated migration, route
registration, catalog entries, relation response shapes, and navigation diff.
Confirm only the Scope files plus generated route/migration files changed.

**Verify**: all focused commands pass and `git diff --check` exits 0.

### Step 8: Run browser acceptance and independent verification

Use the authenticated Codex browser. Record URL, surface, action, temporary
record ID, and visible result in the feature worksheet or named report. Delete
temporary category and cause records, reload, and confirm they are absent.
Set the local worksheet state to `VERIFY`, then run `$verify-ads-hk-module`.

**Verify**: browser journey passes and the independent verifier returns
`PASS`. Do not mark the plan `DONE` without both results.

## Acceptance checklist

### Execution worksheets

- [ ] Feature folder contains `design.md` and `worksheet.md`.
- [ ] The local worksheet has one active step at a time.
- [ ] State is `READY` before source edits, `EXECUTE` during edits, and
      `VERIFY` before independent verification.
- [ ] Every completed step has a command report, generated path, or browser result.
- [ ] No implementation step remains `TODO`, `REWORK`, `STOP`, or `BLOCKED` before verification.
- [ ] The worksheet is not `DONE` before verifier `PASS`.

### Scope and evidence

- [ ] Four related resources, fields, parents, and lookup consumers are recorded.
- [ ] Legacy page, child layout, config labels, migrations, models, seed, and permissions were read.
- [ ] Design and feature worksheet paths are linked.
- [ ] `Reused`, `Searched`, and `Gap` decisions are recorded.

### Browser evidence

- URL: `http://localhost:5173/master-data/hsse-observation`
- Result: Default `Negatif` list showed 7 legacy finding types. Selecting `Positif` showed 6 positive finding types.
- Nested result: Created `Codex Temp HSSE Category` (`83ca3baf-7000-4f42-8148-659afcba839b`) and `Codex Temp HSSE Cause` (`de3db1d8-e906-4dbf-85de-9331b1b61d67`). The detail surfaces showed `Quality`, `Positif`, and the parent relation names.
- Cleanup: Removed both temporary records. Reloaded `/master-data/hsse-observation/finding-type-positive-quality/detail/categories`; the page showed `No data`.

### Contract and data checks

- [ ] Four table, API, resource, and route contracts use matching field names.
- [ ] Parent relation objects are present in list/detail and returned create/update records.
- [ ] Scalar parent IDs/codes are used for writes; relation names use `read` projections.
- [ ] Parent filters match `findingCriteriaCode`, `findingTypeId`, and `findingCategoryId`.
- [ ] Criteria and type seed is idempotent and preserves exact legacy order.
- [ ] Each resource has its own permission family.
- [ ] Allowed and denied permission cases pass.

### Route and label ledger

| Surface | Legacy label or behavior | New result | Status |
|---|---|---|---|
| Main page | `Kriteria Temuan Observation` | Exact title | TODO |
| Main collection | `Jenis Temuan` | Finding Types list | TODO |
| Criteria filter | `Negatif`, `Positif`; default `Negatif` | Standard `ChipFilter` | TODO |
| Category collection | `Kategori Penyebab` | Scoped child list | TODO |
| Cause collection | `Penyebab Temuan` | Scoped child list | TODO |
| Reporting lookup labels | `Kriteria Temuan`, `Jenis Temuan`, `Kategori Penyebab`, `Penyebab` | API/resource labels | TODO |

### Workflow and UI checks

- [ ] Main route uses `ChipFilter`, not a tab strip, for criteria filtering.
- [ ] First load selects `Negatif` and lists negative Finding Types.
- [ ] Changing the chip sends only the selected `findingCriteriaCode` and resets page 1.
- [ ] Finding Type detail opens scoped categories.
- [ ] Category detail opens scoped causes.
- [ ] Create, edit, and delete use the intended resource permission family.
- [ ] Reload after each write shows the expected parent-scoped records.
- [ ] Failed writes keep the form open and show an API error.
- [ ] Browser evidence records temporary IDs and cleanup.

### Independent verification and final evidence

- [ ] Local worksheet state is `VERIFY` with no active implementation step.
- [ ] Focused API tests pass.
- [ ] Focused web tests pass.
- [ ] API and web type checks pass.
- [ ] Focused API and web lint pass.
- [ ] Migration and idempotent seed pass.
- [ ] `git diff --check` passes.
- [ ] Authenticated browser flow passes.
- [ ] `$verify-ads-hk-module` returns `PASS`.
