# Master incident statement document configs worksheet

- State: `VERIFY`
- Feature: `master-incident-statement-document-configs`
- Modules: `master/incident-statement-document-configs`
- Grouping reason: Separate module. It has its own document-config records, route, permissions, and acceptance flow.
- Folder: `plans/master-incident-statement-document-configs/`
- Design: `plans/master-incident-statement-document-configs/design.md`
- Active plan: `01-build-incident-statement-document-configs.md`
- Next action: Run `$verify-ads-hk-module` and record the result.
- Read boundary: Exact `incident-statement-document-configs` identifiers, direct legacy owner, and direct current owner.
- Write boundary: This worksheet only.
- Last result: `Implementation and focused checks pass. Browser list/detail/form checks pass; file upload is UI UNVERIFIED.`
- Last evidence: `apps/api/drizzle/20260820072623_plain_wendell_vaughn/migration.sql; API 2/2 focused tests; web resource/integration checks; type-check and lint pass; browser cleanup; two upload attempts entered Mengunggah then reset.`
- Blocker: `Authenticated browser file upload does not persist through the local storage service.`

## Discovery evidence ledger

| Question | Evidence path and symbol/line | Result | Status |
|---|---|---|---|
| Identity and fields | `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/migrations/2024_09_25_095621_create_incident_statement_document_configs.php:14-22`; `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/IncidentStatementDocumentConfigs.php:26-30` | `name`, `file_attachment`, `description`, `active`, and audit fields. | FOUND |
| Surface field placement and filters | `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/incident-statement-document-configs.ts:1-17` | List shows `name`; create/update use `name`, `description`, `file_attachment`, and `active`; detail shows the record. | FOUND |
| Legacy labels and behavior | `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/incident-statement-document-configs.ts:2-16`; `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/incident-statement-document-configs/incident-statement-document-configs.vue:1-14` | Page title `Dokumen Pernyataan Insiden`; `file_attachment` label `Template Formulir`; description uses rich text; detail renders description and file. | FOUND |
| Relation or child owner | `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/IncidentStatementDocumentConfigs.php:91-108` | Only audit relations to users are owned by the record. | NOT NEEDED |
| Lookup consumer or dependency | `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/IncidentReportStatementDocuments.php:54-119`; `.../database/migrations/2024_09_25_095728_create_incident_report_statement_documents.php:14-28` | Incident report statement documents consume this resource through `statement_document_id`. | FOUND |
| Workflow or custom write | `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/IncidentStatementDocumentConfigs.php:134-162` | Standard CRUD only; no custom write hook changes the data. | FOUND |
| API permission realm and verbs | `/Users/gamer/Documents/projects/ads-hk/apps/api/src/authorization/catalog.ts:1-80`; `apps/api/src/routes/permit-attachment/permit-attachment.ts:1-120`; `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/utils/auth.ts:5-34` | Keep a separate legacy permission family for `incident-statement-document-configs`; do not merge it with an HSSE system permission family. | FOUND |
| Route and navigation owner | `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/menu.ts:130-138` | Navigation group `HSSE`; title `Dokumen Pernyataan Insiden`; current route/resource owner is NOT FOUND. | FOUND |
| Seed and reload requirement | `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/IncidentStatementDocumentConfigs.php:134-162` | No legacy seed record or browser fixture is required for the standard CRUD path. | FOUND |
| Framework or UI gap | `packages/is-vue-framework/src/renderers/form.ts:82-110`; `apps/web/src/framework/fields/renderers.ts:67-70`; `apps/web/src/routes/(authenticated)/master-data/divisions/divisions.resource.ts:16-25` | File upload, rich-text input, file display, and standard CRUD shells exist. Legacy HTML detail needs a route-local value slot because the current `html` renderer displays safe text. | FOUND |

## Plan map

| Plan | Scope | Depends on | Status | Evidence |
|---|---|---|---|---|
| `01-build-incident-statement-document-configs.md` | API, permissions, migration, resource, route, and acceptance | `01-build-hsse-observation.md` for shared root-file write order | BLOCKED | `design.md`, focused checks, browser, upload blocker |

## Cross-plan blockers and decisions

- User decision: the permission family must match the legacy resource ID.
- User approval: standard CRUD design and safe text display difference approved.
