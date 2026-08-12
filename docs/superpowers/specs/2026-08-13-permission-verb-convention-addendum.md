# Permission Verb Convention Addendum

- **Status:** Approved addendum
- **Date:** 2026-08-13
- **Scope:** Remaining authorization catalog modules after the PTS owner-list
  change
- **Depends on:** [Owner List Sources](./2026-08-13-owner-list-sources-design.md)
- **Related:** [RBAC Parity Design](../../architecture/rbac-parity-design.md)

## Purpose

Apply the same verb rule to every remaining module. Do not implement this
addendum in the PTS owner-list change.

## Rule

| Code | Realm | Meaning |
| --- | --- | --- |
| `view-*` | system | Menu and typed admin URL |
| `list-*` | system | `GET …/list` |
| `detail-*` | system | `GET …/:id` |
| `create-*`, `update-*`, `delete-*` | system | Owner writes |
| Workflow actions | project | Per assigned project |

A lookup needs `list-*` and `detail-*`. Seed them together.

`manage-*` is not a verb. Split it into the write verbs the routes already
have. Do not add `delete-*` when the API cannot delete.

A system write still cannot touch a project outside the caller's
assignments. The capability opens the verb. The assignment opens the row.

## Remaining Modules

| Module | Today | Target |
| --- | --- | --- |
| users | `view` / `create` / `update` plus `list` / `detail` from the owner-list change | add `delete` only if the API deletes |
| roles | `view` / `manage` | `view` / `list` / `detail` / `create` / `update` / `delete` |
| permissions | `view` / `view-role-permissions` / `manage-role-permissions` | same verbs; keep the role-mapping module separate |
| system-role-assignments | `view` / `manage` | `view` / `list` / `detail` / `create` / `update` / `delete` as the routes need |
| project-role-assignments | `view` / `manage` | same |
| business-categories | `view` / `manage` | split like divisions |
| uoms | `view` / `manage` | split like divisions |
| number-variables | `view` only | add `list` / `detail` |
| number-configs | `view` / `manage` | split like divisions |

The PTS owner modules and PTS itself are not in this addendum. They are in
the owner-list design.

## Open Menus

Dashboard and To Do stay open (`permission: null`) until those modules have
a real `view-*`.

## Seed

Give `list-*` and `detail-*` to every current role that has the matching
`view-*`. Give the write verbs to every current role that has `manage-*`.

Do not invent operational roles in this addendum.

## Tests

Check observable behavior for each converted module:

- Menu uses `view-*`.
- List uses `list-*`. Detail uses `detail-*`.
- Missing `list-*` is `403`.
- A typed admin URL without `view-*` is blocked.
- Writes use `create-*`, `update-*`, or `delete-*`.

Do not add a broad matrix that repeats the PTS owner-list tests.
