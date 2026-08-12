# Owner List Sources

- **Status:** Approved design
- **Date:** 2026-08-13
- **Scope:** PTS form sources, owner `list` / `detail` contracts, and the
  permission verbs on the PTS owner modules
- **Related:** [RBAC Parity Design](../../architecture/rbac-parity-design.md),
  [Manual PTS Parity](./2026-08-12-manual-pts-parity-design.md),
  [Resource Form Guideline](./2026-08-12-resource-form-guideline-design.md)

## Purpose

A form field that needs rows from another module calls that module's `list`
and `detail`. It does not call `/lookup`. It does not call a consumer-owned
option route.

This design removes `qhsse-pts/create-options/*`. It makes the PTS form use
the same owner resources as the rest of the app. It also splits menu, list,
detail, and write permissions so a PTS creator can fill a lookup without
opening the owner admin screen.

The remaining catalog modules use the same verb rule in a later addendum.
Do not implement that addendum in this change.

## Problems in the Current Cleanup

The current working tree moved PTS lookups off a single `/lookup` dump. That
part is correct. The new routes are not:

- 14 list and detail routes live under `/qhsse-pts/create-options/*`
- PTS builds local option resources instead of importing owner resources
- `GET /divisions/list` still needs `view-divisions`, so a PTS creator cannot
  use the owner list
- project menus use `permission: null`
- `view-projects` and `view-qhsse-pts` mix menu meaning with data scope
- `manage-*` hides create, update, and delete

Legacy PTS called the owner modules (`divisions`, `projects`,
`pts-work-categories`, `work-items`, `root-causes`). The work-items screen
already does that with `source: divisions` and `source: projects`.

## Design Principles

1. The owner module owns `list` and `detail`.
2. A parent form may pass `searchParameters`. It does not declare the owner
   query contract.
3. `/lookup` is not a source. A consumer-owned option list is not a source.
4. `view-*` is a menu and admin-route flag.
5. `list-*` gates `GET …/list`. `detail-*` gates `GET …/:id`.
6. Owner create, update, and delete are system capabilities. A project
   assignment is the row scope.
7. Only workflow writes stay in the project realm.
8. Default project coverage is any active assignment. There is no
   `access-project` code.
9. A permission query may only narrow that set.

## Ownership

PTS does not own lookup data.

| PTS field | Owner resource |
| --- | --- |
| Division | `divisions` |
| Project | `projects` |
| PTS work category | `pts-work-categories` |
| Work-item category and leaf | `work-items` |
| Root causes | `root-causes` |
| Project vendor | `project-vendors` |
| SOM / implementation user | `users` |

Delete:

- `/qhsse-pts/create-options/*` routes
- PTS option service helpers
- `ptsCreateOptionResource`, `ptsCreateOptionActions`, and
  `ptsCreateOptionResources`

## Permissions

One meaning for every module. Realm tells you the scope, not a second
meaning.

| Code | Realm | Meaning |
| --- | --- | --- |
| `view-*` | system | Menu and typed admin URL |
| `list-*` | system | `GET …/list` |
| `detail-*` | system | `GET …/:id` |
| `create-*`, `update-*`, `delete-*` | system | Owner writes |
| PTS workflow codes | project | Create, update, delete, disposition, close, and the other PTS actions |

A lookup needs `list-*` and `detail-*`. Seed them together. A role with
`view-*` and no `list-*` / `detail-*` is a bad seed. The server does not treat
`view-*` as a substitute for `list-*`.

`/me` still returns system permissions only. The menu reads that set. Do not
add a derived project-view summary.

### Coverage

- A system `list-*` is a capability. It does not open every project.
- Default list: every project in any active assignment.
- PTS may send `permission=create-qhsse-pts`. The owner list uses
  `accessibleProjectIds(caller, that code)`.
- The caller must hold that permission. If they do not, the list is empty.
- A missing system `list-*` is `403`.
- An unknown permission or a system permission in that query is a validation
  error.

Do not send more than one permission. Intersection with a second coverage
code is a seed footgun: the lookup can hide a project that the write still
accepts.

### Catalog changes in this work

Apply the verb split to the PTS owner modules and to PTS:

- divisions
- pts-work-categories
- root-causes
- users
- projects
- work-items
- project-vendors
- qhsse-pts

Also:

- Move `view-projects`, `view-work-items`, `view-project-vendors`, and
  `view-qhsse-pts` to the system realm.
- Move `create-projects` onto the `projects` module.
- Remove the empty `project-creation` module.
- Split `manage-*` on these modules into `create-*`, `update-*`, and
  `delete-*`.
- Remove `show-qhsse-pts`. PTS detail uses `detail-qhsse-pts`.
- Keep PTS workflow codes in the project realm.

After this change, the project realm on the owner modules is empty. Only
`qhsse-pts` stays in the project realm.

### Seed

The super-administrator role gets every system code.

The project-administrator role gets every remaining project (PTS workflow)
code.

Do not invent a second operational role in this change. A later role can
have `list-*` and `detail-*` without `view-*`.

The current seed deactivates catalog codes that no longer exist.

## Query Contract

The owner list owns the query. PTS only sends `searchParameters`.

Shared keys on every owner list:

| Key | Meaning |
| --- | --- |
| `page`, `limit`, `search` | already shared |
| `permission` | optional. Must be a project permission the caller holds. Narrows rows through `accessibleProjectIds`. |

### What PTS sends

| Field | Source | searchParameters |
| --- | --- | --- |
| Division | `divisions` | `permission=create-qhsse-pts`, `active=true` |
| Project | `projects` | `permission=create-qhsse-pts`, `divisionId`, `active=true` |
| PTS work category | `pts-work-categories` | `active=true` |
| Work-item category | `work-items` | `projectId`, `rootOnly=true`, `active=true` |
| Work item | `work-items` | `projectId`, `workItemCategoryId`, `leafOnly=true`, `active=true` |
| Root causes | `root-causes` | `active=true` |
| Project vendor | `project-vendors` | `projectId`, `active=true` |
| SOM / implementation user | `users` | `projectId`, `statusCode=active` |

No permission query on categories, root causes, vendors, or users. The form
is already a PTS create or action. The owner list does not learn PTS rules.

### Owner lists that need new filters

- `divisions`: `permission` keeps divisions that contain at least one project
  in that coverage.
- `projects`, `work-items`, `project-vendors`: `permission` replaces the
  current hard-coded `view-*` coverage.
- `work-items`: `rootOnly` (no parent), `leafOnly` (has parent, no child),
  `workItemCategoryId` (descendants of that root). These are not column
  equality.
- `users`: `projectId` keeps users whose assignment covers that project.

Admin screens send none of these. They get the full `list-*` set, still
limited by assignment for project-owned rows.

`active=true` is a PTS filter, not an owner default. The admin list still
shows inactive rows.

## Web Binding

PTS imports the owner resources and uses them as lookup sources.

```ts
form: {
  renderer: 'lookup',
  source: divisions,
  props: { pick: 'id', view: 'name', required: true },
  behavior: {
    props: () => ({ searchParameters: { permission: 'create-qhsse-pts', active: true } }),
  },
}
```

Project, work items, vendors, and users keep the same shape. They add
`divisionId`, `projectId`, `rootOnly`, and `leafOnly` as they do now.

Do not put `list-*` on the web resource action. The resource `permission` is
the admin route guard. That stays `view-*`.

| Layer | Code |
| --- | --- |
| Menu and typed admin URL | `view-divisions` |
| `GET /divisions/list` | `list-divisions` |
| Lookup `source: divisions` | calls `list` / `detail` run functions. It does not use the resource permission. |

A PTS creator with `list-divisions` and `detail-divisions` can fill the
field. They cannot open `/master-data/divisions`.

Menus that are open today change to system `view-*`:

- Projects → `view-projects`
- Work items → `view-work-items`
- Manual PTS → `view-qhsse-pts`

## PTS Module

PTS follows the same table as the owners.

| Code | Realm | Use |
| --- | --- | --- |
| `view-qhsse-pts` | system | Quality → Manual PTS menu |
| `list-qhsse-pts` | system | `GET /qhsse-pts` |
| `detail-qhsse-pts` | system | `GET /qhsse-pts/:id` |
| `create-qhsse-pts`, `update-qhsse-pts`, `delete-qhsse-pts`, disposition, close, … | project | writes and workflow |

Default PTS list: reports on any assigned project. The list does not send
`permission=create-qhsse-pts`. A viewer with an assignment on A sees A
reports even if they cannot create.

Create still checks `create-qhsse-pts` on the submitted project.

## Out of Scope

- The remaining catalog modules. See the addendum.
- A second operational role for PTS creators.
- Framework changes.
- Dashboard and To Do menu permissions.

## Tests

Check observable behavior only.

- PTS create and edit lookups call owner `list` / `detail`. No
  `/qhsse-pts/create-options`.
- Missing `list-*` on an owner list is `403`.
- `permission=create-qhsse-pts` returns only that coverage. A missing or
  system code is a validation error.
- Work-item `rootOnly`, `leafOnly`, and `workItemCategoryId` return the same
  rows the wrappers return today.
- `users?projectId=` returns users whose assignment covers that project.
- Admin list without those filters still returns the full `list-*` set.
- Menu uses `view-*`. A typed admin URL without `view-*` is blocked.
- PTS list uses `list-qhsse-pts`. Detail uses `detail-qhsse-pts`.
  `show-qhsse-pts` is gone.
- Create still checks `create-qhsse-pts` on the submitted project.

Do not add a broad test matrix for every field.

## Implementation Notes

Keep the current Sprindle list parser. Add a route-specific schema only when
the owner list needs coercion or a typed guarantee that the shared parser
does not provide.

`rootOnly`, `leafOnly`, `workItemCategoryId`, `permission`, and users
`projectId` are those cases.

A filtered source is only a user interface aid. Repeat the relationship and
permission check in the PTS write service.
