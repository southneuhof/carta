# 002 — Align basic catalog visual surfaces

**Priority:** P1  
**Effort:** M  
**Depends on:** 001  
**Status:** DONE

## Goal

Align the ordinary catalog screens with the legacy visual field surfaces while
keeping UUIDs, audit fields, permission checks, and server defaults internal.

## Module matrix

| Module | Table | Detail | Create/edit | Legacy evidence |
|---|---|---|---|---|
| Business Categories | name, code, description, active | name, code, description, active | name, code, description, active | `configs/business-categories.ts` |
| Root Causes | name, code, description, active | name, code, description, active | name, code, description, active | `configs/root-causes.ts` |
| UOMs | code, name, active | code, name, active | code, name, active | `configs/uoms.ts`; current approved code contract |
| PTS Work Categories | code, name, active | code, name, active | code, name, active | `configs/pts-work-categories.ts`; current approved code contract |

`id`, audit data, raw foreign keys, and `uomType` are absent from every surface
in this table. Catalog code is a business identifier, not a technical ID.

## Owner paths

- API: `apps/api/src/routes/{business-categories,root-causes,uoms,pts-work-categories}/`.
- Web: `apps/web/src/routes/(authenticated)/master-data/{business-categories,root-causes,uoms,pts-work-categories}/`.
- Field defaults: `apps/web/src/configs/defaults.ts` only if its active display
  must be changed for the confirmed read/form convention.

## Changes

1. Keep Business Categories and Root Causes in their legacy field order. Do
   not add technical columns or inputs. Use the existing `active` read chip
   and form control.
2. Change the UOM resource table, detail, and form lists to `code`, `name`,
   and `active`. Keep `uomType` out of the resource form and use the existing
   server-owned list/create context for `work-items`. Do not use a hidden form
   input for it.
3. Change the PTS Work Category resource table, detail, and form lists to
   `code`, `name`, and `active`. Keep its required unique code in the direct
   API contract and the resource form.
4. Keep `code` as a visible user-owned business identifier in UOM and PTS Work
   Category. Do not generate it silently or move ownership to the server.
5. Keep each module's resource, operations, tests, and routes in its existing
   colocated frontend folder. Do not rebuild a shared catalog file.

## Tests and checks

- Update only focused resource tests that assert the field lists and the UOM
  server-owned context. Do not add a broad generic field snapshot.
- Mount the real `FormView` once for UOM and PTS Work Category. Confirm code,
  name, and active render; no technical field is rendered.
- Manual browser checks: list, create, edit, and detail for all four modules;
  verify no ID or audit field appears and active renders as a chip on read
  surfaces.
- Run the focused web tests, `pnpm --filter @southneuhof/framework-web
  type-check`, the affected API tests/type check if an API contract changes,
  and `git diff --check`.

## Stop conditions

- Do not add a client default, fake hidden input, or client UUID to satisfy an
  API schema.

## Done criteria

- The four resources exactly use the matrix above.
- Each create form is usable without technical data.
- The API owns all generated/default fields.
