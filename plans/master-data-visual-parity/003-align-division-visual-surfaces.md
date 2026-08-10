# 003 — Align Division visual surfaces

**Priority:** P1  
**Effort:** M  
**Depends on:** 001  
**Status:** DONE

## Goal

Make Divisions a category-owned visual catalog with a name and logo, not a
generic code/description/status form.

## Legacy matrix

Evidence: `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/divisions.ts`.

| Surface | Fields and renderer |
|---|---|
| Table | Business Category relation name, Division code, Name, Logo image |
| Detail | Business Category relation name, Division code, Name, Logo image |
| Create/edit | Business Category lookup (required), Division code, Name, Logo image/file input |

The legacy config does not expose description or active. It also never exposes
`id` or audit fields. Division code remains visible as an approved current
business identifier, not a technical ID.

## Owner paths

- API: `apps/api/src/routes/divisions/divisions.entity.ts`, direct route and
  service files in the same folder, and the direct migration folder if schema
  work is required.
- Web: `apps/web/src/routes/(authenticated)/master-data/divisions/`.
- Reuse the existing image/file renderer and storage adapter. The current
  entity already has `imgThumbnail`; do not create a plain text key input.

## Changes

1. Use `businessCategory` as a read-only relation label and `businessCategoryId`
   only as the form lookup. Keep the existing parent resource source; never
   render its UUID.
2. Add `imgThumbnail` to the resource with the installed file/image input and
   matching read renderer. Ensure the direct Division API accepts and persists
   the file value through the existing upload lifecycle.
3. Change the resource table, detail, and form field lists to the matrix.
   Keep `code`; remove `description` and `active` from user surfaces.
4. Keep required unique Division code in the direct API and resource form. It
   is user-owned catalog identity, not a server-generated technical field.
5. Keep category-required validation and active-parent authorization in the
   API. These are server rules, not visual fields.

## Tests and checks

- Add focused resource tests for the category lookup, category read label, and
  image renderer. Test the direct API only if the code or upload contract
  changes.
- Mount the real Division `FormView` with the image input. Upload or select a
  valid image through the existing storage adapter; do not test a text value.
- Manual browser checks: table and detail show a label and image, create/edit
  show lookup/name/image only, and no ID/audit/code/description/status field
  appears.
- Run affected API and web tests, both affected type checks, and
  `git diff --check`.

## Stop conditions

- Stop if the installed file/image renderer cannot persist `imgThumbnail`
  through the existing API. Report the framework or storage gap; do not add a
  custom text renderer.

## Done criteria

- Division table, detail, and form use the matrix, including the approved
  current business code.
- Category values are labels on read surfaces and lookup values on write
  surfaces.
- Logo upload and display work through the existing framework path.
