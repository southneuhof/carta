# Plan 01: Build tools brands

Status: `VERIFY`

Design: `plans/094-build-master-tools/design.md`

Manifest: `plans/094-build-master-tools/tools-brands.module.json`

## Execution worksheet

- State: `VERIFY`
- Module: `tools-brands`
- Feature folder: `/Users/gamer/Documents/projects/ads-hk/plans/094-build-master-tools`
- Feature worksheet: `plans/094-build-master-tools/worksheet.md`
- Plan: `plans/094-build-master-tools/01-build-tools-brands.md`
- Design: `plans/094-build-master-tools/design.md`
- Planned at: `working tree after scaffold`
- Active step: `5`
- Next action: `Independent verification; shared framework type-check blocker remains open`
- Read boundary: `generated tools-brands files; listed integration owners`
- Write boundary: `generated tools-brands files, integration owners, route map`
- Last result: `Focused API/web checks pass. Static verifier passes. Authenticated browser create/detail/edit flow passes. Shared framework type-check fails with TS2590.`
- Last evidence: `reports/tools-brands.verify.check-only.json`; `reports/tools-brands.verify.run.json`; local browser paths `/master-data/tools-brands`, `/create`, and record detail/edit.
- Blocker: `apps/web type-check fails in packages/is-vue-framework/src/components/views/{DetailView,FormView,ListView}.vue with TS2590; user directed to skip this unrelated framework fix.`

| Step | Status | Action | Read/write boundary | Expected result | Evidence |
|---|---|---|---|---|---|
| 1 | PASS | Run integration check and apply | `apps/api/src/authorization/catalog.ts`, `apps/api/src/routes/index.ts`, `apps/web/src/manifest/navigation.ts`, `apps/web/src/routes/(authenticated)/master-data/index.route.vue` | Integration is guarded and applies the manifest | `integrate:master-data --check/--apply` |
| 2 | PASS | Implement category validation, audit fields, list filter, and focused API checks | `apps/api/src/routes/tools-brands/` | Authenticated standard CRUD validates the two categories and records audit users | `tools-brands.routes.spec.ts` 2/2 |
| 3 | PASS | Implement category select and ChipFilter surfaces | `apps/web/src/routes/(authenticated)/master-data/tools-brands/` | Legacy titles, labels, two filters, and standard routes work | web focused tests 3/3; browser create/detail/edit |
| 4 | BLOCKED | Generate/apply migration and run focused checks | `apps/api/drizzle`, module specs, type-check owners | Database and focused checks pass | API type-check and focused checks pass; web type-check TS2590 in shared framework |
| 5 | BLOCKED | Run authenticated browser journey and independent verification | local app and feature folder | CRUD, filter, reload, delete, and labels pass; verifier returns PASS | Browser create/detail/edit pass; independent verifier BLOCKED by step 4 |

## Ownership and acceptance matrix

- API owner: `apps/api/src/routes/tools-brands/`
- Web owner: `apps/web/src/routes/(authenticated)/master-data/tools-brands/`
- Table: `tools_brands`
- Navigation: `master-data`, `Data`, after `master-data-number-configs`; tools types precedes this entry
- Relation owner: none; lookup consumers are equipment, instrument, and brand-series modules
- Permissions: `view-tools-brands`, `list-tools-brands`, `detail-tools-brands`, `create-tools-brands`, `update-tools-brands`, `delete-tools-brands` in `system`
- Seed: none; browser uses one temporary marked row and removes it

| Field | Legacy label | API create | API update | List/detail | Form | Source |
|---|---|---:|---:|---:|---:|---|
| `categoryCode` | `Kategori` | required | yes | filter only | select | fixed local options |
| `name` | `Nama` | required | yes | yes | text | no |
| `description` | `Deskripsi` | nullable | yes | yes | textarea | no |
| `active` | `Status` | default true | yes | yes | switch | server default |

| Surface | Legacy evidence | New route/action | Status |
|---|---|---|---|
| List entry | legacy `menu.ts:68-82` and `tools-brands.vue:15-37` | `/master-data/tools-brands`, `toolsBrands.list()` | TODO |
| List filter | legacy `tools-brands.vue:8-31` | `ChipFilter` with `Alat Berat` / `Alat Ukur/Uji` | TODO |
| List row | legacy shared `BaseCRUD` | standard detail, edit, delete | TODO |
| Detail | legacy shared `BaseCRUD` | `/:toolsBrandId/detail`, `toolsBrands.detail()` | TODO |
| Create form | legacy config `tools-brands.ts:25-27` | `/create`, `FormView` | TODO |
| Edit form | legacy shared `BaseCRUD` | `/:toolsBrandId/edit`, `FormView` | TODO |
| Child row/workflow | no owned child or workflow | none | NOT NEEDED |

| Label | Legacy | New | Status |
|---|---|---|---|
| Page/list heading | `Merk Alat Berat & Alat Ukur/Uji` | same | TODO |
| Filter | `Alat Berat`, `Alat Ukur/Uji` | same | TODO |
| Fields | `Kategori`, `Nama`, `Deskripsi`, `Status` | same | TODO |
| Create heading | `Tambah Merk Alat Berat & Alat Ukur/Uji` | same | TODO |
| Detail heading | `Detail Merk Alat Berat & Alat Ukur/Uji` | same | TODO |
| Edit heading | `Ubah Merk Alat Berat & Alat Ukur/Uji` | same | TODO |
| Submit/success | `Submit`, legacy success messages | same | TODO |

## Focused commands

```sh
pnpm integrate:master-data --manifest /Users/gamer/Documents/projects/ads-hk/plans/094-build-master-tools/tools-brands.module.json --check
pnpm integrate:master-data --manifest /Users/gamer/Documents/projects/ads-hk/plans/094-build-master-tools/tools-brands.module.json --apply
pnpm --filter @southneuhof/api db:generate
pnpm --filter @southneuhof/api db:migrate
pnpm --filter @southneuhof/api exec vitest run apps/api/src/routes/tools-brands/tools-brands.routes.spec.ts
pnpm --filter @southneuhof/framework-web exec vitest run "apps/web/src/routes/(authenticated)/master-data/tools-brands/tools-brands.resource.spec.ts" "apps/web/src/routes/(authenticated)/master-data/tools-brands/tools-brands.integration.spec.ts"
pnpm --filter @southneuhof/api type-check
pnpm --filter @southneuhof/framework-web type-check
git diff --check
```

## Acceptance checklist

- [ ] Feature design, worksheet, local worksheet, manifest, and evidence paths are recorded.
- [ ] Legacy owner, current owner, field inventory, route/action matrix, and labels are complete.
- [ ] No owned relation, workflow, seed, or framework gap exists.
- [ ] Database, API, resource, and route field names align; category filter is server-backed.
- [ ] Authenticated allowed and denied permission checks pass.
- [ ] Standard `ListView`, `DetailView`, and `FormView` routes work.
- [ ] First load and reload after create, update, and delete work.
- [x] Focused API and web checks pass.
- [ ] API/web type checks and lint pass. Web type-check is blocked by shared framework TS2590; lint has warnings and no errors.
- [x] `git diff --check` passes.
- [ ] Authenticated Codex browser verifies list, filter, create, detail, edit, update, delete, reload, and exact labels. Create/detail/edit/update and labels pass; delete was cleanup-only.
- [ ] `$verify-ads-hk-module` returns `PASS`; expected result is `BLOCKED` until the shared type-check issue is resolved.
- [ ] No framework package changed.

## Reports

- Check-only: `plans/094-build-master-tools/reports/tools-brands.verify.check-only.json`
- Run: `plans/094-build-master-tools/reports/tools-brands.verify.run.json` (`FAIL` only at shared framework web type-check)

## Reuse record

- Reused: simple master-data scaffold, standard CRUD shells, `defineFields`, `defineResource`, `ListView`, `DetailView`, `FormView`, and `ChipFilter`.
- Searched: legacy config/model/migration/menu/consumers; current project and toll-cause filter routes; current emergency CRUD module; framework architecture and README.
- Gap: none.
