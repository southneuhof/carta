# Build master incident statement document configs

> Follow this plan in order. Keep one worksheet step active. Run each listed
> check before starting the next step. Stop on any stop condition.

## Execution worksheet

- State: `VERIFY`
- Module: `master/incident-statement-document-configs`
- Feature folder: `/Users/gamer/Documents/projects/ads-hk/plans/master-incident-statement-document-configs`
- Feature worksheet: `/Users/gamer/Documents/projects/ads-hk/plans/master-incident-statement-document-configs/worksheet.md`
- Plan: `/Users/gamer/Documents/projects/ads-hk/plans/master-incident-statement-document-configs/01-build-incident-statement-document-configs.md`
- Design: `/Users/gamer/Documents/projects/ads-hk/plans/master-incident-statement-document-configs/design.md`
- Test environment: `.env.test` / repository test database
- Planned at: `78ecc99`
- Active step: `7`
- Next action: Run the independent acceptance verifier.
- Read boundary: Approved design, direct legacy evidence, and listed sibling patterns.
- Write boundary: Files in the scope below and this plan worksheet.
- Last result: `Focused checks and authenticated browser list/detail/form acceptance pass. File upload remains UI UNVERIFIED because the local storage path removed the uploaded file after Mengunggah.`
- Last evidence: `API 2/2 focused tests; web resource/integration checks; type-check and lint pass; browser list/detail/form checks; cleanup reload showed No data; two browser upload attempts entered Mengunggah then returned to the empty file control.`
- Blocker: `Authenticated browser file upload does not persist through the local storage service; no source or framework change was made.`

| Step | Status | Action | Read/write boundary | Expected result | Evidence |
|---|---|---|---|---|---|
| 1 | PASS | Add the entity, storage validation, and migration | Incident API module | API contract type-checks and migration is generated | API type-check and migration |
| 2 | PASS | Add standard API routes and separate permissions | API module, catalog, route index | CRUD and resource-specific auth work | API type-check and route spec |
| 3 | PASS | Add focused API tests | Incident route spec | Auth, validation, storage path, and CRUD pass | Focused API report |
| 4 | PASS | Add web schema, upload actions, resource, and fields | Incident web resource files | List/detail/form field contract matches legacy | Web type-check and resource spec |
| 5 | PASS | Add standard routes and navigation | Incident web routes and manifest | Authenticated CRUD route is reachable | Route spec and browser |
| 6 | PASS | Run focused checks and review the diff | Module paths and named reports | Checks pass with no unrelated changes | Focused checks, lint, type-check, and `git diff --check` |
| 7 | BLOCKED | Run browser acceptance and independent verification | Authenticated app and feature folder | Temporary data is removed; verifier returns `PASS` | UI UNVERIFIED: file upload entered `Mengunggah` then reset without a stored file |

## Status

- Priority: `P1`
- Effort: `M`
- Risk: `MED` — file storage path validation and a user-facing CRUD form.
- Depends on: `01-build-hsse-observation.md` for serial writes to shared catalog, seed, navigation, and route-map files.
- Category: `migration`
- Planned at: `78ecc99`, 2026-08-20

## Why this matters

The legacy incident workflow consumes document statement templates, but the
current application has no owner for them. This plan adds the standard CRUD
resource with the legacy field order, required template upload, rich-text
description, and separate permission family. It keeps the current safe display
behavior instead of reintroducing raw HTML execution.

## Current state and patterns

- Legacy config:
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/incident-statement-document-configs.ts:1-17`
  defines title, field order, list fields, rich text, and required file input.
- Legacy page:
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/incident-statement-document-configs/incident-statement-document-configs.vue:1-14`
  uses standard CRUD and a raw HTML detail slot.
- Legacy model and validation:
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/IncidentStatementDocumentConfigs.php:15-162`
  defines fields, file upload ownership, and standard CRUD hooks.
- Legacy migration:
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/migrations/2024_09_25_095621_create_incident_statement_document_configs.php:14-22`
  defines the table shape.
- Lookup consumer:
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/IncidentReportStatementDocuments.php:54-119`
  consumes the config by `statement_document_id`.
- Current upload pattern:
  `apps/web/src/routes/(authenticated)/master-data/divisions/divisions.resource.ts`
  and `divisions.actions.ts` normalize file values and stored paths.
- Current standard resource pattern:
  `apps/web/src/routes/(authenticated)/master-data/permit-attachment/`
  uses API-bound schemas, `defineFields`, `defineResource`, and standard CRUD.
- Current rich-text and display renderers:
  `packages/is-vue-framework/src/renderers/form.ts:82-110` and
  `apps/web/src/framework/fields/renderers.ts:67-70`.
- Legacy permissions:
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/utils/auth.ts:5-34`
  derives a separate family from `incident-statement-document-configs`.

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| Generate migration | `pnpm --filter @southneuhof/api db:generate` | One migration contains the incident config table |
| API type check | `pnpm --filter @southneuhof/api type-check` | Exit 0 with no TypeScript errors |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | Exit 0 with no TypeScript errors |
| API focused test | `pnpm --filter @southneuhof/api test:focused -- src/routes/incident-statement-document-configs/incident-statement-document-configs.routes.spec.ts` | Focused API spec passes |
| Web focused tests | `pnpm --filter @southneuhof/framework-web test:focused -- routes/(authenticated)/master-data/incident-statement-document-configs/incident-statement-document-configs.resource.spec.ts routes/(authenticated)/master-data/incident-statement-document-configs/incident-statement-document-configs.integration.spec.ts` | Focused web specs pass |
| API focused lint | `pnpm --filter @southneuhof/api lint:focused -- src/routes/incident-statement-document-configs` | Exit 0 |
| Web focused lint | `pnpm --filter @southneuhof/framework-web lint:focused -- routes/(authenticated)/master-data/incident-statement-document-configs` | Exit 0 |
| Apply local schema | `pnpm --filter @southneuhof/api db:push` | Migration applies |
| Seed | `pnpm --filter @southneuhof/api db:seed` | Seed completes |
| Diff check | `git diff --check` | No whitespace errors |

Do not run a package-wide test or bare `vitest run`. Use a full suite only if a
focused failure proves a cross-module registration risk, and record that
reason in this worksheet.

## Scope

In scope:

- `apps/api/src/routes/incident-statement-document-configs/incident-statement-document-configs.entity.ts` — table and schemas.
- `apps/api/src/routes/incident-statement-document-configs/incident-statement-document-configs.ts` — standard CRUD routes.
- `apps/api/src/routes/incident-statement-document-configs/incident-statement-document-configs.routes.spec.ts` — focused API acceptance tests.
- `apps/api/src/routes/index.ts` — domain and model registration.
- `apps/api/src/authorization/catalog.ts` — separate permission family.
- `apps/api/drizzle/<generated-migration>/migration.sql` — generated migration only.
- `apps/web/src/routes/(authenticated)/master-data/incident-statement-document-configs/incident-statement-document-configs.schema.ts` — API-bound schema.
- `apps/web/src/routes/(authenticated)/master-data/incident-statement-document-configs/incident-statement-document-configs.actions.ts` — upload normalization.
- `apps/web/src/routes/(authenticated)/master-data/incident-statement-document-configs/incident-statement-document-configs.resource.ts` — fields and standard actions.
- `apps/web/src/routes/(authenticated)/master-data/incident-statement-document-configs/incident-statement-document-configs.resource.spec.ts` — field and permission checks.
- `apps/web/src/routes/(authenticated)/master-data/incident-statement-document-configs/incident-statement-document-configs.integration.spec.ts` — route and navigation checks.
- `apps/web/src/routes/(authenticated)/master-data/incident-statement-document-configs/index.route.vue` — list route.
- `apps/web/src/routes/(authenticated)/master-data/incident-statement-document-configs/create.route.vue` — create form.
- `apps/web/src/routes/(authenticated)/master-data/incident-statement-document-configs/[incidentStatementDocumentConfigId]/detail.route.vue` — detail route.
- `apps/web/src/routes/(authenticated)/master-data/incident-statement-document-configs/[incidentStatementDocumentConfigId]/edit.route.vue` — edit form.
- `apps/web/src/manifest/navigation.ts` — HSSE navigation entry.
- `apps/web/src/manifest/__tests__/manifest.spec.ts` — navigation assertion if required by the existing test.
- `apps/web/src/routes/(authenticated)/master-data/index.route.vue` — hub entry if required by the existing route pattern.
- `apps/web/src/route-map.d.ts` — generated route map only when the normal route generator changes it.

Out of scope:

- The legacy repository.
- Incident report statement document consumer changes.
- Framework changes or raw HTML rendering.
- A second upload service or custom file-processing workflow.
- A shared HSSE permission family.
- Hand edits to generated route declarations.

## Steps

### Step 1: Add the entity, validation, and migration

Create the legacy-named table with text UUID ID, exact camelCase API fields,
audit fields, nullable file path, nullable description, and active default.
Use `createInsertSchema`, `createUpdateSchema`, and `createSelectSchema`.
Omit audit fields and server-owned timestamps from create/update input. Validate
the trimmed name and stored upload path. Keep update file optional so an edit
can retain the existing template.

**Verify**: `pnpm --filter @southneuhof/api type-check` → exit 0; generate and review the migration.

### Step 2: Add standard API routes and separate permissions

Use the current standard route model with list, detail, create, update, and
delete actions. Add separate permission constants for
`incident-statement-document-configs`; do not reuse an HSSE parent permission.
Return the selected record from create and update. Keep list responses usable
by the incident statement document lookup consumer.

Register the domain and model in `apps/api/src/routes/index.ts` and add the
catalog entry with the current six actions.

**Verify**: API type-check passes and the route spec sees the new path and auth checks.

### Step 3: Add focused API tests

Model the fixture on
`apps/api/src/routes/permit-attachment/permit-attachment.routes.spec.ts`.
Cover unauthenticated and denied list/create access, required trimmed name,
invalid file path, valid create, list with name, detail, update while keeping
the file, and delete. Prove a permission for this resource does not grant an
HSSE observation resource permission. Clean up all temporary rows and auth
fixtures after each test.

**Verify**: the focused API command passes.

### Step 4: Add the web schema, upload actions, resource, and fields

Create an API-bound schema with `defineSchema` and `fromZod`. Define fields in
legacy order. The list action contains only `name`; detail contains `name`,
description, file, and active; create/update contain the legacy form fields.
Use the exact file label `Template Formulir`, rich-text input for description,
required file input for create, and the existing file display renderer.

Follow the divisions upload action pattern to normalize stored asset values and
write the stored path. Do not use raw `v-html`. Use the safe current HTML/text
display renderer for the approved difference.

**Verify**: web type-check passes; resource tests prove field order, labels,
renderers, list-only name, and separate permissions.

### Step 5: Add standard routes and navigation

Add the standard list, create, detail, and edit route files in Scope. Use
`ListView`, `DetailView`, and `FormView` with legacy title text. Add the
navigation item under the HSSE group with title `Dokumen Pernyataan Insiden`
and permission `view-incident-statement-document-configs`.

**Verify**: route integration and navigation tests pass; normal route generation
updates `route-map.d.ts` if needed.

### Step 6: Run focused checks and review scope

Run the Commands table. Review migration SQL, catalog entries, file path
normalization, list field contract, and the navigation diff. Confirm only the
Scope files plus generated route/migration files changed.

**Verify**: all focused commands pass and `git diff --check` exits 0.

### Step 7: Run browser acceptance and independent verification

Use the authenticated Codex browser. Upload one small marked temporary file.
Record URL, surface, action, temporary record ID, stored file result, and
visible result. Edit and reload. Delete the temporary record and reload to
confirm removal. Set this worksheet to `VERIFY`, then run
`$verify-ads-hk-module`.

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

- [ ] Field order, list fields, rich text, required file, consumer, and safe display difference are recorded.
- [ ] Legacy config, page, model, migration, consumer, upload pattern, and permission helper were read.
- [ ] Design and feature worksheet paths are linked.
- [ ] `Reused`, `Searched`, and `Gap` decisions are recorded.

### Contract and data checks

- [ ] Database, API, resource, and route field names align.
- [ ] Name validation and stored upload path validation pass.
- [ ] Create returns the complete selected record.
- [ ] Update can retain the current file and can update description/status.
- [ ] List exposes only `name` on the web list surface.
- [ ] This resource has its own permission family.
- [ ] Allowed and denied permission cases pass.

### Route and label ledger

| Surface or field | Legacy label or behavior | New result | Status |
|---|---|---|---|
| Page title | `Dokumen Pernyataan Insiden` | Exact title | PASS |
| File field | `Template Formulir` | Exact label | PASS |
| Description | Rich text | Rich-text input | PASS |
| List | `name` only | Name-only list | PASS |
| Detail | Description and file shown | Safe display renderer | APPROVED DIFFERENCE |

### Workflow and UI checks

- [ ] List, create, detail, and edit use standard framework views.
- [ ] Create requires a file and accepts rich-text description.
- [ ] Detail shows the stored file and safe description text.
- [ ] Edit keeps the existing file when no replacement is selected.
- [ ] Reload after create, update, and delete shows the expected result.

### Browser evidence

- URL: `http://localhost:5173/master-data/incident-statement-document-configs`
- Result: List showed the marked fixture `Codex Temp Incident Statement Document`. Detail showed the exact title, safe text description, and `Template Formulir` link to `uploads/codex-temp-incident-template.sql`.
- Form result: Create page showed required `Nama`, rich-text `Deskripsi`, required `Template Formulir`, and `Status` controls.
- Cleanup: Removed temporary record `ad32d98c-1e3d-41de-976c-d569a119e808`. Reloaded the list and confirmed `No data`.
- Upload gate: Two authenticated browser attempts with local files showed `Mengunggah` and then returned to the empty file control. No visible error or persisted file was available. API stored-path validation and CRUD tests pass.
- [ ] Failed writes keep the form open and show an API error.
- [ ] Browser evidence records the temporary file and record ID.
- [ ] No raw HTML is executed.

### Independent verification and final evidence

- [ ] Local worksheet state is `VERIFY` with no active implementation step.
- [ ] Focused API tests pass.
- [ ] Focused web tests pass.
- [ ] API and web type checks pass.
- [ ] Focused API and web lint pass.
- [ ] Migration applies.
- [ ] `git diff --check` passes.
- [ ] Authenticated browser flow passes.
- [ ] `$verify-ads-hk-module` returns `PASS`.
