# Plan 047: Add owner list filters and gates

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` after the implementation and review pass.
>
> **Drift check (run first)**:
> `git diff --stat aa30f1d..HEAD -- apps/api/src/routes/divisions apps/api/src/routes/projects apps/api/src/routes/work-items apps/api/src/routes/project-vendors apps/api/src/routes/pts-work-categories apps/api/src/routes/root-causes apps/api/src/routes/users apps/api/src/routes/qhsse-pts apps/api/src/__tests__`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: `plans/046-split-owner-permission-catalog.md`
- **Category**: migration
- **Planned at**: commit `aa30f1d`, 2026-08-13

## Why this matters

After plan 046, the catalog has `list-*` / `detail-*`, but owner routes still
use `view-*` or hard-coded `view-projects` coverage. PTS cannot call
`/divisions/list` until those routes accept `list-divisions` and the
approved filters. This plan changes only the owner APIs. It does not delete
create-options yet, so the current PTS form still works.

## Current state

System generic lists (`packages/sprindle/src/routes/list.ts:4-14`) only
parse `listQuerySchema` and call `entity.source.list`. They do not apply
`permission`. Divisions, PTS work categories, and root causes use that
factory:

```ts
const read = [authenticated(), requirePermission('view-divisions')]
const write = [authenticated(), requirePermission('manage-divisions')]
```

`apps/api/src/routes/divisions/divisions.ts:30-31`
`apps/api/src/routes/pts-work-categories/pts-work-categories.ts:6-7`
`apps/api/src/routes/root-causes/root-causes.ts:9-10`
`apps/api/src/routes/users/users.model.ts:35-36` uses `view-users` for list
and detail.

Custom project lists already parse extra keys, but they scope with
`accessibleProjectIds(user, 'view-projects')` or the matching `view-*`:

- `apps/api/src/routes/projects/projects.ts:15,103,119,176,196`
- `apps/api/src/routes/work-items/work-items.ts:16,102,124`
- `apps/api/src/routes/project-vendors/project-vendors.ts:14,60,75`

PTS list / detail still use project codes:

- `apps/api/src/routes/qhsse-pts/qhsse-pts.service.ts:72,84,288,646`
  `qhsseOperations.detail` is `show-qhsse-pts`
  `listReports` uses `accessibleProjectIds(user, 'view-qhsse-pts')`
  `assertAccess` defaults to `view-qhsse-pts` and detail uses
  `show-qhsse-pts`

`hasProjectCoverage` and (after 046) `coveredProjectIds` live in
`apps/api/src/authorization.ts`. Use them for default project row scope.
Use `accessibleProjectIds(user, permission)` only when the query has a
project permission such as `create-qhsse-pts`.

Approved query map:
`docs/superpowers/specs/2026-08-13-owner-list-sources-design.md`
section "Query Contract".

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Division / project / work-item / vendor / user / PTS tests | `pnpm --filter @southneuhof/api test -- divisions projects work-items project-vendors users qhsse-pts project-authorization` | exit 0 |
| Type check | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| Lint | `pnpm --filter @southneuhof/api lint` | exit 0 |

If a named spec file does not exist, run the closest existing spec for that
route and add focused cases there. Do not invent a new test runner.

## Suggested implementation toolkit

- Use `.agents/skills/build-resource-form/references/backend-form-contract.md`
  for list / detail source rules.
- Copy the existing `listWhere` style from
  `apps/api/src/routes/projects/projects.ts:66-88`.
- Do not edit `packages/sprindle` unless a STOP condition says you must.

## Scope

**In scope**:

- `apps/api/src/routes/divisions/divisions.ts`
- `apps/api/src/routes/pts-work-categories/pts-work-categories.ts`
- `apps/api/src/routes/root-causes/root-causes.ts`
- `apps/api/src/routes/users/users.model.ts`
- `apps/api/src/routes/users/users.routes.ts` only if list/detail live there
- `apps/api/src/routes/projects/projects.ts`
- `apps/api/src/routes/work-items/work-items.ts`
- `apps/api/src/routes/project-vendors/project-vendors.ts`
- `apps/api/src/routes/qhsse-pts/qhsse-pts.routes.ts` (PTS list/detail
  authorize and service calls only; do not delete create-options)
- `apps/api/src/routes/qhsse-pts/qhsse-pts.service.ts` (list/detail access
  only)
- Focused API specs for those routes, including
  `apps/api/src/__tests__/project-authorization.spec.ts` and
  `apps/api/src/__tests__/qhsse-pts.spec.ts`
- A small shared query helper under `apps/api/src/` only if two or more
  owner lists need the same `permission` parse. Keep it in
  `apps/api/src/authorization.ts` or a sibling file. Do not put it in
  Sprindle.

**Out of scope**:

- Deleting `/qhsse-pts/create-options/*`
- Web resources, menus, PTS form sources
- Addendum modules (roles, uoms, business-categories, number-*)
- Changing create / update / delete request bodies

## Git workflow

- Branch: stay on the current branch unless asked
- Commit message style: `fix(api): gate owner lists with list and detail verbs`
- Do NOT push or open a PR unless asked

## Shared query rules

Parse `listQuerySchema` first. Then:

1. If `permission` is absent: system lists return the full `list-*` set.
   Project-owned rows (`projects`, `work-items`, `project-vendors`,
   `qhsse-pts`) use `coveredProjectIds(userId)`.
2. If `permission` is present: it must be a **project** `PermissionCode` the
   caller holds. Use `accessibleProjectIds(userId, permission)`. If the
   caller does not hold it, return an empty page. If the value is unknown
   or a system code, throw the module validation error.
3. Missing `list-*` / `detail-*` is `403` through `requirePermission`.
4. `active=true` is a caller filter, not a default.
5. Owner writes on system modules use `requirePermission('create-*')` and
   the matching update/delete code. For a project-owned row, also require
   `hasProjectCoverage(userId, projectId)` so a system write cannot touch a
   project outside the caller's assignments. Do **not** call
   `requireProjectRecord(..., 'update-projects')`. That helper needs a
   project-realm permission.

## Steps

### Step 1: Gate generic system owner lists

Replace `view-*` / `manage-*` authorize arrays on:

- divisions
- pts-work-categories
- root-causes
- users list / detail

Use `requirePermission('list-*')` for list, `requirePermission('detail-*')`
for detail, and `create-*` / `update-*` / `delete-*` for writes.

Divisions list must accept `permission` and `active`. When `permission` is
set, keep only divisions that contain at least one project from
`accessibleProjectIds(user, permission)`. Generic `entity.source.list`
cannot do that. Replace the divisions `list` factory with a `defineRoute`
that copies the projects list shape, or add a source wrapper on the
division entity. Prefer a local `defineRoute` in `divisions.ts` so
pts-work-categories and root-causes can stay on the factory if they only
need authorize changes plus `active` equality (already supported by
catchall).

Users list must accept `projectId` and `statusCode`. `projectId` keeps
users whose active assignment covers that project. This is not column
equality on `users`. Replace the generic users list if needed.

**Verify**: a focused request without `list-divisions` returns 403. A
request with `list-divisions` and no `permission` returns every division
the fixture can list, including one with no project.

### Step 2: Change project-owned lists to assignment coverage

In projects, work-items, and project-vendors:

- List authorize: `authenticated()` plus `requirePermission('list-*')`.
- Detail authorize: `authenticated()` plus `requirePermission('detail-*')`.
- Default `listWhere` scope: `inArray(..., coveredProjectIds(userId))`.
- If query has `permission`, use `accessibleProjectIds(userId, permission)`
  instead.
- Remove `accessibleProjectIds(user, 'view-projects')` and
  `requireProjectRecord(user, id, 'view-projects'|'manage-projects')`.
- Detail of a project outside assignment: `404`.
- Create still uses `requirePermission('create-projects')`.
- Update / delete: `requirePermission('update-projects'|'delete-projects')`
  and `hasProjectCoverage`. Same pattern on work-items and vendors.

Work-items must accept `rootOnly`, `leafOnly`, and `workItemCategoryId`:

- `rootOnly=true` → `parentId` is null
- `leafOnly=true` → has parent and no active child
- `workItemCategoryId` → descendants of that root in the same project

These are not table-column equality. Reject unknown keys that are not in
this set or in the existing reserved / column set.

Copy the descendant / leaf SQL from
`apps/api/src/routes/qhsse-pts/qhsse-pts.service.ts:526-551`. Do not leave
that logic only in PTS.

**Verify**:
`pnpm --filter @southneuhof/api test -- projects work-items project-vendors`
→ exit 0

### Step 3: Gate PTS list and detail

In `qhsse-pts.service.ts` and `qhsse-pts.routes.ts`:

- `listReports` uses `coveredProjectIds(userId)`, not
  `accessibleProjectIds(user, 'view-qhsse-pts')`.
- `assertAccess` for detail uses `hasProjectCoverage` plus
  `requirePermission` is not enough (it is system-wide). Gate the route
  with `requirePermission('detail-qhsse-pts')` and then
  `hasProjectCoverage`. Outside coverage → `404`.
- List route: `requirePermission('list-qhsse-pts')`.
- `qhsseOperations.detail` becomes `detail-qhsse-pts` only if
  `allowedProjectOperations` can accept a system code. If it cannot
  (it joins project-realm permissions), stop using that map for detail
  and derive the detail operation from the system permission plus
  coverage. Do not invent a project-realm `detail-qhsse-pts`.
- Create / update / actions still use `create-qhsse-pts`,
  `update-qhsse-pts`, and the workflow codes through
  `requireProjectRecord`.

Update `qhsse-pts.spec.ts` fixtures: grant `list-qhsse-pts` and
`detail-qhsse-pts` as **system** permissions when a test calls list or
detail through the HTTP app. Service-level `createReport` tests that only
need `create-qhsse-pts` can stay as they are.

**Verify**: `pnpm --filter @southneuhof/api test -- qhsse-pts.spec.ts` → exit 0

### Step 4: Add owner-source filter tests

Add focused cases (smallest existing spec, or a new sibling spec next to
the route):

- missing `list-*` → 403
- `permission=create-qhsse-pts` on `/divisions/list` and `/projects/list`
  returns only that coverage
- `permission=view-divisions` or an unknown code → validation error
- `/work-items/list?projectId=&rootOnly=true` and `leafOnly=true` match the
  current create-options rows
- `/users/list?projectId=` returns users whose assignment covers that
  project
- admin list without those filters still returns the broader `list-*` set

**Verify**: `pnpm --filter @southneuhof/api type-check` → exit 0
`pnpm --filter @southneuhof/api lint` → exit 0

## Test plan

Model HTTP tests after `apps/api/src/__tests__/project-authorization.spec.ts`.
Do not copy the 14 create-options tests. One case per filter is enough.

Verification:
`pnpm --filter @southneuhof/api test -- divisions projects work-items project-vendors users qhsse-pts project-authorization`
→ all pass

## Done criteria

- [ ] Owner list/detail authorize arrays use `list-*` / `detail-*`
- [ ] `rg "view-projects'|manage-projects'|show-qhsse-pts|view-qhsse-pts" apps/api/src/routes` returns no data-scope uses
- [ ] Work-items list accepts `rootOnly`, `leafOnly`, `workItemCategoryId`
- [ ] Users list accepts `projectId`
- [ ] PTS list uses `coveredProjectIds`
- [ ] `pnpm --filter @southneuhof/api type-check` exits 0
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Plan 046 is not DONE or `list-divisions` is not a catalog code.
- Generic `entity.source.list` cannot filter divisions by project coverage
  without a Sprindle change. Report the exact gap; do not edit Sprindle.
- `allowedProjectOperations` cannot express PTS detail after
  `detail-qhsse-pts` becomes system.
- A write test requires a project-realm `update-projects`.

## Maintenance notes

- Reviewers should check that admin `/divisions/list` still returns
  divisions with no project.
- Plan 048 will point PTS fields at these lists and delete create-options.
- Keep create-options working until 048 so the web app does not break
  mid-series.
