# Plan 032: Replace route metadata with a typed manifest and native detail parents

> **Implementation instructions**: Execute this as one clean breaking migration. Do not leave a
> compatibility layer, mixed metadata sources, temporary parent marker, or old navigation manifest.
> Run every gate. STOP only under conditions below and include requested generated-tree evidence.
>
> **Drift check**:
> ```sh
> git diff --stat e4f345c..HEAD -- apps/web/src docs/architecture
> ```
> Plans 026–031 are expected. Reconcile live files against Current state before editing; preserve
> unrelated user changes.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH (all web route metadata and record composition change atomically)
- **Depends on**: `plans/029-use-vue-router-resource-targets.md`,
  `plans/030-add-resource-first-view-shells.md`,
  `plans/031-simplify-detail-routes-and-tabs.md`
- **Category**: architecture / DX / migration
- **Planned at**: `e4f345c`, 2026-07-27 after maintainer decisions and generator proofs

## Why this matters

Route truth is split across file paths, typed `definePage()`, free-form JSON5 `<route>` blocks,
global loose navigation types, navigation-only arrays, generated names, and custom marked-index
promotion. Agents can introduce name/meta drift, and `rendersChildren` encodes router mechanics as
runtime-looking metadata.

Final design has three owners:

- filesystem owns URL/tree structure;
- typed application manifest owns every route name/meta plus navigation presentation/order;
- route component owns rendered content and RouterView placement.

All ID-context files stay inside parameter folders. Native `_parent.route.vue` expresses a directory
component recursively at any depth. Roles/users parents render DetailView unconditionally, then tabs
and RouterView: every child is deliberately detail-under.

## Locked decisions

1. Complete clean break: remove all route-local `definePage()` and `<route>` declarations.
2. Replace `components/navigations/navigation-manifest.ts` with neutral typed manifest under
   `apps/web/src/manifest/`.
3. Catalog every route-bearing `.route.vue` and `.layout.vue`, including hidden/detail/edit/public/
   catch-all routes and layouts.
4. Navigation is ordered projection of catalog; hidden routes remain cataloged but absent from nav.
5. Manifest references component source paths, not duplicated URL paths. Build validates source
   existence and one-to-one mapping.
6. Use native `[roleId]/_parent.route.vue` and `[userId]/_parent.route.vue`.
7. Generic manifest hook restores names suppressed by native `_parent`; no parent-specific marker.
8. Parent template uses ordinary components only:

   ```vue
   <DetailView ... />
   <Tabs ... />
   <RouterView />
   ```

9. Every child, including edit, renders under DetailView. Replacement screens require a different
   route-tree branch in future; no route-name/template conditionals.
10. No legacy aliases or redirects for old `/detail` URLs.

## Executable proof

Run before source edits:

```sh
node plans/proofs/031-native-parent-typed/prove.mjs
```

Expected:

```text
PASS: manifest-backed _parent.route.vue generated as named parent with meta, children, and roleId
```

Proof uses installed Vue Router generator and metadata-free SFCs. It asserts manifest-applied name/
meta, native parent component placement, typed `roleId`, edit/permissions children, and generated
parent file-info union.

## Current state

- 20 route-bearing files exist under `apps/web/src/routes`.
- Most pages use `definePage({ name, meta })`.
- authenticated/public layouts use JSON5 `<route>` meta.
- roles/users detail indexes use JSON5 `rendersChildren`, Tabs, RouterView slot fallback, and custom
  `applyRouteParentPages`.
- `layout-groups.ts` combines `.layout.vue` promotion and marked-index promotion.
- `navigation-manifest.ts` is navigation-only, typed through global `Modules`; route names are plain
  strings and permission access still has casts/`any`.
- Sidebar rail, drawer, and router fallback import navigation manifest directly.
- Preserve current public names:
  `dashboard`, `to-do`, `overtimes`, `overtime-detail`, `overtime-edit`, `overtime-create`, `roles`,
  `roles-detail`, `roles-update`, `roles-permissions`, `roles-create`, `users`, `users-detail`,
  `users-update`, `users-roles`, `login`, `not-found`.
- Clean migration explicitly names formerly internal records:
  authenticated layout → `authenticated-root`; public layout → `public-root`; privacy page →
  `privacy-policy`.
- Existing access adapter/guard wiring and plugin-before-router ordering are implemented and tested;
  preserve them.
- Resource-first views, delete lifecycle tests, typed route params, tabs, and guard coverage from
  plans 029–031 are green.

## Commands

| Purpose | Command | Expected |
|---|---|---|
| Generator proof | `node plans/proofs/031-native-parent-typed/prove.mjs` | exact PASS line |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | all pass |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web build | `pnpm --filter @southneuhof/framework-web build` | exit 0 |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass |
| Framework types | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |

## Scope

**In scope**:

- `plans/proofs/031-native-parent-typed/**`
- `apps/web/src/manifest/**` (create)
- `apps/web/src/routes/**`
- `apps/web/src/components/navigations/**`
- `apps/web/src/components/routing/Tabs.vue`
- `apps/web/src/router/**`
- `apps/web/src/route-map.d.ts`
- `apps/web/src/types/index.d.ts` navigation globals only
- `apps/web/vite.config.ts`
- resource targets/deep links only when names require updates
- relevant web tests and architecture docs
- `plans/README.md`

**Out of scope**:

- backend/API routes
- composite identity redesign
- FormView redesign
- app/auth layout visual redesign
- Vue Router/node_modules patch
- compatibility wrappers, aliases, or legacy metadata readers
- changing permission meaning

## Steps

### Step 1: Define typed application-manifest contracts

Create:

```text
apps/web/src/manifest/
  contract.ts
  routes.ts
  navigation.ts
  index.ts
  __tests__/manifest.spec.ts
```

`contract.ts` defines:

- `RouteSource = \`src/routes/${string}.${'route' | 'layout'}.vue\``;
- `AppRouteDefinition<Name extends string>` with `source`, `name`, typed `RouteMeta`;
- optional navigation presentation (`title`, `icon`, optional legacy nav permission);
- `defineRouteCatalog()` preserving literal keys/names;
- `AppRouteKey` and `AppRouteName` derived from catalog;
- typed navigation module/separator/route-reference definitions;
- `defineNavigation()` accepting only catalog keys with navigation presentation.

Keep manifest modules pure: types/data only; no Vue components, Pinia stores, browser globals, or
generated `RouteNamedMap` import. Generated types depend on manifest, so importing generated map here
would create circular bootstrap.

`routes.ts` catalogs every route-bearing file. Preserve existing public names; assign
`authenticated-root`, `public-root`, `privacy-policy` to formerly generated/internal records.
Preserve current `RouteMeta` exactly unless this plan specifies structural removal.

`navigation.ts` reproduces current module and route order using catalog keys:

```text
dashboard
to-do
hr → overtimes
settings → System separator, users, roles
```

Hidden/detail/create/edit/mapping/auth/public routes stay out of navigation.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run src/manifest/__tests__/manifest.spec.ts
```

Cover literal inference, invalid navigation key compile fixture, duplicate source/name rejection,
separator/order preservation, hidden exclusion, and all 20 source entries.

### Step 2: Apply manifest to every file-route node

In `router/file-routing/layout-groups.ts`:

1. Add generic `applyRouteManifest(root, catalog, projectRoot)` traversal.
2. Normalize each `node.component` to repo-relative POSIX source path.
3. Require exactly one definition for every route-bearing component.
4. Apply definition `name` and cloned `meta`.
5. Reject missing component files, duplicate mappings, manifest entries unseen in tree, and source
   mapped to multiple nodes.
6. Run manifest application before layout promotion so layout name/meta move with component.
7. Keep `.layout.vue` group promotion.
8. Delete `applyRouteParentPages`, `rendersChildren`, and all marked-index tests.

`vite.config.ts` passes catalog and stable project root to combined hook.

Do not infer URLs, inspect SFC source, import generated route map, or special-case route depth.
Native `_parent` is attached to directory node by Vue Router; generic manifest application restores
its name/meta like any component.

Add real/fake-tree tests for full matching, missing/orphan/duplicate definitions, normalization,
layout composition, `_parent` naming, five-level recursive nesting, and idempotency.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run src/router/__tests__/layout-groups.spec.ts src/manifest/__tests__/manifest.spec.ts
```

### Step 3: Atomically remove all route-local metadata

Delete every `definePage()` and `<route>` block from all route/layout SFCs. No exceptions.

```sh
rg -n "definePage\\(|<route(?:\\s|>)|rendersChildren" apps/web/src/routes
```

Expected: no matches.

Regenerate route map. Add compile-time equality assertion:

```ts
type _ManifestNamesMatchGenerated = Equal<AppRouteName, keyof RouteNamedMap>
```

Catalog explicitly names every component-backed route. Componentless pass-through nodes are not
catalog entries and must not appear as navigable names.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web type-check
```

Expected: equality assertion passes; no route-name casts.

### Step 4: Replace marked indexes with native recursive parents

Roles final tree:

```text
settings/roles/
  index.route.vue
  new.route.vue
  [roleId]/
    _parent.route.vue
    edit.route.vue
    permissions/index.route.vue
```

Move `[roleId]/index.route.vue` to `_parent.route.vue`; update catalog source; preserve
`roles-detail`. Repeat users, preserving `users-detail`.

Parent scripts own typed ID, resource-first DetailView, and typed ordered tabs. Parent template:

```vue
<div class="flex flex-col gap-4">
  <DetailView title="Detail Role" :resource="roles" :id="roleId" />
  <Tabs label="Role" :items="tabs" />
  <RouterView />
</div>
```

Users equivalent. No RouterView slot, dynamic `<component>`, `v-if`, fallback, route-name check, or
injected subroute flag. Children stay unaware of presentation.

At base URL only detail/tabs render. At mapping/edit URL, parent remains and child renders beneath.
This includes edit by design.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run src/router/__tests__/routes.spec.ts src/router/__tests__/detail-parents.spec.ts
```

### Step 5: Replace navigation-only manifest and global loose types

Delete `components/navigations/navigation-manifest.ts`.

Update Sidebar, NavigationDrawer, RailExpand, NavItem, and `router/navigation.ts` to consume typed
navigation projection. Remove global `Route`, `Module`, `Modules`, `RouteSeparator`; navigation
`any` props/casts; cast-based permission/name fallbacks; duplicated navigation literals.

Default authenticated navigation iterates ordered visible projection and returns typed named
location. Sidebar active module still reads route `meta.moduleName`.

Add component/helper tests for order, separators, permission filtering, hidden routes, active state,
and default post-login destination.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run src/router/__tests__/navigation.spec.ts src/components/navigations
```

### Step 6: Verify access, tabs, and recursive detail-under

Ensure manifest-applied permission meta drives both direct guard and Tabs.

Test:

- authenticated/public layout meta;
- allowed/denied direct URLs and fallback;
- named tabs inherit params/preserve namespaced query;
- roles/users bare, mapping, and edit URLs;
- DetailView remains mounted for every child;
- child renders once below parent;
- five-level nested fixture renders each ancestor once;
- overtime index/edit remains non-parent because no `_parent`.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run src/router
```

### Step 7: Clean sweep, docs, full gates

Update architecture docs with ownership rules, manifest schema, navigation projection, recursive
`_parent`, detail-under semantics, and clean break. Remove obsolete JSON5, marked-index,
record-layout, shell, first-valid-tab, and fallback-detail guidance.

Run:

```sh
rg -n "navigation-manifest|definePage\\(|<route(?:\\s|>)|rendersChildren|applyRouteParentPages|roles\\.layout|users\\.layout|RouterView v-slot|identityFromRoute|meta\\.tabs|/detail" apps/web/src docs/architecture
node plans/proofs/031-native-parent-typed/prove.mjs
pnpm --filter @southneuhof/is-vue-framework type-check
pnpm --filter @southneuhof/is-vue-framework test
pnpm --filter @southneuhof/framework-web type-check
pnpm --filter @southneuhof/framework-web test
pnpm --filter @southneuhof/framework-web build
graphify update .
```

Expected: only intentional historical prose matches removed terms; proof and all gates pass.

## Done criteria

- [ ] All route-bearing files cataloged exactly once.
- [ ] Manifest and generated route-name unions match.
- [ ] Navigation order references typed catalog keys.
- [ ] No route-local `definePage` or `<route>`.
- [ ] No old navigation manifest/global navigation types/casts.
- [ ] No `rendersChildren` or marked-index promotion.
- [ ] Roles/users use in-folder native `_parent.route.vue`.
- [ ] Parent renders DetailView, Tabs, plain RouterView unconditionally.
- [ ] Every child, including edit, renders detail-under.
- [ ] Permission guard/Tabs consume same manifest-applied meta.
- [ ] Proof, tests, types, build, docs, graph pass/update.
- [ ] No compatibility layer or legacy redirect added.
- [ ] Plan index updated after review.

## STOP conditions

- Unmodified native-parent manifest proof fails.
- Generic hook cannot assign manifest name/meta to native `_parent` while retaining typed params/
  children. Capture generated routes and route-map diff.
- Component-backed generated route cannot be represented one-to-one in catalog. Inventory exact node.
- Manifest import creates browser/store/component side effects in Vite config.
- Generated names contain unexplained name absent from catalog after all components are mapped.
- Detail-under edit behavior conflicts with concrete existing test/product requirement not already
  accepted here. Capture requirement; do not add conditional rendering.

## Maintenance notes

- Filesystem is structural source; manifest is semantic source. Tests enforce correspondence.
- `_parent` works at arbitrary depth; no resource-specific meaning.
- Navigation is projection, not route-registry owner.
- Add route: create SFC, add catalog entry, optionally reference it from ordered navigation.
- Never restore route-local metadata or infer parenthood from index/siblings.
