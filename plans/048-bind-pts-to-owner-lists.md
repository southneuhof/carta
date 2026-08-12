# Plan 048: Bind PTS forms to owner lists

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` after the implementation and review pass.
>
> **Drift check (run first)**:
> `git diff --stat aa30f1d..HEAD -- apps/api/src/routes/qhsse-pts apps/api/src/routes/index.ts apps/web/src/routes/(authenticated)/quality/pts apps/web/src/routes/(authenticated)/master-data apps/web/src/routes/(authenticated)/settings/users apps/web/src/manifest/navigation.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/047-add-owner-list-filters.md`
- **Category**: tech-debt
- **Planned at**: commit `aa30f1d`, 2026-08-13

## Why this matters

The cleanup still invents PTS-owned option resources. Legacy PTS and the
work-items screen already call owner modules. After plan 047, those owner
lists accept the filters PTS needs. This plan points the form at those
resources and deletes the 14 create-option routes.

## Current state

PTS builds seven local option resources:

```ts
const divisionCreateOptions = ptsCreateOptionResource('qhsse-pts.create-options.divisions', ...)
```

`apps/web/src/routes/(authenticated)/quality/pts/pts.resource.ts:15-31,63-92,182-203`

Actions wire them to RPC:

```ts
createHonoResourceActions(rpc['qhsse-pts']['create-options'].divisions, dataAdapter)
```

`apps/web/src/routes/(authenticated)/quality/pts/pts.actions.ts:11-32`

The list filter also uses a PTS option resource:
`apps/web/src/routes/(authenticated)/quality/pts/index.route.vue:9,29`

API still registers 14 routes in
`apps/api/src/routes/qhsse-pts/qhsse-pts.routes.ts:27-207` and
`apps/api/src/routes/index.ts:43-58,114-127`.

The nearby pattern to copy is work-items:

```ts
source: divisions
source: projects
behavior: { props: ({ draft }) => ({ searchParameters: { divisionId: draft.divisionId } }) }
```

`apps/web/src/routes/(authenticated)/master-data/work-items/index.route.vue:23-24`

Owner resources to import:

- `apps/web/src/routes/(authenticated)/master-data/divisions/divisions.resource.ts`
- `apps/web/src/routes/(authenticated)/master-data/projects/projects.resource.ts`
- `apps/web/src/routes/(authenticated)/master-data/pts-work-categories/pts-work-categories.resource.ts`
- `apps/web/src/routes/(authenticated)/master-data/work-items/work-items.resource.ts`
- `apps/web/src/routes/(authenticated)/master-data/root-causes/root-causes.resource.ts`
- `apps/web/src/routes/(authenticated)/master-data/projects/[projectId]/detail/vendors/project-vendors.resource.ts`
  — this is a factory `projectVendors(projectId)`. PTS needs a stable source
  that receives `projectId` through `searchParameters`, not a factory call.
  If the factory cannot be used as a lookup source, add a non-factory export
  on that file that uses `projectVendorActions.list` / `detail` and lets
  `searchParameters.projectId` through. Do not put the source under PTS.
- `apps/web/src/routes/(authenticated)/settings/users/users.resource.ts`

Approved searchParameters:
`docs/superpowers/specs/2026-08-13-owner-list-sources-design.md`
section "What PTS sends".

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Web PTS tests | `pnpm --filter @southneuhof/framework-web test -- pts` | exit 0 |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint` | exit 0 |
| API PTS tests | `pnpm --filter @southneuhof/api test -- qhsse-pts.spec.ts` | exit 0 |
| API type check | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| Diff check | `git diff --check` | no whitespace errors |

## Suggested implementation toolkit

- `.agents/skills/build-resource-form/SKILL.md`
- `.agents/skills/web-ui-surface-reuse/SKILL.md`
- Do not edit `packages/is-vue-framework`.

## Scope

**In scope**:

- `apps/web/src/routes/(authenticated)/quality/pts/pts.resource.ts`
- `apps/web/src/routes/(authenticated)/quality/pts/pts.resource.spec.ts`
- `apps/web/src/routes/(authenticated)/quality/pts/pts.actions.ts`
- `apps/web/src/routes/(authenticated)/quality/pts/pts.actions.spec.ts`
- `apps/web/src/routes/(authenticated)/quality/pts/index.route.vue`
- other PTS routes that import `ptsCreateOptionResources`
- `apps/web/src/routes/(authenticated)/master-data/projects/[projectId]/detail/vendors/project-vendors.resource.ts`
  only if a non-factory lookup export is required
- `apps/web/src/routes/(authenticated)/master-data/{divisions,projects,work-items,pts-work-categories,root-causes}/*.resource.ts`
  — set resource `permission` for **admin routes only**:
  list/detail stay `view-*`; create/update/delete become `create-*` /
  `update-*` / `delete-*`. Do not put `list-*` on the web resource.
- `apps/web/src/routes/(authenticated)/settings/users/users.resource.ts`
  — list/detail stay `view-users`
- `apps/web/src/manifest/navigation.ts`
- `apps/api/src/routes/qhsse-pts/qhsse-pts.routes.ts` — delete create-option
  routes
- `apps/api/src/routes/qhsse-pts/qhsse-pts.service.ts` — delete
  `listPtsCreate*` / `getPtsCreate*`
- `apps/api/src/routes/index.ts` — unregister those routes
- `apps/api/src/__tests__/qhsse-pts.spec.ts` and
  `apps/api/src/__tests__/project-authorization.spec.ts` — remove
  create-options assertions

**Out of scope**:

- Framework lookup renderer
- Addendum modules
- Changing PTS write / workflow services beyond deleting option helpers

## Git workflow

- Commit message style: `fix(pts): use owner lists for form sources`
- Do NOT push or open a PR unless asked

## Steps

### Step 1: Point PTS fields at owner resources

In `pts.resource.ts`:

- Import `divisions`, `projects`, `ptsWorkCategories`, `workItems`,
  `rootCauses`, `users`, and the project-vendors lookup source.
- Delete `ptsCreateOptionSchema`, `ptsCreateOptionResource`, and
  `ptsCreateOptionResources`.
- Bind fields:

| Field | source | searchParameters |
| --- | --- | --- |
| `divisionId` | `divisions` | `{ permission: 'create-qhsse-pts', active: true }` |
| `projectId` | `projects` | `{ permission: 'create-qhsse-pts', divisionId, active: true }` plus existing disable / resetWhen |
| `ptsWorkCategoryId` | `ptsWorkCategories` | `{ active: true }` |
| `workItemCategoryId` | `workItems` | `{ projectId, rootOnly: true, active: true }` |
| `workItemId` | `workItems` | `{ projectId, workItemCategoryId, leafOnly: true, active: true }` |
| `rootCauseIds` | `rootCauses` | `{ active: true }` |
| `projectVendorId` / `actualProjectVendorId` | project-vendors | `{ projectId, active: true }` |
| `somUserId` / `implementationUserId` | `users` | `{ projectId, statusCode: 'active' }` |

Keep `pick: 'id'` and `view: 'name'`.

Set PTS resource admin permissions:

- list: `view-qhsse-pts`
- detail: `view-qhsse-pts` (route guard; API still uses `detail-qhsse-pts`)
- create: `null` or omit — create is a project workflow; do not use a
  system code. The API remains the authority.

Update `index.route.vue` root-cause filter to `source: rootCauses`.

**Verify**: `pnpm --filter @southneuhof/framework-web test -- pts.resource.spec.ts`
→ exit 0 after the spec expects owner resources, not
`ptsCreateOptionResources`.

### Step 2: Delete PTS option actions

Remove `ptsCreateOptionActions` and the seven
`createHonoResourceActions(rpc['qhsse-pts']['create-options']…)` lines from
`pts.actions.ts`. Keep `ptsActions` and `runAction`.

Rewrite `pts.actions.spec.ts` so it no longer mocks `create-options`. Keep
the action POST test. Move any remaining query-forwarding assertion onto
the owner action specs if one does not already exist (for example
`projects.actions.spec.ts`). Do not keep a PTS-only option adapter test.

**Verify**: `pnpm --filter @southneuhof/framework-web test -- pts.actions.spec.ts`
→ exit 0

### Step 3: Set owner web route permissions and menus

Navigation (`apps/web/src/manifest/navigation.ts`):

- `master-data-projects` → `view-projects`
- `master-data-work-items` → `view-work-items`
- `quality-pts` → `view-qhsse-pts`

Owner resources: replace `manage-*` and `permission: null` on **admin
actions** with `view-*` / `create-*` / `update-*` / `delete-*` as in the
scope list. Lookup `source` still calls `list` / `detail` run functions and
does not use those permissions.

**Verify**: `rg "permission: null" apps/web/src/manifest/navigation.ts`
→ only dashboard and to-do remain null
`rg "manage-divisions|manage-projects|manage-root-causes|manage-pts-work-categories" apps/web/src/routes`
→ no matches on the PTS owner modules

### Step 4: Delete create-options from the API

Remove the 14 routes from `qhsse-pts.routes.ts` and their service helpers.
Unregister them in `routes/index.ts`. Delete tests that hit
`/qhsse-pts/create-options`.

**Verify**:
`rg "create-options|listPtsCreate|getPtsCreate|ptsCreateOption" apps`
→ no matches
`pnpm --filter @southneuhof/api test -- qhsse-pts.spec.ts` → exit 0
`pnpm --filter @southneuhof/api type-check` → exit 0
`pnpm --filter @southneuhof/framework-web type-check` → exit 0
`git diff --check` → clean

## Test plan

- Resource spec: field order unchanged; `source` is the owner resource;
  searchParameters match the table above.
- Action spec: no `create-options` RPC.
- API: create-options URLs are gone; create still checks
  `create-qhsse-pts`.

Reuse:
- `Reused`: `lookup` renderer, owner `defineResource` list/detail, work-items
  dependent `searchParameters`
- `Searched`: input registry, work-items index, project-vendors resource
- `Gap`: none, or name the exact project-vendors factory gap if you had to
  add a non-factory export

## Done criteria

- [ ] `rg "create-options" apps` returns no matches
- [ ] PTS create fields use owner resources
- [ ] Menus for projects, work-items, and PTS use `view-*`
- [ ] `pnpm --filter @southneuhof/framework-web test -- pts` exits 0
- [ ] `pnpm --filter @southneuhof/framework-web type-check` exits 0
- [ ] `pnpm --filter @southneuhof/api type-check` exits 0
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Plan 047 is not DONE or owner lists reject `rootOnly` / `projectId` /
  `permission`.
- The lookup renderer requires a resource without `list` and `detail`.
- `projectVendors(projectId)` cannot become a searchParameter source
  without a framework change.
- A PTS action form cannot import `users` without creating a circular
  module graph. Report the cycle; do not add a PTS-owned users wrapper.

## Maintenance notes

- Reviewers must confirm PTS no longer defines option schemas.
- A later module copies this pattern: import the owner resource, pass
  `searchParameters`, never add `/<module>/create-options`.
- Plan 049 updates docs and the form skill so the next implementer does
  not rebuild create-options.
