# Law reference items worksheet

- State: `DONE`
- Feature: `093-build-law-reference-items`
- Modules: `master/law-reference-items`
- Grouping reason: `One authenticated tree workflow and one resource owner.`
- Folder: `plans/093-build-law-reference-items/`
- Design: `plans/093-build-law-reference-items/design.md`
- Active plan: `plans/093-build-law-reference-items/01-build-law-reference-items.md`
- Next action: `None. Module verifier returned PASS.`
- Read boundary: `Approved design, direct legacy owners, current work-items and emergency-simulation patterns, and plan-scoped source files.`
- Write boundary: `Plan-scoped source files and the feature folder worksheets.`
- Last result: `Independent verifier returned PASS. Implementation, focused API/web checks, seed, lint, and authenticated browser journey passed. Temporary root and child records were deleted and the page reload confirmed removal.`
- Last evidence: `pnpm --filter @southneuhof/api test:focused -- src/routes/law-reference-items/law-reference-items.routes.spec.ts; focused web specs; browser URL http://localhost:5173/master-data/law-reference-items`
- Blocker: `Full web package type-check still reports the pre-existing framework union error; removing this module from API registration reproduces it.`

## Discovery evidence ledger

| Question | Evidence path and symbol/line | Result | Status |
|---|---|---|---|
| Identity and fields | `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/migrations/2024_07_31_182635_create_law_reference_items.php:14-25`; `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/LawReferenceItems.php:28-31,89-100` | Item identity, category code, name, level, nullable type, parent, active, audit, and soft-delete fields. Category has code, name, description, active, and audit fields. | FOUND |
| Surface field placement and filters | `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/law-reference-items/law-reference-items.vue:79-148`; `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/LawReferenceItems.php:34-70` | Tree list shows `Nama`, `Tipe`, `Status`; root create shows name/type/active; child create and child edit hide type; list filters by category, type, and level. | FOUND |
| Legacy labels and behavior | `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/law-reference-items/law-reference-items.vue:67-146` | Exact title, category labels from seed, `Undang-Undang`, `Tambah`, `Berlaku`, `Tidak Berlaku`, `Reference`, `Applicable`; depth ends at level 3. | FOUND |
| Relation or child owner | `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/LawReferenceItems.php:113-129,168-173`; `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/migrations/2024_07_31_182635_create_law_reference_items.php:16-21` | Category relation is owned by `law_reference_categories`; items own recursive children through `parent_id`. | FOUND |
| Lookup consumer or dependency | `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/work-unit-inputs/ibprp/_layouts/_layouts/WorkItemIBPRPLeaf.vue:198-205`; `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/work-unit-inputs/ibprp/_layouts/IBPRPDetailUnder.vue:166-174` | IBPRP consumes the owner list with category, type, and level filters. Current application has no matching fulfillment table or consumer route. | FOUND |
| Workflow or custom write | `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/law-reference-items/law-reference-items.vue:79-148`; `docs/superpowers/specs/2026-08-20-law-reference-items-design.md:67-82` | Standard item writes plus one approved custom tree read; recursive soft delete is the approved delete policy. | FOUND |
| API permission realm and verbs | `apps/api/src/authorization/catalog.ts:400-410`; `apps/api/src/routes/emergency-simulation-topics/emergency-simulation-topics.ts:9-13`; `docs/superpowers/specs/2026-08-20-law-reference-items-design.md:82-90` | Approved `system` module with `view`, `list`, `detail`, `create`, `update`, and `delete` law-reference permissions. | FOUND |
| Route and navigation owner | `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/menu.ts:140-145`; `apps/web/src/manifest/navigation.ts:30-55`; `docs/superpowers/specs/2026-08-20-law-reference-items-design.md:103-120` | New route `/master-data/law-reference-items`; navigation under `Undang-Undang`, title `Regulasi & Perundangan HSSE`, icon `folder`. | FOUND |
| Seed and reload requirement | `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/seeders/S08LawReferenceCategoriesSeeder.php:19-34`; `docs/superpowers/specs/2026-08-20-law-reference-items-design.md:16-25,116-120` | Seed `Lingkungan/environment`, `K3/k3`, and `Pengamanan/security` idempotently; default category is `environment`; reload tree after every write. | FOUND |
| Framework or UI gap | `apps/web/src/routes/(authenticated)/master-data/work-items/index.route.vue:4,143-189`; `packages/is-vue-framework/src/index.ts:5`; `docs/superpowers/specs/2026-08-20-law-reference-items-design.md:123-129` | Reuse `TreeTable`, `DialogForm`, `Form`, `ChipFilter`, and base components. No framework gap. | FOUND |

## Plan map

| Plan | Scope | Depends on | Status | Evidence |
|---|---|---|---|---|
| `01-build-law-reference-items.md` | Database, API, permissions, seed, resource, tree route, navigation, focused checks, browser, verifier | `Approved design` | DONE | `plans/093-build-law-reference-items/design.md` |

## Cross-plan blockers and decisions

- None.
