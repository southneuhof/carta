# Master tools worksheet

- State: `VERIFY`
- Feature: `master-tools`
- Folder: `plans/094-build-master-tools/`
- Design: `plans/094-build-master-tools/design.md`
- Active plan: `02-build-tools-types.md`
- Next action: `Resolve the shared framework type-check blocker or get approval to leave it open`
- Read boundary: `apps/api`, `apps/web`, `docs`, `plans`, `/Users/gamer/Documents/projects/ads-hk-legacy`
- Write boundary: `plans/094-build-master-tools/`
- Last result: `Both modules pass focused API/web checks and the authenticated browser create/detail/edit flow. Static reports pass. Independent run reports fail only at the shared framework TS2590 type ceiling.`
- Last evidence: `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/tools-types.ts:3-28`; `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/ToolsTypes.php:26-30`; `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/migrations/2024_07_31_174000_create_tools_types.php:14-22`
- Blocker: `apps/web type-check fails in packages/is-vue-framework/src/components/views/{DetailView,FormView,ListView}.vue with TS2590; user directed to skip this unrelated framework fix.`

## Discovery evidence ledger

| Question | Evidence path and symbol/line | Result | Status |
|---|---|---|---|
| Identity and fields | Legacy `ToolsBrands.php:17-30`; `ToolsTypes.php:17-30`; migrations `create_tools_brands.php:14-22`, `create_tools_types.php:14-22`; frontend configs `tools-brands.ts:3-27`, `tools-types.ts:3-28` | Both use `name`, `category_code`, `description`, `active`, audit fields. Approved decision omits the stale `tools-types` frontend `code` field. | FOUND |
| Legacy labels and behavior | Legacy configs `tools-brands.ts:2-32`, `tools-types.ts:2-33`; views `tools-brands.vue:8-37`, `tools-types.vue:7-36`; menu `menu.ts:68-82` | Standard CRUD. Two category filters: `Alat Berat`, `Alat Ukur/Uji`. Titles: `Merk Alat Berat & Alat Ukur/Uji`, `Jenis Alat Berat & Alat Ukur/Uji`. | FOUND |
| Relation or child owner | Legacy models `ToolsBrands.php:89-129`, `ToolsTypes.php:89-129`; `BrandSeries.php:96-129` | Neither module owns a child relation. `BrandSeries` consumes both identifiers. | NOT NEEDED |
| Lookup consumer or dependency | Legacy configs `heavy-equipments.ts:125-138`, `measuring-instruments.ts:111-124`, `brand-series.ts:4-30` | Both are lookup sources for equipment, instruments, and brand series. | FOUND |
| Workflow or custom write | Legacy models `ToolsBrands.php:131-159`, `ToolsTypes.php:131-159` | No workflow or custom write. | NOT NEEDED |
| API permission realm and verbs | Legacy model CRUD flags `ToolsBrands.php:21-25`, `ToolsTypes.php:21-25`; current simple module pattern `plans/091-build-emergency-simulation-tools.md:22-25` | Six standard `system` permissions per module. | FOUND |
| Route and navigation owner | Legacy menu `menu.ts:68-82`; current navigation pattern `plans/091-build-emergency-simulation-tools.md:18-25`; current exact search found no owner | New master-data routes. Brands and types stay in the `Master` / `Data` group, with legacy order `tools-types` then `tools-brands`. | FOUND |
| Seed and reload requirement | Legacy seeder search under `database/seeders` returned no `tools_brands` or `tools_types` result; legacy app-config JSON files are empty | No legacy seed records. Browser checks need temporary records only. | FOUND |
| Framework or UI gap | Current `projects/index.route.vue:1-39`; `toll-causes-accidents/index.route.vue:1-31`; current emergency CRUD routes/resources | Standard CRUD surfaces plus `ChipFilter` for the legacy category-only list tabs. | FOUND |

## Plan map

| Plan | Scope | Depends on | Status | Evidence |
|---|---|---|---|---|
| `01-build-tools-brands.md` | `master/tools-brands` | `02-build-tools-types.md` | VERIFY | `design.md`, `tools-brands.module.json`, focused checks, browser |
| `02-build-tools-types.md` | `master/tools-types` | `none` | VERIFY | `design.md`, `tools-types.module.json`, focused checks, browser |

## Cross-plan blockers and decisions

- User decision: omit the stale `tools-types` frontend `code` field because the legacy backend does not persist it.
- User decision: skip the shared framework type fix because the failure is outside these module owners.
