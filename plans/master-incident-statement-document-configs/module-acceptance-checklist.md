# Master incident statement document configs acceptance checklist

## Execution worksheets

- [x] `design.md`, `worksheet.md`, this checklist, and one numbered plan exist.
- [x] This feature folder contains one module group.
- [x] Worksheet records the group and reason.
- [x] Numbered plan has one local worksheet, state `VERIFY`, all steps `PASS`, and no unresolved step.
- [x] Focused API checks use the test database migration and named spec files.

## Scope and legacy evidence

- [x] Legacy config, page, model, migration, consumer, upload pattern, menu, and permission helper were read.
- [x] List, detail, create, edit, file, rich-text, active-state, and safe-display decisions are recorded in `worksheet.md` and `design.md`.
- [x] Standard CRUD and file/rich-text framework patterns were reused.
- [x] The safe text display difference is approved in `design.md`.

## Route and action matrix

| Surface | New route/action | Result |
|---|---|---|
| List entry | `/master-data/incident-statement-document-configs` | PASS: authenticated browser |
| List row/detail | `/:incidentStatementDocumentConfigId/detail` | PASS: browser showed name, safe description, and file link |
| Create form | `/create` | PASS: browser showed required `Nama`, rich-text `Deskripsi`, required `Template Formulir`, and `Status` |
| Edit form | `/:incidentStatementDocumentConfigId/edit` | PASS: route and resource tests |
| CRUD API | list/detail/create/update/delete | PASS: focused API spec |

## Contract and data checks

- [x] Database, API, typed actions, resource, and routes use aligned field names.
- [x] The resource has its own `incident-statement-document-configs` permission family.
- [x] Allowed and denied permission cases pass in the API spec.
- [x] Create validates the stored upload path and returns the complete selected record.
- [x] Update keeps the existing file when no replacement is supplied.
- [x] The web list exposes `name` only; detail/form fields match the legacy order.
- [x] No raw HTML execution is used; the safe text display difference is approved.

## Browser evidence

- [x] URL `/master-data/incident-statement-document-configs`: marked fixture appeared in the list.
- [x] Detail showed `Dokumen Pernyataan Insiden`, `Template Formulir`, safe text description, and stored file link.
- [x] Temporary fixture `ad32d98c-1e3d-41de-976c-d569a119e808` was removed and reload showed `No data`.

## Checks

- [x] API focused tests: 1 file, 2 tests passed.
- [x] Web resource/integration tests passed.
- [x] API and web type checks passed.
- [x] API and web focused lint passed.
- [x] `git diff --check` passed.
- [ ] Independent verifier result: `BLOCKED` — authenticated browser upload did not persist a file in the local storage path.
