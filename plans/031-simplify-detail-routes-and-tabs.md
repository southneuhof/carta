# Plan 031: Make in-folder index details explicit route parents

> **Implementation instructions**: Follow every step and gate in order. Run proof first. STOP only on
> conditions listed below after capturing requested evidence; do not retry rejected filename shapes.
>
> **Drift check**:
> ```sh
> git diff --stat e4f345c..HEAD -- apps/web/src packages/is-vue-framework/src docs/architecture
> ```
> Plans 026–030 and incomplete plan 031 work are expected. Other unexplained drift is a STOP.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED-HIGH
- **Depends on**: plans 029, 030
- **Category**: tech-debt / DX / migration
- **Planned at**: `e4f345c`, revised 2026-07-27 after executable generator proof

## Required shape

All routes needing role identity remain inside `[roleId]/`:

```text
settings/roles/
  index.route.vue
  [roleId]/
    index.route.vue              # named parent detail + tabs + child outlet
    edit.route.vue
    permissions/index.route.vue  # ordinary child
```

Same for users. Parent index owns default DetailView, ordered named tabs, and RouterView. Bare parent
URL renders detail; child URL replaces detail in same outlet. Children know nothing about tabs or
subroute presentation.

## Proven route-generation approach

Native Vue Router 5.1 shapes do not directly provide this exact semantic layout:

- ordinary folder index becomes an empty-path child, not directory parent;
- `_parent.route.vue` attaches to directory but suppresses route name; both `definePage()` and static
  `<route>` attempts lost `roles-detail`/`users-detail`;
- sibling `[roleId].route.vue` works technically but violates required in-folder locality.

Use existing app `beforeWriteFiles` extension point. Mark parent index in static route metadata:

```vue
<route lang="json5">
{
  name: 'roles-detail',
  meta: {
    title: 'Detail Role',
    moduleName: 'settings',
    permission: 'roles.detail',
    rendersChildren: true,
  },
}
</route>
```

Transformer promotes marked empty-path index component/name/meta onto directory node, strips
`rendersChildren`, and deletes duplicate index node.

Executable proof:

```sh
node plans/proofs/031-index-parent/prove.mjs
```

Expected exact output:

```text
PASS: marked [roleId]/index.route.vue generated as named parent with typed children and roleId
```

Proof uses installed Vue Router generator, not mock tree. It asserts:

- `roles-detail` at `/settings/roles/:roleId`;
- component path remains `[roleId]/index.route.vue`;
- `roles-update` and `roles-permissions` are children;
- generated file-info map associates parent file with all three names and `roleId`;
- build-only marker is absent from generated runtime route meta.

Keep proof fixture as regression evidence until app integration tests encode same assertions.

## Current state

- `roles.layout.vue` / `users.layout.vue` own tabs/outlet.
- `[roleId]/index.route.vue` / `[userId]/index.route.vue` own only DetailView.
- Stable detail names and bare URLs already exist.
- Existing `apps/web/src/router/file-routing/layout-groups.ts` transforms route tree through
  `beforeWriteFiles`; add explicit index-parent behavior there.
- Overtime stays unmarked ordinary index despite edit sibling.
- Tabs/permission tests, real access adapter, safe plugin/router ordering, typed-param cleanup, and
  composite contract fixture repair remain incomplete from reconciliation.

## Scope

**In scope**:

- `plans/proofs/031-index-parent/**`
- `apps/web/src/routes/(authenticated)/settings/{roles,users}/**`
- `apps/web/src/routes/(authenticated)/hr/overtimes/**`
- `apps/web/src/router/file-routing/layout-groups.ts`
- `apps/web/src/router/__tests__/layout-groups.spec.ts`
- `apps/web/vite.config.ts` only if exported hook name changes
- `apps/web/src/components/routing/Tabs.vue`
- `apps/web/src/router/{index.ts,guards.ts,meta.d.ts,tabs.ts,detail-shells.ts}`
- `apps/web/src/framework/adapters/bundle.ts`
- `apps/web/src/main.ts`
- relevant route/tab/guard/detail tests and generated `route-map.d.ts`
- relevant resource targets/deep links
- framework identity contracts/tests solely for removing `identityKeys`
- composite contract type fixture
- relevant architecture docs and app README

**Out of scope**:

- `_parent.route.vue`
- sibling `[roleId].route.vue` / `[userId].route.vue`
- Vue Router/node_modules patch
- renaming stable route consumers
- automatic promotion of every index
- child-declared tab membership
- composite identity redesign
- app/auth layout removal
- backend/API changes

## Steps

### Step 0: Run proof unchanged

```sh
node plans/proofs/031-index-parent/prove.mjs
```

Expected PASS line above. If it fails, compare installed Vue Router version and proof output before
touching app source.

### Step 1: Add marked-index promotion

In `layout-groups.ts`, retain `applyRouteGroupLayouts`. Add `applyRouteParentPages(root)` and a
combined `applyFileRouteConventions(root)` registered by Vite.

Candidate requirements:

- direct child `path === ''`;
- default component ends `/index.route.vue`;
- static `meta.rendersChildren === true`;
- string route name;
- parent has no default component.

Promotion:

1. Recursively process nodes.
2. Reject layout/default-component conflict.
3. Copy component, name, and meta minus marker onto parent.
4. Delete index child after successful copy.
5. Preserve siblings/descendants.
6. Remain idempotent.

Never inspect source text, hardcode resource paths, or promote unmarked index.

Add tests for promotion, marker stripping, sibling retention, unmarked no-op, overtime-like no-op,
layout conflict, missing name, nested behavior, idempotency, and existing layout behavior.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run src/router/__tests__/layout-groups.spec.ts
```

### Step 2: Move composition into marked index detail pages

Roles `[roleId]/index.route.vue`:

- static route block above;
- typed `roleId`;
- resource-first DetailView;
- parent-owned `roles-detail` / `roles-permissions` tabs;
- RouterView fallback template:

```vue
<RouterView v-slot="{ Component }">
  <component :is="Component" v-if="Component" />
  <DetailView v-else title="Detail Role" :resource="roles" :id="roleId" />
</RouterView>
```

Delete `roles.layout.vue`. Repeat for users; delete `users.layout.vue`. Keep overtime unmarked.

Do not render DetailView unconditionally. Do not add default detail child.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web type-check
pnpm --filter @southneuhof/framework-web test -- --run src/router/__tests__/routes.spec.ts
rg -n "roles\\.layout|users\\.layout|roles-shell|users-shell|_parent\\.route" apps/web/src
rg -n "rendersChildren" apps/web/src/route-map.d.ts
```

Expected: type-check passes; named parents and children generated; old layouts/shells absent; marker
absent from generated map.

### Step 3: Prove parent rendering and child ignorance

Using real memory router, test:

- bare role URL renders tabs + DetailView;
- permissions URL renders tabs + child, not DetailView;
- Detail tab preserves `roleId`;
- users equivalent;
- parent file route-info union includes parent and descendants;
- child has no tab/subroute contract.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run src/router src/routes
```

### Step 4: Complete Tabs and permission behavior

Add Tabs tests: order, inherited params, active state, denied omission, sibling query, unresolved name.
Remove first-valid-shell guard, implicit `meta.tabs`, string child discovery, unused query mode, and
`detail-shells.ts`.

Install app access adapter. Register FrameworkPlugin before router. Add guard tests for no permission,
allowed/denied direct entry, fallback, no sibling search, and Tabs/guard agreement.

**Verify**:

```sh
rg -n "createFirstValidTabGuard|meta\\.tabs|visibleTabs|queryKey|detail-shells" apps/web/src
pnpm --filter @southneuhof/framework-web test -- --run src/router/__tests__/tabs.spec.ts src/router/__tests__/guards.spec.ts
```

### Step 5: Finish identity/type cleanup

Delete `identityFromRoute`, `identityKeys`, related population/exports/tests/docs. Preserve scalar,
tuple composite, and arbitrary function identities.

Replace param casts and `?? ''` with typed route params. Composite route mapping remains explicit.
Repair composite fixture with valid generated names or path-based RouteLocationRaw; never fake names
or weaken target types.

**Verify**:

```sh
rg -n "identityFromRoute|identityKeys|params as \\{|\\?\\? ''" apps/web/src packages/is-vue-framework/src
pnpm --filter @southneuhof/is-vue-framework type-check
pnpm --filter @southneuhof/is-vue-framework test
pnpm --filter @southneuhof/framework-web type-check
```

### Step 6: Docs and full gates

Document marked in-folder index parent convention, fallback detail, parent-owned tabs/outlet,
child-owned ordinary metadata, marker stripping, explicit identity, and direct permission fallback.
Regenerate route map and graph.

```sh
node plans/proofs/031-index-parent/prove.mjs
pnpm --filter @southneuhof/is-vue-framework type-check
pnpm --filter @southneuhof/is-vue-framework test
pnpm --filter @southneuhof/framework-web type-check
pnpm --filter @southneuhof/framework-web test
pnpm --filter @southneuhof/framework-web build
graphify update .
```

All commands pass.

## Done criteria

- [ ] Proof fixture passes.
- [ ] All ID-context files remain under `[roleId]/` / `[userId]/`.
- [ ] Marked index is generated as named parent with typed params/children.
- [ ] Marker stripped from runtime/generated route meta.
- [ ] Unmarked indexes unchanged.
- [ ] Parent index owns DetailView fallback, tabs, RouterView.
- [ ] Record-specific layouts/shell names absent.
- [ ] Children contain no tab/subroute contract.
- [ ] Access adapter drives guard/Tabs before initial navigation.
- [ ] Identity reflection/casts/fallbacks gone; composite mapping typed.
- [ ] Framework/web tests/types/build pass; docs/graph updated.

## STOP conditions

- Unmodified proof fails against installed dependency.
- App transformer matching proof loses name/component/meta/params/children. Capture generated route
  array and route-map diff; do not change filename design.
- Static marker is unavailable in `beforeWriteFiles`.
- Existing default component conflicts with marked index outside roles/users.
- RouterView fallback cannot distinguish bare parent from child.
- Typed shared param requires cast/reflection after generated parent-file union is correct.

## Maintenance notes

- Marker is explicit because index + siblings is ambiguous; overtime demonstrates this.
- Marker is build-only and must never leak into runtime meta.
- Parent owns composition; children remain reusable screens.
- Proof is executable evidence, not production implementation.
