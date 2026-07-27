# Plan 036: Make file routes and resource actions the only CRUD route truth

> **Implementation instructions**: Execute this as one atomic, clean breaking migration after Plan
> 035 passes. Do not land a state with both `routes` and `actions`, both route meta and action
> permissions, or both the full route catalog and mechanical names. Run each focused gate, then all
> final gates. Preserve unrelated user changes in the dirty working tree.
>
> **Drift check (run first)**:
>
> ```sh
> git diff --stat e4f345c..HEAD -- \
>   apps/web/src apps/web/vite.config.ts \
>   packages/is-vue-framework/src \
>   docs/architecture
> ```
>
> Plans 026–035 are expected changes. Before editing, verify the pinned whole-scope diff hash:
>
> ```sh
> git diff --binary e4f345c -- \
>   apps/web/src apps/web/vite.config.ts \
>   packages/is-vue-framework/src \
>   docs/architecture | shasum -a 256
> ```
>
> Expected before Plan 035 proof-only changes: `85c3b9a48dc9eb929293384b7a0030ec8e84ce84eb84c0bc9362fdf87296b1be`.
> Plan 035 must not alter this watched scope. A different hash is drift: compare Current state
> excerpts with live files before proceeding.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH (public resource API, every named web route, direct-entry authorization, and CRUD
  URLs change atomically)
- **Depends on**: `plans/035-prove-mechanical-file-routes.md`
- **Category**: architecture / migration / DX
- **Planned at**: commit `e4f345c`, 2026-07-27, with Plans 026–034 implemented in the working tree

## Why this matters

Current file router has two sources of truth. Files declare URL/tree structure, while
`apps/web/src/manifest/routes.ts` repeats every route-bearing source, name, metadata, and permission.
Adding an ordinary page requires editing both. This dilutes file-based routing and creates hidden
agent work.

Resource configuration has the same split: `routes` owns targets, `permissions` separately owns
access identities, and operations separately decide whether standard controls exist. Detail child
tabs then duplicate child route names and read permission meta from another source.

Final design has narrow, predictable ownership:

- filesystem: URL hierarchy and mechanical route name;
- resource `actions`: standard action target, permission, and optional record-dependent visibility;
- navigation manifest: only ordered/presented entrypoints;
- parent detail route: child placement/order/label by referencing each child resource's action;
- route component: rendered content and explicit nested `AppRouterView`.

No ordinary route is registered in a catalog or given route-local metadata.

## Locked final architecture

### 1. Mechanical route names

Use Plan 035's exact algorithm: effective static file segments, joined by `-`; omit route groups,
`index`, and dynamic params; preserve all other words verbatim. No `new -> create`, `edit -> update`,
singularization, or special CRUD vocabulary.

Required production names and paths:

```text
dashboard                                  /dashboard
to-do                                     /to-do
hr-overtimes                              /hr/overtimes
hr-overtimes-new                          /hr/overtimes/new
hr-overtimes-edit                         /hr/overtimes/:overtimeId/edit
hr-overtimes-detail                       /hr/overtimes/:overtimeId/detail
settings-roles                            /settings/roles
settings-roles-new                        /settings/roles/new
settings-roles-edit                       /settings/roles/:roleId/edit
settings-roles-detail                     /settings/roles/:roleId/detail
settings-roles-detail-permissions         /settings/roles/:roleId/detail/permissions
settings-users                            /settings/users
settings-users-edit                       /settings/users/:userId/edit
settings-users-detail                     /settings/users/:userId/detail
settings-users-detail-roles               /settings/users/:userId/detail/roles
auth-login                                /auth/login
privacy-policy                            /privacy-policy
not-found                                 /:path(.*)
```

Dynamic parameter names never appear in route names. Renaming a parameter must not rename the
screen. Duplicate generated names are build errors, not silently disambiguated.

### 2. Detail tree and sibling create/edit

Roles:

```text
settings/roles/
  index.route.vue
  new.route.vue
  [roleId]/
    edit.route.vue
    detail.route.vue
    detail/
      permissions/
        index.route.vue
```

Users use the same shape with `detail/roles/index.route.vue`. Detail parent renders:

```vue
<DetailView ... />
<Tabs ... />
<AppRouterView />
```

Edit is a standalone sibling. It does not render under `DetailView` and is not a tab. Create is also
a sibling. Delete remains behavior, not a route.

Use Vue Router's documented same-name file/folder nesting. Delete `_parent.route.vue`; do not
replace it with a custom parent marker or promotion hook.

### 3. Resource `actions`

Delete public `ResourceRouteTargets`, `resource.routes`, and separate `resource.permissions`.
Replace them with one `actions` map keyed by standard operation:

```ts
export const roles = defineResource({
  key: 'roles',
  // fields, operations, surfaces, schemas...
  actions: {
    list: {
      permission: 'roles.list',
      to: { name: 'settings-roles' },
    },
    create: {
      permission: 'roles.create',
      to: { name: 'settings-roles-new' },
    },
    detail: {
      permission: 'roles.detail',
      to: {
        name: 'settings-roles-detail',
        params: (id) => ({ roleId: id }),
      },
    },
    update: {
      permission: 'roles.update',
      to: {
        name: 'settings-roles-edit',
        params: (id) => ({ roleId: id }),
      },
    },
    delete: {
      permission: 'roles.delete',
    },
  },
})
```

`to` is deliberately structural, not a free function returning an opaque `RouteLocationRaw`.
Static targets declare only `name`. Identity-dependent targets declare `name` once plus a typed
`params(id)` mapper. `defineResource()` normalizes these declarations so consumers can navigate
without reconstructing them:

```ts
roles.actions.list.to
roles.actions.detail.to(roleId)
```

The normalized action also retains its declared route name for reverse lookup by the permission
guard. No function-source inspection, fake identity invocation, route-name suffix inference, or
duplicate `routeName` field is allowed.

Every declared action spells `permission` explicitly. Do not default it from `resource.key`; public
actions must opt out explicitly with `permission: null`. Standard app CRUD actions use canonical
`<resource>.<operation>` values. A child collection may intentionally use a parent permission:

```ts
rolePermissions.actions.list.permission === 'roles.update'
```

Optional escape hatch:

```ts
visible?: ({ record, access }) => boolean
```

This further restricts UI presentation after ordinary permission access; it never grants access and
never replaces backend authorization. Extraordinary controls remain route-authored
`controls.extra`. Extraordinary non-resource routes may use typed `definePage({ meta: {
permission } })`; this fallback is not used by standard CRUD routes.

### 4. Child resource ownership

`rolePermissions` owns:

- list behavior;
- `settings-roles-detail-permissions` target;
- `roles.update` permission;
- fields, invalidation, and data loading.

Create a real `userRoles` resource that owns the analogous user-role collection/action instead of
leaving it as a raw table plus helper functions. Parent detail routes own only presentation:

```ts
const tabs = [
  { action: rolePermissions.actions.list, label: 'Permissions' },
]
```

No child knows it is a tab or subroute. The same resource can be linked elsewhere.

### 5. Direct-entry permission discovery

`defineResource()` registers every action that has a named target in a route-name/action registry.
Registration key is route name; stored value includes resource key, action key, permission, and
optional visibility data needed for access. Registration must be:

- deterministic;
- idempotent for identical/HMR re-evaluation of the same resource/action;
- an error for two different resource actions claiming one route name;
- resettable in tests.

Move permission enforcement from `router.beforeEach()` to `router.beforeResolve()`. Plan 035 proves
the lazy route component evaluates first, so its imported resource registers the target on direct
URL entry. Auth remains in `beforeEach`.

Guard rules:

1. If destination name has a registered resource action, authorize from that action.
2. Otherwise, honor explicit extraordinary `to.meta.permission` when present.
3. Otherwise allow; backend remains authoritative.
4. Never infer an operation from route-name words or suffixes.
5. Redirect denied navigation to the first accessible navigation entrypoint, preserving existing
   fail-safe behavior.

### 6. Navigation remains entrypoints only

Keep `apps/web/src/manifest/navigation.ts`, but it must no longer import or project a route catalog.
Resource entries reference a resource action:

```ts
{ action: roles.actions.list, title: 'Roles', icon: 'folder' }
```

Navigation owns module order, separators, title, icon, and description. Target and permission come
from the action. Direct non-resource entrypoints such as dashboard and To Do may declare a typed
named target and explicit navigation permission because no resource owns them.

Active module state derives from the resolved entrypoint path subtree using a segment boundary.
Remove ordinary `meta.moduleName`; do not replace it with a list of every descendant route. If
multiple entrypoints match, use the longest resolved path, then manifest order as deterministic
tie-breaker.

### 7. Tabs reference actions

`RouteTab` becomes an action reference plus label, not a route name:

```ts
interface RouteTab {
  action: NavigableResourceAction
  label: string
}
```

`Tabs.vue` resolves `action.to` with inherited route params, filters through action access, and keeps
Plan 033's owner inference/first-valid-child replace behavior plus Plan 034's scoped transitions.
It must not read permission route meta.

## Current state

- `apps/web/vite.config.ts:6-20` imports `routeCatalog` and applies it to every generated route.
- `apps/web/src/router/file-routing/layout-groups.ts:60-89` requires a manifest entry for every
  component, writes name/meta, rejects missing/orphan entries, then promotes layouts.
- `apps/web/src/manifest/routes.ts:1-25` repeats 20 source/name/meta definitions.
- `apps/web/src/manifest/navigation.ts:4-9` references catalog keys; `visibleNavigation()` derives
  legacy `view-*` checks from catalog name/presentation.
- `packages/is-vue-framework/src/resources/defineResource.ts:81-86` defines separate route targets;
  lines 109-111 accept `routes` plus `permissions`; lines 158-160 expose both; lines 223-225
  silently default permissions from the resource key.
- `packages/is-vue-framework/src/resources/controls.ts:38-50` accepts capabilities, permissions, and
  routes as separate inputs.
- `DetailView.vue:47-58` derives delete behavior but navigates through
  `props.resource.routes.list`.
- `apps/web/src/router/guards.ts:7-20` infers operation from permission suffix and reads route meta.
- `apps/web/src/router/index.ts:14-16` installs permission enforcement in `beforeEach`, before lazy
  route resolution.
- Roles/users parent routes use undocumented `_parent.route.vue`, raw route-name tabs, and old short
  names.
- Role permissions already has a resource but no action. User roles is still a raw computed table.
- `Sidebar.vue`/`NavigationDrawer.vue` compare module presentation with `route.meta.moduleName`.
- `AppRouterView.vue` now keys transitions by its own rendered record depth. Preserve this behavior.
- `Tabs.vue` now auto-selects the first valid child only at its owning bare parent. Preserve this
  behavior.

Pinned current hashes:

```text
b01625572f85753a21bbde35b744d0a51f0014fb0d015af462eef460530cc43b  apps/web/vite.config.ts
5ae305301ca842bd6566d94ece8d4ba1da4c2d4207a680988bfe5849071f151c  apps/web/src/router/file-routing/layout-groups.ts
927ed0e07d1114ee1a22a7bb2afc6626637641002c131d451a9e9b5a374c9276  apps/web/src/manifest/routes.ts
994c928a8af72896b20184d76552aee99c2edbe83db547a235f6c1a856dc2467  apps/web/src/manifest/navigation.ts
c16256a119f45cf88d5d16c48ff59c83ea53c0493f5845df093635c04b181c34  packages/is-vue-framework/src/resources/defineResource.ts
c2e8e24b5531763a05a592d023cda9bec339703a60386f10fa9fbc51fe60cbb6  packages/is-vue-framework/src/resources/controls.ts
9ae60bd37c551f6ca90f0957ef1e4f26a7c6942453b555092b9dd6baf4e1365c  apps/web/src/router/guards.ts
8885e7ef63e8c7d79c9beef1526a69699991aecc647f8d33933753d208cdcc68  apps/web/src/components/routing/Tabs.vue
1dfc00912d7ae511be83fbed82467339b6389a167a72e1cb6f1cc62405911f3a  apps/web/src/routes/(authenticated)/settings/roles/[roleId]/_parent.route.vue
a9395a702e2f622529c73cd926a6b5a5b92176ccb6c8adf00608d26246e6c3c0  apps/web/src/routes/(authenticated)/settings/users/[userId]/_parent.route.vue
```

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Required proof | `node plans/proofs/035-mechanical-routes/prove.mjs` | both PASS lines |
| Framework focused tests | `pnpm --filter @southneuhof/is-vue-framework test -- --run src/resources/__tests__/resources.spec.ts src/components/views/__tests__/views.spec.ts` | all pass |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass |
| Framework types | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Web focused tests | `pnpm --filter @southneuhof/framework-web test -- --run src/router/__tests__/routes.spec.ts src/router/__tests__/guards.spec.ts src/router/__tests__/tabs.spec.ts src/router/__tests__/navigation.spec.ts src/router/__tests__/detail-parents.spec.ts src/manifest/__tests__/manifest.spec.ts` | all pass |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | all pass |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint` | exit 0 |
| Web build | `pnpm --filter @southneuhof/framework-web build` | exit 0 |
| Graph refresh | `graphify update .` | exit 0 |

## Scope

**In scope**:

- `packages/is-vue-framework/src/resources/**`
- `packages/is-vue-framework/src/contracts/resource.ts`
- `packages/is-vue-framework/src/contracts/index.ts`
- `packages/is-vue-framework/src/components/views/ListView.vue`
- `packages/is-vue-framework/src/components/views/DetailView.vue`
- `packages/is-vue-framework/src/components/views/__tests__/views.spec.ts`
- `packages/is-vue-framework/src/__tests__/public-api.spec.ts`
- `apps/web/vite.config.ts`
- `apps/web/src/router/**`
- `apps/web/src/routes/**`
- `apps/web/src/route-map.d.ts`
- `apps/web/src/manifest/**`
- `apps/web/src/components/routing/Tabs.vue`
- `apps/web/src/components/navigations/**` only for typed navigation projection/active-module use
- `apps/web/src/framework/adapters/resources/**`
- `apps/web/src/framework/adapters/bundle.ts`
- `apps/web/src/framework/notifications/moduleRoutes.ts` and test only for renamed overtime target
- `apps/web/src/types/index.d.ts` only to delete superseded navigation/route-meta globals
- affected focused tests beside these files
- `docs/architecture/resource-migration-guide.md`
- `docs/architecture/routing-and-controls-review.md`
- `docs/architecture/web-application-architecture.md`
- generated `graphify-out/**`
- `plans/README.md`

**Out of scope**:

- backend/API routes, schemas, or permission enforcement
- changing resource identity declarations or composite identity support
- form/table/detail data orchestration
- changing RPC behavior
- changing Plan 033 automatic tab selection semantics
- changing Plan 034 outlet-depth transition semantics
- aliases or redirects for old CRUD names/URLs
- compatibility aliases for `resource.routes` or `resource.permissions`
- a second route catalog under another name
- a central list of every resource/action
- patching Vue Router
- visual redesign of navigation, forms, tables, details, or tabs

## Git workflow

- Suggested branch: `codex/036-resource-actions-route-truth`
- Suggested commit: `refactor(web): derive CRUD routes from files`
- Do not stage, commit, push, or open a PR unless the operator requests it.

## Steps

### Step 1: Replace route/permission split with typed resource actions

Start with failing framework tests in
`packages/is-vue-framework/src/resources/__tests__/resources.spec.ts` and view tests.

Define action contracts in `resources/defineResource.ts` (or one adjacent `actions.ts` if separation
materially improves readability):

- standard action keys remain `list | detail | create | update | delete`;
- explicit `permission: string | null`;
- optional `visible({ record, access })`;
- static named target;
- identity-dependent named target with typed `params(id)`;
- normalized public action whose `to` is directly consumable;
- navigable-action subtype used by navigation/tabs;
- route-name registry lookup/reset APIs needed by the app guard.

Preserve `RouteLocationRaw` only as the normalized navigation result, not as an opaque dynamic
definition that hides its route name.

Registry tests must cover:

1. static and identity target normalization;
2. scalar and composite identity param mapping;
3. explicit permission required for every declared action;
4. public `permission: null`;
5. identical/HMR-style re-registration is idempotent;
6. conflicting owners for one route name throw with both owner labels;
7. delete has permission/visibility but no target/registration;
8. test reset empties the registry.

Then change `ResourceDefinition`/`Resource` to expose `actions`, delete `routes` and `permissions`,
and update `rowLink`, control context, and returned resource. Do not leave deprecated aliases.

Update `contracts/resource.ts`, exports, public API tests, and type tests. Remove its stale separate
`permissions` property too.

**Verify**:

```sh
pnpm --filter @southneuhof/is-vue-framework test -- --run src/resources/__tests__/resources.spec.ts
pnpm --filter @southneuhof/is-vue-framework type-check
```

Expected: action/registry tests pass; package type-check exits 0.

### Step 2: Make controls and resource-first views consume actions

Refactor `resources/controls.ts`:

- standard control requires corresponding operation capability;
- navigational controls also require that action's target;
- delete requires delete capability, delete action, and `onDelete`;
- permission comes only from the action;
- `visible` may only further hide;
- runtime `AccessAdapter` remains the ordinary access check;
- overrides and `controls.extra` retain current behavior.

Update `ListView`/`DetailView` tests. `DetailView.remove()` must navigate through
`resource.actions.list.to`; delete lifecycle, toast, pending state, failure handling, and semantic
invalidation remain unchanged.

Add negative static scans in resource/public API tests:

```text
ResourceRouteTargets
resource.routes
definition.routes
resource.permissions
definition.permissions
```

No public production match may remain.

**Verify**:

```sh
pnpm --filter @southneuhof/is-vue-framework test -- --run \
  src/resources/__tests__/resources.spec.ts \
  src/components/views/__tests__/views.spec.ts
```

Expected: all focused tests pass, including denied/missing/visible action cases and delete lifecycle.

### Step 3: Migrate every web resource to explicit actions

Migrate roles, users, and overtimes atomically to the new mechanically generated names. Spell all
standard permissions explicitly.

Required action tables:

```text
roles:
  list    roles.list    -> settings-roles
  create  roles.create  -> settings-roles-new
  detail  roles.detail  -> settings-roles-detail(roleId)
  update  roles.update  -> settings-roles-edit(roleId)
  delete  roles.delete  -> no target

users:
  list    users.list    -> settings-users
  detail  users.detail  -> settings-users-detail(userId)
  update  users.update  -> settings-users-edit(userId)
  (no create/delete action because behavior is absent)

overtimes:
  list    overtimes.list    -> hr-overtimes
  create  overtimes.create  -> hr-overtimes-new
  detail  overtimes.detail  -> hr-overtimes-detail(overtimeId)
  update  overtimes.update  -> hr-overtimes-edit(overtimeId)
  delete  overtimes.delete  -> no target

rolePermissions:
  list    roles.update -> settings-roles-detail-permissions

userRoles:
  list    users.update -> settings-users-detail-roles
```

Create `userRoles` as an ordinary collection resource around current `loadAssignableRoles`.
`setUserRole` remains an extraordinary workflow function. Route toggles invalidate `userRoles` and
the owning user where needed; do not fabricate create/update/delete operations.

Resources without route-owned screens, including notifications and verification timeline rows,
need no actions. Absence is valid and means no standard navigation/control.

Update resource specs to assert exact action permissions, names, params, child-resource ownership,
and no old route/permission surface.

Update `accessAdapter` so canonical permission meaning comes from the declared permission itself.
`rolePermissions.actions.list` with `roles.update` must check the legacy `update-roles` grant, not
`view-role-permissions`. Keep the existing legacy bridge isolated in the app adapter; do not leak
legacy prefixes into resource declarations.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run \
  src/framework/adapters/resources/roles.spec.ts \
  src/framework/adapters/resources/users.spec.ts \
  src/framework/adapters/resources/overtimes.spec.ts
```

Expected: all resource specs pass with exact targets/permissions above.

### Step 4: Replace catalog naming with the proven generator convention

Run Plan 035 proof first. Then:

1. Add the proven static-only `getRouteName` to Vite router config through a small exported helper
   under `router/file-routing/` so it can be unit tested.
2. Delete `applyRouteManifest`, `RouteSource`, route-catalog imports, project-root path normalization,
   catalog validation, and manifest-name restoration.
3. Keep only `.layout.vue` promotion in `applyFileRouteConventions`.
4. Mark structural/componentless grouping nodes unnamed in the generic tree hook.
5. Keep authenticated layout's typed `requiresAuth` metadata and promotion; ordinary screens receive
   no title/module/permission metadata.
6. Delete `apps/web/src/manifest/routes.ts`.
7. Reduce manifest contracts/index exports to navigation-entrypoint types only.

Unit tests for naming must cover route groups, index, static segments, dynamic segments, composite
params, five-level nesting, hyphen preservation, duplicate names, componentless nodes, and no CRUD
word mapping.

Rename/move route files to the Locked final architecture. Also:

- move overtime detail from `[overtimeId]/index.route.vue` to
  `[overtimeId]/detail.route.vue`;
- change privacy policy to `privacy-policy/index.route.vue`;
- rename root catch-all to `not-found.route.vue` and give it only the typed catch-all path override;
- update every typed `useRoute()` call and every resource/deep-link route name;
- regenerate `route-map.d.ts`.

Delete `_parent.route.vue` and its old child folders after content moves. Do not retain empty
compatibility files.

Add generated-route tests asserting every exact path/name pair in Locked final architecture, detail
parent/child ancestry, edit/detail sibling relationship, typed params, and rejection of old paths:

```text
/settings/roles/:id
/settings/roles/:id/permissions
/settings/users/:id
/settings/users/:id/roles
/hr/overtimes/:id
```

No redirect or alias is allowed.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run \
  src/router/__tests__/layout-groups.spec.ts \
  src/router/__tests__/routes.spec.ts \
  src/router/__tests__/detail-parents.spec.ts \
  src/router/__tests__/legacy-urls.spec.ts
pnpm --filter @southneuhof/framework-web type-check
```

Expected: focused tests pass; generated route types use only mechanical names.

### Step 5: Make permission guard discover resource actions

Refactor `router/guards.ts` and `router/index.ts`:

- auth and legacy normalization remain `beforeEach`;
- resource permission enforcement becomes `beforeResolve`;
- named action lookup is primary;
- explicit extraordinary `meta.permission` is fallback only;
- unknown/unprotected routes are allowed;
- denied routes use existing default-accessible-entrypoint fallback;
- delete `operationOf()` and all route-name/permission-suffix guessing from the guard.

Guard tests must use a real memory router and lazy components. Cover:

1. direct URL to a lazy detail route registers then authorizes before resolve;
2. allowed and denied standard action;
3. child list action borrowing parent update permission;
4. explicit extraordinary meta fallback;
5. unregistered route without permission;
6. duplicate action registration error;
7. HMR-style identical registration;
8. auth guard still runs before lazy import;
9. denied navigation never mounts destination;
10. default navigation fallback still works.

Do not add a central resource list. Navigation imports cover visible entrypoints; lazy route imports
cover hidden/direct routes.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run \
  src/router/__tests__/guards.spec.ts \
  src/router/__tests__/routes.spec.ts
```

Expected: all guard tests pass; direct lazy entry is authorized from registered action.

### Step 6: Reduce navigation manifest to ordered entrypoints

Rewrite `manifest/contract.ts`, `manifest/navigation.ts`, and manifest tests:

- remove route-source/catalog/name equality contracts;
- resource entry accepts one navigable action plus title/icon;
- direct entry accepts one typed named target, explicit permission/null, plus title/icon;
- preserve module/separator order;
- visible projection checks resource entries through action access and direct entries through their
  explicit permission;
- output target is typed `RouteLocationRaw`, not a catalog key.

Preserve current order:

```text
dashboard
to-do
hr -> overtimes
settings -> System separator, users, roles
```

Update router default navigation, drawer, rail, and sidebar. Active module derives from resolved
entrypoint subtree; remove `meta.moduleName` reads. Add tests for segment boundaries (`/settings/role`
must not activate `/settings/roles`), longest match, denied entries, separators, and default route.

`manifest.spec.ts` must now assert only entrypoints are declared. A static scan must fail if
`source: 'src/routes/` or `routeCatalog` returns.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run \
  src/manifest/__tests__/manifest.spec.ts \
  src/router/__tests__/navigation.spec.ts
```

Expected: ordered navigation passes without a full route catalog.

### Step 7: Make Tabs consume child resource actions

Change `RouteTab` and `Tabs.vue` to consume navigable actions:

- resolve target from the action while inheriting current params;
- authorize from action permission/visibility, never route meta;
- keep unresolved-target filtering;
- keep exact active state;
- keep dotted sibling-query preservation;
- keep shared-owner inference;
- keep automatic `router.replace()` only at the bare owner;
- keep one-tab redirect while hiding one-tab navigation;
- keep recursive nesting behavior.

Parent detail files reference `rolePermissions.actions.list` and `userRoles.actions.list`.
Child routes contain no “subroute” prop/config and do not declare tab membership.

Update Tabs tests to construct real resource actions. Retain all Plan 033 cases: first allowed,
denied/unresolved skip, zero/one valid, active child, edit sibling, deeper descendant, nested owner,
mixed owner, query preservation, replace-not-push, no loop.

Re-run `AppRouterView.spec.ts` unchanged except route names/paths. Parent detail must remain mounted
when Tabs replaces to the first child; only child outlet transitions.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run \
  src/router/__tests__/tabs.spec.ts \
  src/components/routing/AppRouterView.spec.ts \
  src/router/__tests__/detail-parents.spec.ts
```

Expected: all tab, recursive ownership, and transition-scope tests pass.

### Step 8: Remove dead vocabulary and update route-authoring docs

Delete all obsolete route truth:

- `apps/web/src/manifest/routes.ts`;
- route catalog types/tests/application;
- `_parent.route.vue`;
- ordinary route `title`, `moduleName`, and `permission` meta;
- `ResourceRouteTargets`;
- `resource.routes`;
- `resource.permissions`;
- default permission derivation;
- raw route-name tabs;
- `operationOf`;
- old generated names and old detail URLs in production docs/tests.

Update all three architecture docs with one CRUD workflow:

1. add file route;
2. name comes mechanically from static file segments;
3. add/modify resource action when standard CRUD UI/navigation/access needs it;
4. add only list/entry action to navigation manifest when it belongs in nav;
5. detail children own resources/actions; parent references action for tab placement;
6. extraordinary workflow uses `controls.extra`, `visible`, or explicit typed route meta in that
   order.

Include full roles tree/action example and composite-param example. State that `new` remains `new`
and `edit` remains `edit`; no semantic aliases exist.

Static scans:

```sh
rg -n "routeCatalog|defineRouteCatalog|ResourceRouteTargets|\\.routes\\.(list|create|detail|update)|resource\\.permissions|operationOf|_parent\\.route" \
  apps/web/src packages/is-vue-framework/src docs/architecture
```

Expected: no production/documentation matches. Test descriptions about removed behavior may be
deleted or rewritten, not exempted.

Also scan standard CRUD route SFCs for ordinary permission/module/title metadata. Only authenticated
layout auth meta and `not-found` path override may remain among migrated routes.

**Verify**:

```sh
pnpm --filter @southneuhof/is-vue-framework test
pnpm --filter @southneuhof/is-vue-framework type-check
pnpm --filter @southneuhof/framework-web test
pnpm --filter @southneuhof/framework-web type-check
pnpm --filter @southneuhof/framework-web lint
pnpm --filter @southneuhof/framework-web build
```

Expected: all commands exit 0.

### Step 9: Refresh graph and close plan

Run:

```sh
graphify update .
```

Expected: exit 0 and graph outputs update.

Update Plan 036 row in `plans/README.md` to `DONE` only after reviewing the diff against every done
criterion.

## Test plan

Framework tests:

- action type inference for scalar/composite identities;
- action target normalization and reverse lookup;
- explicit permissions and public opt-out;
- registry conflict/HMR/reset;
- controls use behavior + action + access + visibility;
- delete lifecycle from action table;
- row links use detail action.

Web tests:

- exact mechanical names/paths and generated param types;
- documented detail parent/child structure and edit sibling;
- old URLs/names absent;
- lazy direct-entry authorization;
- child action borrowing parent permission;
- navigation entrypoint order/access/active subtree;
- Tabs action ownership, default selection, recursion, and query behavior;
- transition scope preserved;
- roles/users/overtimes resource targets;
- child resource ownership for role permissions/user roles;
- static absence of catalog, old API, `_parent`, and ordinary route metadata.

## Done criteria

- [ ] Plan 035 proof prints both PASS lines before source edits.
- [ ] Every production route name follows static-segment concatenation; no dynamic param appears.
- [ ] Roles/users use `detail.route.vue` plus same-name `detail/` child folder.
- [ ] Edit/create are detail siblings; delete has no route.
- [ ] Old bare detail and old child URLs do not resolve and have no redirects/aliases.
- [ ] `apps/web/src/manifest/routes.ts` and full catalog contracts are deleted.
- [ ] Navigation manifest contains entrypoints only.
- [ ] `Resource` exposes `actions`; `routes` and separate `permissions` do not exist.
- [ ] Every standard CRUD action permission is explicit in its resource.
- [ ] ListView/DetailView/row links/navigation/Tabs/guard consume actions.
- [ ] `rolePermissions` and `userRoles` own their list action/permission.
- [ ] Permission guard runs in `beforeResolve` and passes lazy direct-entry tests.
- [ ] Tabs preserve Plan 033 behavior and AppRouterView preserves Plan 034 transition behavior.
- [ ] Framework tests/type-check pass.
- [ ] Web tests/type-check/lint/build pass.
- [ ] Obsolete-vocabulary static scans return no matches.
- [ ] `graphify update .` exits 0.
- [ ] Plan 036 status is `DONE`.

## STOP conditions

Stop and report, without reviving rejected architecture, if:

- Plan 035 is not `DONE` or either proof fails;
- live current-state hashes differ for reasons not attributable to completed plans/user edits;
- same-name detail nesting differs from proof in production generation;
- a resource action target cannot expose its route name structurally without duplicating it;
- direct lazy entry reaches `beforeResolve` before action registration;
- a required standard CRUD route does not import the resource that owns its action;
- mechanical naming creates a collision between two genuinely distinct URL patterns;
- migration requires a central list of every resource/action or a per-route catalog;
- migration requires patching Vue Router;
- old URLs must remain compatible (maintainer explicitly chose clean break);
- a framework change beyond resource actions/controls/views is required;
- a step's focused verification fails twice after one reasonable correction.

When stopping on generation/guard behavior, include router version, generated route/type excerpt,
action registry contents, and ordered guard/module events. Do not repeat a failed `_parent` attempt.

## Maintenance notes

Future route authoring should need no catalog edit. Static file segments determine name; resource
actions determine standard UI/access; navigation lists entrypoints only. Review new CRUD screens by
checking those three owners and rejecting duplicated route names, permissions, or child membership.

Route groups, `index`, and dynamic params are intentionally absent from names. Changing this rule is
a global breaking migration and must update Plan 035's executable proof first.

