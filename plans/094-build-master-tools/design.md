# Master tools design

## Approval and scope

- Requested feature: `master/tools-brands` and `master/tools-types`.
- Shape: bounded standard CRUD for two lookup-source resources.
- Legacy reference: `/Users/gamer/Documents/projects/ads-hk-legacy`.
- Approved parity decision: omit `code` from `tools-types`. The legacy frontend
  config shows it, but the legacy model and migrations do not store it.
- No framework package changes and no compatibility routes.

## Business contract

Both resources store tool data for two categories:

| Key | Visible label |
|---|---|
| `heavy-equipments` | `Alat Berat` |
| `measuring-instruments` | `Alat Ukur/Uji` |

Brands:

- Title: `Merk Alat Berat & Alat Ukur/Uji`
- Fields: `name`, `categoryCode`, `description`, `active`

Types:

- Title: `Jenis Alat Berat & Alat Ukur/Uji`
- Fields: `name`, `categoryCode`, `description`, `active`
- `code` is not part of the new contract.

Field labels are `Nama`, `Kategori`, `Deskripsi`, and `Status`. `name` and
`categoryCode` are required. `active` defaults to true. `description` is
optional.

The list starts with `Alat Berat`. The category strip has only the two legacy
choices and filters the same list collection by `categoryCode`; it has no
`all` choice.

## Technical contract

- Use the simple master-data manifest pipeline.
- Use text UUID identifiers, matching current master-data modules.
- Use six `system` permissions per module: view, list, detail, create, update,
  and delete.
- API list, detail, create, update, and delete are standard authenticated
  resource actions.
- The API owns category validation. Category values are fixed non-database
  options, so the web form uses a local select source.
- Neither resource owns a child relation or workflow. `heavy-equipments`,
  `measuring-instruments`, and `brand-series` consume these resources as lookup
  sources.
- No seed records are required.

## UI contract

- Routes are `/master-data/tools-types` and `/master-data/tools-brands`, with
  standard create, detail, and edit child routes.
- Navigation is in `Master` / `Data`, with `tools-types` before `tools-brands`,
  and exact legacy titles.
- Use `ListView`, `DetailView`, `FormView`, `defineResource`, `defineFields`,
  and `ChipFilter`.
- List and detail show `Nama`, `Deskripsi`, and `Status`. Forms show
  `Kategori`, `Nama`, `Deskripsi`, and `Status`.
- Use the framework standard row actions and delete flow.

## Evidence

- Legacy field and behavior: `frontend-ads-vuejs/src/app/configs/tools-brands.ts:2-32`,
  `frontend-ads-vuejs/src/app/configs/tools-types.ts:2-33`, and the two legacy
  view files.
- Legacy persistence: `backend-ads-laravel/app/Models/ToolsBrands.php:17-117`,
  `ToolsTypes.php:17-117`, and the two create migrations.
- Legacy consumers: `frontend-ads-vuejs/src/app/configs/heavy-equipments.ts:125-138`,
  `measuring-instruments.ts:111-124`, and `brand-series.ts:4-30`.
- Current UI pattern: `apps/web/src/routes/(authenticated)/master-data/projects/index.route.vue`
  and `toll-causes-accidents/index.route.vue`.
- Current CRUD pattern: `plans/091-build-emergency-simulation-tools.md` and its
  generated API and web owners.

## Reuse record

- Reused: simple master-data scaffold and integration pipeline; standard CRUD
  route/resource pattern; `ChipFilter` for a list-only category filter.
- Searched: current route/resource patterns, framework architecture, framework
  README, legacy config/model/migration/menu/consumer files.
- Gap: none.
