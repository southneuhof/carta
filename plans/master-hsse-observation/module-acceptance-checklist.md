# Master HSSE observation acceptance checklist

## Execution worksheets

- [x] `design.md`, `worksheet.md`, this checklist, and one numbered plan exist.
- [x] This feature folder contains one related module group.
- [x] Worksheet records the group and reason.
- [x] Numbered plan has one local worksheet, state `VERIFY`, all steps `PASS`, and no unresolved step.
- [x] Focused API checks use the test database migration and named spec files.

## Scope and legacy evidence

- [x] Four related resources, parent relations, filters, and write fields are recorded in `worksheet.md` and `design.md`.
- [x] Legacy page, child layout, configs, migrations, model/seed, menu, and permission helper were read.
- [x] Current sibling patterns were read: projects `ChipFilter`, permit APD nested CRUD, project-vendor relations.
- [x] `Reused`, `Searched`, and `Gap` are recorded in `design.md`.
- [x] No unapproved label difference exists.

## Route and action matrix

| Surface | New route/action | Result |
|---|---|---|
| List entry | `/master-data/hsse-observation` | PASS: authenticated browser |
| List filter | `findingCriteriaCode` with `ChipFilter` | PASS: default `negative`; Positif reload showed 6 rows |
| Finding type detail | `/master-data/hsse-observation/:findingTypeId/detail` | PASS: browser |
| Category child | `/master-data/hsse-observation/:findingTypeId/detail/categories` | PASS: browser |
| Cause child | `/master-data/hsse-observation/:findingTypeId/detail/categories/:findingCategoryId/detail/causes` | PASS: browser |
| Category/cause CRUD | standard create/detail/edit/delete routes | PASS: temporary browser fixture created and removed |

## Contract and data checks

- [x] Database, API, typed actions, resources, and routes use aligned field names.
- [x] API authorization has separate families for `finding-criteria`, `finding-types`, `finding-categories`, and `finding-cause`.
- [x] Allowed and denied permission cases pass in the API spec.
- [x] API relation objects are loaded for list/detail/create/update; web uses scalar write fields and relation read projections.
- [x] Criteria and type seed is idempotent and legacy-parity.
- [x] Standard views use `ListView`, `DetailView`, `FormView`; `ChipFilter` is the only main collection filter control.

## Browser evidence

- [x] URL `/master-data/hsse-observation`: default `Negatif` showed 7 seeded rows; `Positif` showed 6 rows.
- [x] Temporary category `83ca3baf-7000-4f42-8148-659afcba839b` and cause `de3db1d8-e906-4dbf-85de-9331b1b61d67` showed parent relation labels.
- [x] Temporary records were removed and reload showed `No data`.

## Checks

- [x] API focused tests: 2 files, 4 tests passed.
- [x] Web focused tests: 5 files, 11 tests passed.
- [x] API and web type checks passed.
- [x] API and web focused lint passed.
- [x] `git diff --check` passed.
- [x] Independent verifier result: `PASS` — contract, parity, checks, seed, and browser evidence reviewed.
