# Master incident statement document configs design

- Status: `APPROVED`
- Approved source: User approval in the task conversation on 2026-08-20
- Legacy root: `/Users/gamer/Documents/projects/ads-hk-legacy`
- Feature folder: `/Users/gamer/Documents/projects/ads-hk/plans/master-incident-statement-document-configs/`

## Goal

Build the authenticated `master/incident-statement-document-configs` module.
It manages incident statement document templates consumed by incident report
statement documents.

## Legacy contract

The direct legacy config is:

`/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/incident-statement-document-configs.ts`

The direct legacy page is:

`/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/incident-statement-document-configs/incident-statement-document-configs.vue`

Keep these visible labels and field order:

- Page title: `Dokumen Pernyataan Insiden`
- Fields: `name`, `description`, `file_attachment`, `active`
- File label: `Template Formulir`
- Description input: rich text
- File input: required file
- List fields: `name` only

The resource is a lookup owner for incident report statement documents. Do not
change the incident report workflow in this module.

## Permission contract

Keep a separate permission family for the exact legacy resource ID:

`incident-statement-document-configs`

Do not merge this family with `hsse-observation` or another shared system
family. Register the current six entries: `view`, `list`, `detail`, `create`,
`update`, and `delete` with this resource suffix. The current `list/detail`
names map to legacy `lookup/show` and do not change the resource identity.

## Data model

Use the legacy table name `incident_statement_document_configs` with text UUID
ID, `name`, nullable `file_attachment`, nullable `description`, nullable
`active` defaulting to true, audit user IDs, and timestamps.

Store the uploaded file as the existing storage path contract. Keep the scalar
path as the write field and return the existing storage display metadata in
read responses when the current upload adapter supports it.

## API contract

Register `/incident-statement-document-configs` with standard authenticated
list, detail, create, update, and delete actions.

Validate:

- `name` is required, trimmed, and at most 255 characters;
- `description` is nullable text;
- `fileAttachment` is a valid stored upload path when supplied;
- create requires `fileAttachment` in the user-facing form, while update may
  keep the current file;
- `active` is boolean.

Return the complete selected record from create and update. Do not add a
custom workflow or a file-processing service.

## Web contract

Use standard `ListView`, `DetailView`, and `FormView` routes at
`/master-data/incident-statement-document-configs`.

Use the existing upload adapter pattern from the divisions resource/actions:
the form writes a stored path and detail/list display uses the framework file
renderer. Use the existing rich-text form renderer for `description`.

The current `html` display renderer is safe text. This is an approved
difference from the legacy raw `v-html` detail slot: do not reintroduce raw
HTML rendering or add a framework change.

Navigation stays in the `HSSE` group with title `Dokumen Pernyataan Insiden`.

## Reuse decision

- Reused: standard resource CRUD, `ListView`, `DetailView`, `FormView`, rich
  text input, file upload adapter, file display renderer, and the divisions
  upload normalization pattern.
- Searched: the legacy config and page, `apps/web/src/routes/(authenticated)/master-data/divisions/`,
  `apps/web/src/routes/(authenticated)/quality/quality-inspection/`,
  `apps/api/src/routes/permit-attachment/`, `apps/api/src/authorization/catalog.ts`,
  and the web architecture guide.
- Gap: None. The safe text display is an approved route-level behavior
  difference, not a framework gap.

## Browser acceptance journey

Create one marked temporary document config with a small file, rich-text
description, and active status. Confirm the list shows only `name`, open the
detail record, edit the description and status, reload, then delete the
temporary record and reload to confirm removal. Verify the file remains a
valid stored upload and that no raw HTML is executed.

The independent module verifier must return `PASS` before this feature is
complete.
