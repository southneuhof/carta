# 004 — Align Project and Project Vendor visual surfaces

**Priority:** P1  
**Effort:** L  
**Depends on:** 001, 003  
**Status:** DONE

## Goal

Restore the legacy Project field task and project-scoped Vendor task without
turning status or parent ownership into generic form fields.

## Legacy matrices

Evidence:

- `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/projects.ts`
- `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/project-vendor.ts`
- `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/initiation/projects/layouts/layouts/ProjectVendor.vue`

| Module and surface | Fields and renderer |
|---|---|
| Project table | Name, Short Name, Division label, Project Number, Location, Start Date, End Date, Description, implementation-status chip |
| Project detail | Name, Division label, Project Number, Location, Description, implementation-status chip |
| Project create/edit | Name, Short Name, Division lookup, Project Number, Location, Start Date (required), End Date, Description |
| Project Vendor list/create/edit in Project detail | Vendor/Subkon/Mandor name only; Project comes from the parent route |
| Standalone Project Vendor path | Required Project lookup plus Vendor/Subkon/Mandor name; this is an approved current access path |

`active`, `currentProgress`, `isJo`, raw relation keys, IDs, audit fields, and
timestamps are not normal legacy visual fields. `integrationCode` remains a
visible required business field until a separate Project contract replaces it;
it is not a technical identifier.

## Owner paths

- Project API: `apps/api/src/routes/projects/`.
- Vendor API: `apps/api/src/routes/project-vendors/`.
- Project web: `apps/web/src/routes/(authenticated)/master-data/projects/`.
- Vendor web: `apps/web/src/routes/(authenticated)/master-data/project-vendors/`.
- Use `apps/web/src/framework/adapters/location.ts` and the installed
  `location` renderer. It is already available; do not add a map provider or
  a separate custom location component.

## Changes

1. Add `shortName` to the Project database/API schema and direct resource
   operation. Provide a safe migration and keep it nullable only until the
   existing data backfill rule is defined. Do not invent a value from `name`.
2. Use the existing `location` renderer for the validated structured value.
   Align the API schema with the adapter value `{ address, lat, lng }`; migrate
   existing text values with an explicit review path. Do not retain a generic
   text field as the Project UI.
3. Add `imgThumbnail` only when its exact legacy screen placement is decided.
   The legacy Project config does not list it, even though the older model has
   it. Do not show it merely because the current table stores it.
4. Change Project resource table, detail, and form lists to the matrix above.
   Use Division labels on read surfaces and the Division lookup in forms.
5. Keep implementation status display-only. Map the chip only after the
   separate Project completion/status workflow defines current values that
   correspond to legacy `draft`, `on-progress`, and `finished`. Do not show
   `statusCode` or `active` as a normal Project input.
6. Keep required `integrationCode` visible in the Project table, detail, and
   form until a separate Project contract replaces it. Do not hide a
   client-required business field behind a default.
7. Keep the standalone Project Vendor route, but make its visual fields only
   Project lookup and renamed Vendor/Subkon/Mandor name. Remove ordinary
   detail navigation for the standalone Vendor resource if it exposes only the
   same fields.
8. Add a Project-detail child Vendor list/create/edit route. It must inject and
   filter by the route Project ID, share the direct Vendor API and resource
   operation, and never ask the user for a raw project ID in that path.

## Tests and checks

- Add focused API tests for structured location validation, the short-name
  migration contract, and Project-scoped Vendor authorization/filtering.
- Add focused resource/FormView tests for Division lookup, location input,
  status display boundary, and both Vendor access paths. Do not test the
  Project completion workflow here.
- Manual browser checks: Project list/detail/form match the matrix; location
  writes and reads one structured value; project-detail Vendor creation cannot
  change the parent Project; standalone Vendor creation can select it.
- Run affected API/web tests and type checks, then `git diff --check`.

## Stop conditions

- Stop Project status-chip work until the separate Project completion workflow
  defines its API values and transitions.
- Stop any image addition without a documented Project screen placement.

## Done criteria

- Project visible fields and renderers follow the legacy matrix.
- Project Vendor works as both a project child task and an approved standalone
  access path without duplicate resources.
- No Project or Vendor surface exposes an ID, audit field, or raw relation key.

## Deferred by stop conditions

Project status chips remain deferred until the Project completion workflow
defines its values and transitions. Project images remain deferred because the
legacy Project screen has no approved image placement.
