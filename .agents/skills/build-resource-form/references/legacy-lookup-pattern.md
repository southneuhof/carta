# Legacy lookup pattern

Use this reference to preserve behavior, not legacy implementation code.

## Verified PTS example

The legacy PTS form is in:

`/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/qhsse-pts.ts`

It uses separate lookup endpoints and sends dependencies as query parameters:

| Field | Endpoint | Server query values |
| --- | --- | --- |
| Division | `divisions` | active rows, page, limit, search |
| Project | `projects` | `division_id` |
| PTS work category | `pts-work-categories` | active rows, page, limit, search |
| Work-item category | `work-items` | `project_id`, `level=1`, `hide_child_data_work_items=true` |
| Work item | `work-items` | `level_1_id`, `bottom_level=true` |
| Root cause | `root-causes` | active rows and search |

The legacy lookup component is in:

`/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/components/inputs/Lookup.vue`

It sends `page`, `search`, and dependency values to `services.dataset`. The backend dataset service applies database filters, search, sorting, limit, and offset:

`/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Services/Crud/Dataset.php`

Complex work-item rules are applied by the backend model:

`/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/WorkItems.php`

## Current framework mapping

Use these current files to understand the transport path:

- `packages/is-vue-framework/src/components/composites/form-inputs/LookupInput.vue` merges lookup search with field `searchParameters` and uses a paginated `Table`.
- `apps/web/src/framework/hono/actions.ts` merges `searchParameters` with table `query` and sends them to the list endpoint.
- A normal resource `list` action therefore receives dependency values, search, page, and limit without a custom client filter.
- A normal resource `detail` action hydrates one selected scalar ID.

## Prohibited PTS anti-pattern

Do not copy the current pattern in these files:

- `apps/web/src/routes/(authenticated)/quality/pts/pts.actions.ts`
- `apps/api/src/routes/qhsse-pts/qhsse-pts.routes.ts`
- `apps/api/src/routes/qhsse-pts/qhsse-pts.service.ts`

The `/qhsse-pts/lookups` endpoint returns several collections in one payload. The client then applies division, hierarchy, leaf, and search filters. It also loads the full payload to find one detail row. This design breaks server pagination and makes response size grow with unrelated data.

Replace this pattern with the existing domain resources or focused list and detail endpoints. Remove the obsolete combined endpoint when no caller needs it. Do not keep a compatibility path.

## Review questions

For every lookup, answer all questions with verified code or browser evidence:

1. Which domain endpoint serves it?
2. Which permission scope is in its database query?
3. Which parent values constrain it?
4. Where are search and hierarchy rules applied in SQL?
5. Where are limit and offset applied?
6. Which detail endpoint hydrates an existing selected ID?
7. Can the frontend delete all response `.filter()`, `.find()`, and tree traversal code?

If question 7 has the answer "no," the lookup boundary is not complete.
