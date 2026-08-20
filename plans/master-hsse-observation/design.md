# Master HSSE observation design

- Status: `APPROVED`
- Approved source: User approval in the task conversation on 2026-08-20
- Legacy root: `/Users/gamer/Documents/projects/ads-hk-legacy`
- Feature folder: `/Users/gamer/Documents/projects/ads-hk/plans/master-hsse-observation/`

## Goal

Build the authenticated `master/hsse-observation` module. It owns the finding
criteria, finding types, finding categories, and finding causes used by HSSE
observation forms and lookup consumers.

Keep the legacy page title, labels, hierarchy, default negative finding
criteria, and resource names. Do not build the separate observation reporting
workflow in this module.

## Legacy contract

The direct legacy page is:

`/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/hsse-observation/hsse-observation.vue`

Its child surface is:

`/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/hsse-observation/layouts/FindingTypes.vue`

Required visible text:

- `Kriteria Temuan Observation`
- `Jenis Temuan`
- `Kategori Penyebab`
- `Penyebab Temuan`
- `Negatif`
- `Positif`

Finding Types are filtered by `finding_criteria_code`. The legacy page uses
`Negatif` / `negative` by default. Finding Categories are filtered by
`finding_type_id` and Finding Causes are filtered by `finding_category_id`.

The observation reporting config is also a lookup consumer and uses the exact
labels `Kriteria Temuan`, `Jenis Temuan`, `Kategori Penyebab`, and `Penyebab`.

## Permission contract

Do not create one shared HSSE permission family. Keep one family for each
legacy resource ID:

- `hsse-observation` — menu visibility
- `finding-criteria` — lookup owner and its legacy CRUD family
- `finding-types` — its own CRUD family
- `finding-categories` — its own CRUD family
- `finding-cause` — its own CRUD family

The current API action vocabulary uses `list` and `detail`. These are the
framework names for legacy `lookup` and `show`. They do not merge the resource
families or change their resource IDs.

Each resource has the current six entries:

`view`, `list`, `detail`, `create`, `update`, and `delete` with the resource
suffix above. The web route uses the matching `view-*`, `create-*`,
`update-*`, and `delete-*` entries.

## Data model

Use text UUID IDs and the existing audit-field pattern. Keep the legacy table
names and reference shape:

- `finding_criteria`: `id`, `name`, nullable unique `code`, nullable
  `description`, `active`, audit fields, timestamps.
- `finding_types`: `id`, required `finding_criteria_code` referencing
  `finding_criteria.code`, `name`, nullable unique `code`, `display_order`,
  nullable `description`, `active`, audit fields, timestamps.
- `finding_categories`: `id`, required `finding_type_id`, `name`, unique
  `code`, `display_order`, nullable `description`, `active`, audit fields,
  timestamps.
- `finding_cause`: `id`, required `finding_category_id`, `name`, unique
  `code`, nullable `description`, `active`, audit fields, timestamps.

Define Drizzle relations for all three parent links. API list, detail, and
returned create/update records include named relation objects. Scalar IDs and
codes remain the write fields. The API owns relation display metadata.

Sort Finding Types and Finding Categories by `display_order`, then `name`.
Keep `display_order` as server data, not a new form control.

## API contract

Register four standard resource models:

- `/finding-criteria`
- `/finding-types`
- `/finding-categories`
- `/finding-cause`

Each model exposes `list`, `detail`, `create`, `update`, and `delete` with
authenticated, resource-specific permission checks.

List queries support the legacy parent filters:

- Finding Types: `findingCriteriaCode`
- Finding Categories: `findingTypeId`
- Finding Causes: `findingCategoryId`

Validate required parent records, unique codes, trimmed names, and active
lookup records. Return parent relation objects in all read and write
responses. Do not add a custom workflow or change the observation reporting
contract.

Seed Finding Criteria and Finding Types from the legacy `S20FindingCriteria`
contract. The seed must be idempotent and keep exact names, codes, and display
order. Do not invent category or cause records because the direct legacy
category insert block is not active.

## Web contract

Use the standard nested CRUD pattern:

- `/master-data/hsse-observation` — Finding Types list.
- `/master-data/hsse-observation/create`, `/:findingTypeId/detail`, and
  `/:findingTypeId/edit` — Finding Types CRUD.
- `/:findingTypeId/detail/categories` and its standard create, detail, and
  edit child routes — Finding Categories scoped to the Finding Type.
- `/:findingTypeId/detail/categories/:findingCategoryId/detail/causes` and
  its standard create, detail, and edit child routes — Finding Causes scoped to
  the Finding Category.

Use `ListView`, `DetailView`, `FormView`, `defineFields`, and `defineResource`.
Use route-local `Tabs` only for child collection navigation.

The main list uses the standard `ChipFilter` pattern. Load Finding Criteria
from the `finding-criteria` list owner, keep legacy order, render `Negatif` and
`Positif`, select `Negatif` by default, and set the list query with
`findingCriteriaCode`. Clear the old parent query before applying a new chip
value and reset the page to 1.

Use computed `read` projections for relation names. Do not fetch relation
labels in a frontend-only map.

Navigation stays in the `HSSE` group with title `Kriteria Temuan Observation`.
The reporting flow remains out of scope.

## Reuse decision

- Reused: `ListView`, `DetailView`, `FormView`, `ChipFilter`, `Tabs`,
  `defineFields`, `defineResource`, the nested `permit-category-apd` route and
  resource pattern, and the current relation-backed API pattern.
- Searched: `apps/web/src/routes/(authenticated)/master-data/projects/index.route.vue`,
  `apps/web/src/routes/(authenticated)/master-data/tools-types/`,
  `apps/web/src/routes/(authenticated)/master-data/permit-category-apd/`,
  `apps/api/src/routes/permit-apd/`, `apps/api/src/routes/project-vendors/`,
  `apps/api/src/authorization/catalog.ts`, and the web architecture guide.
- Gap: None. Do not change `@southneuhof/is-vue-framework`.

## Browser acceptance journey

Use seeded Finding Criteria and Finding Types. Create marked temporary Finding
Category and Finding Cause records, reload after each write, edit one record,
then delete the temporary records and reload to confirm removal. Verify:

1. The route opens with `Negatif` selected.
2. The Finding Types list changes when `Positif` is selected.
3. A Finding Type detail opens its category child collection.
4. A category detail opens its cause child collection.
5. Create, update, and delete use the correct resource permissions.
6. Temporary records are absent after cleanup and reload.

The independent module verifier must return `PASS` before this feature is
complete.
