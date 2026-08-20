# Law reference items design

- Status: `APPROVED`
- Approved source: `docs/superpowers/specs/2026-08-20-law-reference-items-design.md`
- Legacy root: `/Users/gamer/Documents/projects/ads-hk-legacy`

## Goal

Build the authenticated `master/law-reference-items` module. It manages the
HSSE law reference tree and supplies law item records to lookup consumers.
Keep the legacy labels and category records.

## Legacy contract

The legacy page is
`/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/law-reference-items/law-reference-items.vue`.
It shows three category tabs, one recursive tree, and create, update, and
delete actions.

Required visible text:

- `Master Regulasi & Perundangan HSSE`
- `Undang-Undang`
- `Nama`, `Tipe`, `Status`
- `Tambah`
- `Berlaku`, `Tidak Berlaku`
- `Reference`, `Applicable`

Category seed records are:

| Name | Code |
|---|---|
| Lingkungan | `environment` |
| K3 | `k3` |
| Pengamanan | `security` |

The tree supports levels 1, 2, and 3. A level 1 item has a type. Child
items do not show or write type. Level 3 items cannot receive children.

## Data model

Add `law_reference_categories` with `id`, `name`, `code`, `description`,
`active`, and audit fields. Seed the three fixed category records with an
idempotent upsert.

Add `law_reference_items` with:

- `id`
- `law_reference_category_code`
- `name`
- `level`
- `type` (`reference` or `applicable`, nullable for children)
- `parent_id` (nullable self-reference)
- `active`
- audit fields
- `deleted` and deletion audit fields for recursive soft delete

The API select schema includes named `category` and `parent` relation objects.
Scalar IDs and codes remain the write contract.

## API contract

Use the standard item actions:

- `GET /law-reference-items/list` — flat records for lookup consumers and filters.
- `GET /law-reference-items/detail/:id` — one record with relation metadata.
- `POST /law-reference-items/create` — create a root or child.
- `PATCH /law-reference-items/update/:id` — update name, type where valid, or active.
- `DELETE /law-reference-items/delete/:id` — recursively soft-delete the item and descendants.

Add one custom route:

- `GET /law-reference-items/tree?lawReferenceCategoryCode=environment` — category metadata and nested tree.

The API validates:

- category code exists and is active;
- name is not empty;
- level is 1, 2, or 3;
- a parent belongs to the same category;
- a child level is exactly parent level plus one;
- a level 1 item has a valid type;
- a child has no type;
- a level 3 item cannot receive a child;
- update cannot create a parent cycle;
- soft-deleted records are excluded from normal reads.

Use authenticated system permissions for `list`, `detail`, `create`, `update`,
and `delete`. The web resource uses `view`, `create`, `update`, and `delete`
permissions for route and action visibility.

The current repository has no law fulfillment table. Do not add one. The
module performs recursive item soft delete only.

## Web contract

Add the authenticated route `/master-data/law-reference-items`.

- Load categories and the selected tree from the API.
- Use `ChipFilter` for category selection, keep legacy order, and default to `Lingkungan`.
- Use `TreeTable` with `Nama`, `Tipe`, `Status`, and row actions.
- Use `DialogForm` for root create, child create, and edit.
- Show add-child only for levels 1 and 2.
- Show `Berlaku` and `Tidak Berlaku` status chips.
- Reload the selected tree after create, update, and delete.
- Show API errors and keep a failed form open.

The resource defines standard list, detail, create, update, and delete actions.
The route uses those functions plus the custom `loadTree` action.

Navigation is under the `Undang-Undang` group with title
`Regulasi & Perundangan HSSE` and icon `folder`.

## Reuse decision

- Reused: framework `TreeTable`, `DialogForm`, `Form`, `ChipFilter`, `Card`,
  `Chip`, `Button`, and `Icon`; the route-local tree CRUD pattern in
  `apps/web/src/routes/(authenticated)/master-data/work-items/index.route.vue`.
- Searched: `packages/is-vue-framework/src/components/core/TreeTable.vue`,
  `packages/is-vue-framework/src/components/composites/DialogForm.vue`, the
  work-items resource and API, the emergency simulation resource, and the web
  architecture guide.
- Gap: `None`. Do not change `packages/is-vue-framework`.

## Verification

Add focused API tests for permissions, validation, tree nesting, lookup
filters, and recursive soft delete. Add focused web tests for route
registration, navigation, resource actions, category selection, and level-3
child restrictions.

Use the module-scoped commands in the numbered plan, `git diff --check`, and
one authenticated Codex browser flow:

1. Open the route and confirm the default category and tree.
2. Create a root item, reload, and confirm it is visible.
3. Create a child and confirm its nesting and actions.
4. Edit the item and reload.
5. Delete the root and confirm descendants are absent after reload.
6. Confirm lookup consumers can filter by category, type, and level.

Temporary browser records must be deleted and the route reloaded to confirm
removal. The independent module verifier must return `PASS` before the plan is
marked complete.
