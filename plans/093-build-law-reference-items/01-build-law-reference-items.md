# Build law reference items

## Execution worksheet

- State: `DONE`
- Module: `master/law-reference-items`
- Feature folder: `/Users/gamer/Documents/projects/ads-hk/plans/093-build-law-reference-items`
- Feature worksheet: `/Users/gamer/Documents/projects/ads-hk/plans/093-build-law-reference-items/worksheet.md`
- Plan: `/Users/gamer/Documents/projects/ads-hk/plans/093-build-law-reference-items/01-build-law-reference-items.md`
- Design: `/Users/gamer/Documents/projects/ads-hk/plans/093-build-law-reference-items/design.md`
- Test environment: `.env.test` / repository test database
- Planned at: `78ecc99`
- Active step: `None`
- Next action: `None. Independent verifier returned PASS.`
- Read boundary: `The approved design, direct module owners, and the exact files in the scope list.`
- Write boundary: `The files in the scope list and this plan worksheet.`
- Last result: `Independent verifier returned PASS. Implementation, focused API/web tests, API type-check, focused lint, seed, and authenticated browser journey pass. Temporary records were deleted and reload confirmed an empty tree.`
- Last evidence: `pnpm --filter @southneuhof/api test:focused -- src/routes/law-reference-items/law-reference-items.routes.spec.ts; focused web specs; http://localhost:5173/master-data/law-reference-items`
- Blocker: `Full web package type-check reports the pre-existing framework union error; the same error remains when this module is removed from API registration.`
- Environment note: `pnpm --filter @southneuhof/api db:push` was attempted and stopped on existing unrelated `number_configs_display_order_seq` drift. Test migration, seed, and focused API checks pass.

| Step | Status | Action | Read/write boundary | Expected result | Evidence |
|---|---|---|---|---|---|
| 1 | PASS | Add database entities, schemas, relations, and migration | `apps/api/src/routes/law-reference-items/`, API entity patterns, generated migration | Category and item contracts compile | `pnpm --filter @southneuhof/api type-check`; `apps/api/drizzle/20260820064518_free_nocturne/migration.sql` |
| 2 | PASS | Add authenticated API routes and register the module | API module, `apps/api/src/routes/index.ts` | Flat CRUD and nested tree routes enforce approved rules | API type-check; focused API test |
| 3 | PASS | Add permissions and idempotent category seed | `apps/api/src/authorization/catalog.ts`, `apps/api/scripts/seed.ts`, module seed | Six permissions and three categories exist | `pnpm --filter @southneuhof/api db:seed`; focused auth test |
| 4 | PASS | Add focused API acceptance tests | Module API spec and nearest test pattern | Auth, validation, filters, relations, and recursive delete pass | `pnpm --filter @southneuhof/api test:focused -- src/routes/law-reference-items/law-reference-items.routes.spec.ts` (3 tests) |
| 5 | PASS | Add web schema, actions, resource, and fields | Module web resource files and typed RPC boundary | Resource has schema-bound fields and standard actions | Focused resource test; focused web lint |
| 6 | PASS | Add authenticated tree route and navigation | Module route, manifest, hub, generated route map if changed | Legacy-parity tree workflow renders and reloads | Focused integration test; authenticated browser |
| 7 | PASS | Add focused web tests and run selected checks | Module web specs and scoped commands | Focused tests, lint, API type-check, seed smoke, and diff check pass | Focused web tests (3 tests); focused lint; `git diff --check` |
| 8 | PASS | Run browser acceptance and independent verification | Local authenticated app, feature folder, verifier | Temporary data is removed and verifier returns PASS | Browser journey complete; verifier is the remaining gate |

## Scope

In scope:

- `apps/api/src/routes/law-reference-items/law-reference-items.entity.ts`
- `apps/api/src/routes/law-reference-items/law-reference-items.ts`
- `apps/api/src/routes/law-reference-items/law-reference-items.seed.ts`
- `apps/api/src/routes/law-reference-items/law-reference-items.routes.spec.ts`
- `apps/api/src/routes/index.ts`
- `apps/api/src/authorization/catalog.ts`
- `apps/api/scripts/seed.ts`
- `apps/web/src/routes/(authenticated)/master-data/law-reference-items/law-reference-items.schema.ts`
- `apps/web/src/routes/(authenticated)/master-data/law-reference-items/law-reference-items.actions.ts`
- `apps/web/src/routes/(authenticated)/master-data/law-reference-items/law-reference-items.resource.ts`
- `apps/web/src/routes/(authenticated)/master-data/law-reference-items/index.route.vue`
- `apps/web/src/routes/(authenticated)/master-data/law-reference-items/law-reference-items.resource.spec.ts`
- `apps/web/src/routes/(authenticated)/master-data/law-reference-items/law-reference-items.integration.spec.ts`
- `apps/web/src/manifest/navigation.ts`
- `apps/web/src/manifest/__tests__/manifest.spec.ts`
- `apps/web/src/routes/(authenticated)/master-data/index.route.vue`
- generated `apps/web/src/route-map.d.ts` only if the normal route generator changes it.

Out of scope: framework packages, legacy files, law fulfillment tables, IBPRP
consumer changes, category CRUD, separate detail/create/edit pages, and
hand-edited route declarations.

## Approved implementation contract

Use text UUID IDs. Add category and item tables in one entity file. Keep
`lawReferenceCategoryCode` and `parentId` as scalar write fields. Add named
`category` and `parent` relation objects to select, list, detail, and returned
create/update records. Exclude `deleted` records from all normal reads.

The API exposes standard `/list`, `/detail/:id`, `/create`, `/update/:id`, and
`/delete/:id` actions plus `GET /tree` with the category query. Use the six
`system` permissions defined in the design. Validate category, active parent,
same-category parent, exact level, root/child type, level-3 ceiling, and update
cycles. Delete with one transaction that soft-deletes the full descendant set.

The web route uses `ChipFilter`, `TreeTable`, `DialogForm`, `Form`, and base
components. It defaults to `environment`, keeps category order, shows the exact
legacy labels, hides type for children, shows add-child only at levels 1 and 2,
and reloads after every successful write.

## Reuse record

- Reused: `TreeTable`, `DialogForm`, `Form`, `ChipFilter`, base components,
  `defineSchema`, `fromZod`, `defineFields`, `defineResource`, and the current
  work-items tree CRUD pattern.
- Searched: `apps/web/src/routes/(authenticated)/master-data/work-items/index.route.vue`,
  `apps/api/src/routes/work-items/work-items.ts`,
  `apps/web/src/routes/(authenticated)/master-data/emergency-simulation-topics/`,
  `packages/is-vue-framework/src/components/core/TreeTable.vue`,
  `packages/is-vue-framework/src/components/composites/DialogForm.vue`,
  `docs/architecture/web-application-architecture.md`, and
  `packages/is-vue-framework/README.md`.
- Gap: `None`. No framework code changes are approved.

## Focused commands

```sh
pnpm --filter @southneuhof/api test:focused -- src/routes/law-reference-items/law-reference-items.routes.spec.ts
pnpm --filter @southneuhof/framework-web test:focused -- routes/(authenticated)/master-data/law-reference-items/law-reference-items.resource.spec.ts routes/(authenticated)/master-data/law-reference-items/law-reference-items.integration.spec.ts
pnpm --filter @southneuhof/api type-check
pnpm --filter @southneuhof/framework-web type-check
pnpm --filter @southneuhof/api lint:focused -- src/routes/law-reference-items/law-reference-items.entity.ts src/routes/law-reference-items/law-reference-items.ts src/routes/law-reference-items/law-reference-items.routes.spec.ts src/routes/law-reference-items/law-reference-items.seed.ts
pnpm --filter @southneuhof/framework-web lint:focused -- routes/(authenticated)/master-data/law-reference-items
pnpm --filter @southneuhof/api db:push
pnpm --filter @southneuhof/api db:seed
git diff --check
```

Do not run a package-wide test or bare `vitest run`. API focused tests must use
the `.env.test` migration path from `test:focused`.

## Ordered work

1. Add entity schemas and relations. Generate and review the migration.
2. Add API routes, validation, tree assembly, and recursive soft delete. Register
   the domain and model in `apps/api/src/routes/index.ts`.
3. Add the authorization catalog entry and the three category seed rows. Do not
   seed law items.
4. Add API tests for authorization, relation metadata, filters, nesting,
   invalid parent/level/type/cycle inputs, and recursive soft delete.
5. Add the typed web schema, custom tree action, resource fields, standard
   actions, relation `read` projections, and child context behavior.
6. Add the route-local tree page and navigation. Use the exact help text from
   the legacy view. Keep failed dialogs open and show API errors.
7. Add focused web resource and navigation tests. Run all selected commands.
8. Run the authenticated browser journey with marked temporary records. Delete
   them and reload. Set the worksheet to `VERIFY`, invoke the independent
   verifier, and set the plan to `DONE` only after verifier `PASS`.

## Stop conditions

Stop and report if the standard route model does not expose the approved action
paths, if Drizzle relations need framework changes, if a current fulfillment
table or consumer write contract appears, if permission names differ, if a
required framework surface is missing, if a focused check fails twice, if the
browser is unavailable after one valid retry, or if any label or delete rule
differs from the approved design.

## Acceptance checklist

## Browser evidence

- URL: `http://localhost:5173/master-data/law-reference-items`
- Default load: category chips `Lingkungan`, `K3`, and `Pengamanan`; selected `Lingkungan`; exact page/help/tree labels visible.
- Root create: `Codex Test Law Dialog 20260820`, API id `afd57b37-bb50-40e4-902b-3671088779ac`; row showed `Reference` and `Berlaku`.
- Child create: `Codex Test Law Dialog Child 20260820`, API id `d2772817-cb51-4b68-9113-2f985fca7bd4`; child form hid `Tipe`; tree returned the child under the root.
- Edit: the earlier marked root changed to `Codex Test Law Edited 20260820`; reload showed the edited row.
- Delete: the final root row opened `Apakah anda yakin ingin melakukan aksi ini?` with `Tekan lanjut untuk melanjutkan aksi`, `Lanjut`, and `Batal`; `Lanjut` ran recursive delete; reload showed `Tidak ada data` and categories remained.
- Browser errors after the final flow: none.

### Execution worksheets

- [x] Feature folder contains `design.md` and `worksheet.md`.
- [x] This plan contains the local worksheet and one active step at a time.
- [x] Local worksheet records module, plan, design, planned SHA, state, active
      step, next action, read/write boundary, result, and evidence.
- [x] State was `READY` before source edits, `EXECUTE` during edits, and
      `VERIFY` before independent verification.
- [x] Every completed step has a path, command report, or browser result.
- [x] No `TODO`, `REWORK`, `STOP`, or `BLOCKED` implementation item remains before verification.

### Scope and evidence

- [x] Module shape, fields, recursive owner, and lookup consumer are recorded.
- [x] Surface field placement and filters are recorded.
- [x] Approved design and feature worksheet are linked and read.
- [x] Direct legacy owner and required surfaces are recorded.
- [x] Exact labels, headings, actions, validation, and status text are recorded.
- [x] Reused, searched, and gap decisions are recorded.

### Evidence ledger

| Question | Evidence | Result | Status |
|---|---|---|---|
| Identity and fields | Legacy migration/model; current entity | Fields and types match design | PASS |
| Surface field placement and filters | Legacy view/model; current route/resource | Tree fields and lookup filters match design | PASS |
| Legacy labels and behavior | Legacy view lines 67-153 | Exact labels and level-3 tree preserved | PASS |
| Relation or child owner | Legacy model lines 113-173; current entity | Category and recursive parent relations | PASS |
| Lookup consumer | Legacy IBPRP paths in `worksheet.md` | Flat filtered list remains available | PASS |
| Workflow or custom write | Legacy view; design | Standard writes plus custom tree read | PASS |
| API permission realm and verbs | Catalog and route constants | System realm and six item permissions | PASS |
| Route and navigation owner | Legacy menu; current manifest | Master Data under `Undang-Undang` | PASS |
| Seed and reload | Legacy category seeder; current seed script | Three categories and reload after writes | PASS |
| Framework or UI gap | Current work-items route and framework components | No gap | PASS |

### Route and action matrix

| Surface | Legacy evidence | New route/action | Permission | Reused pattern | Result | Status |
|---|---|---|---|---|---|---|
| List entry | Legacy page/menu | `/master-data/law-reference-items` | `view-law-reference-items` | Work Items route | Browser/integration | PASS |
| List row | Legacy tree row actions | `TreeTable` row actions | create/update/delete | Work Items | Browser | PASS |
| Detail | No separate legacy page | API detail action | `detail-law-reference-items` | Standard resource | API | PASS |
| Child row | Legacy add child at levels 1-2 | TreeTable row action | `create-law-reference-items` | Work Items | Browser | PASS |
| Create form | Legacy modal | DialogForm root/child | `create-law-reference-items` | DialogForm | Browser/API | PASS |
| Edit form | Legacy modal | DialogForm edit | `update-law-reference-items` | DialogForm | Browser/API | PASS |
| Delete | Legacy confirmation | Recursive soft delete | `delete-law-reference-items` | Work Items | Browser/API | PASS |

### User-facing label ledger

| Surface or field | Legacy label | New label | Status |
|---|---|---|---|
| Page heading | `Master Regulasi & Perundangan HSSE` | `Master Regulasi & Perundangan HSSE` | PASS |
| Tree heading | `Undang-Undang` | `Undang-Undang` | PASS |
| Name column | `Nama` | `Nama` | PASS |
| Type column | `Tipe` | `Tipe` | PASS |
| Status column | `Status` | `Status` | PASS |
| Create action | `Tambah` | `Tambah` | PASS |
| Active status | `Berlaku` | `Berlaku` | PASS |
| Inactive status | `Tidak Berlaku` | `Tidak Berlaku` | PASS |
| Root type | `Reference` | `Reference` | PASS |
| Root type | `Applicable` | `Applicable` | PASS |
| Help text | Legacy lines 71-72 | Exact legacy help text | PASS |

### Contract and data checks

- [x] Database, API schema, operation, resource, and route names align.
- [x] API authorization has allowed and denied evidence.
- [x] Category and parent relations are present in list/detail and returned
      create/update records.
- [x] Scalar category and parent fields are used for writes; relation names use
      `read` projections.
- [x] Flat list supports category, type, and level filters.
- [x] Seed is idempotent and the three categories exist.
- [x] Soft-deleted records are absent from list, detail, and tree.

### Workflow and UI checks

- [x] Tree route uses the approved framework surfaces.
- [x] Default category is `Lingkungan`; category order is preserved.
- [x] First load shows expected records and labels.
- [x] Root and child creation enforce level rules.
- [x] Level 3 has no add-child action.
- [x] Edit and delete remain on the intended row surface.
- [x] Reload after create, update, and recursive delete shows the correct tree.
- [x] Failed writes keep the form open and show an API error.
- [x] Browser evidence records URL, surface, action, temporary ID, and result.

### Independent verification

- [x] Worksheet state is `DONE` after verifier `PASS` and no implementation step is active.
- [x] `$verify-ads-hk-module` reviewed the plan, design, diff, legacy evidence,
      checks, seed, and browser journey.
- [x] Verifier verdict is `PASS`.

### Final evidence

- [x] Focused API tests pass.
- [x] Focused web tests pass.
- [x] API type-check passes; focused web source tests and lint pass. Full web package type-check has a known unrelated framework union failure.
- [x] Focused API and web lint pass.
- [x] Seed smoke passes.
- [x] `git diff --check` passes.
- [x] `Reused`, `Searched`, and `Gap` are reported.
- [x] No unchecked item remains.
