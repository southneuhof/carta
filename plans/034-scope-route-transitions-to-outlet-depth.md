# Plan 034: Scope route transitions to the RouterView record they render

> **Implementation instructions**: Follow this plan step by step. Run every verification command
> and confirm expected results before continuing. Fix transition ownership generically in
> `AppRouterView`; do not suppress transitions from `Tabs` or detect automatic redirects.
> Parent-to-child navigation must preserve the parent instance while the nested outlet transitions.
>
> **Drift check (run first)**:
> ```sh
> git diff --stat e4f345c..HEAD -- \
>   apps/web/src/components/routing \
>   'apps/web/src/routes/(authenticated)/settings/roles/[roleId]/_parent.route.vue' \
>   'apps/web/src/routes/(authenticated)/settings/users/[userId]/_parent.route.vue' \
>   apps/web/src/router/__tests__/detail-parents.spec.ts \
>   apps/web/src/stores/keyManager.ts \
>   docs/architecture
> ```
> Plans 032–033 are expected uncommitted changes. Compare live files against Current state and pinned
> hashes below. Any unrelated mismatch is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (transition keys control component reuse and route-param freshness)
- **Depends on**: `plans/032-typed-route-manifest-native-parents.md`,
  `plans/033-auto-select-first-valid-tab.md`
- **Category**: bug / architecture
- **Planned at**: commit `e4f345c`, 2026-07-27, with Plans 032–033 implemented in working tree

## Why this matters

`Tabs` now replaces a bare named detail parent with its first permitted child. Vue Router correctly
keeps the matched detail parent mounted, but `AppRouterView` keys its transition wrapper with the
deepest `route.path`. Adding `/permissions` therefore changes the outer key and forces the entire
detail route page through `vfade`; only the app shell remains stable.

Transition ownership must match RouterView nesting. An outlet should transition only when the route
record rendered by that outlet—or that record's own parameter identity—changes. A deeper child must
not reanimate its ancestors.

## Locked behavior

1. Keep Plan 033's `router.replace()` behavior unchanged. Transition logic must not know whether
   navigation came from `Tabs`, a link, code, Back/Forward, or direct entry.
2. Every `AppRouterView` derives its transition key from the component-bearing matched route record
   rendered at that specific RouterView depth.
3. Key includes:
   - rendered record identity/name;
   - concrete path resolved by that named record while Vue Router inherits its relevant current
     params;
   - `keyManager` refresh value for that rendered record.
4. Key excludes deeper route records, deeper-only params, query, hash, and deepest `route.name`.
5. Componentless records are skipped exactly as Vue Router's `RouterView` depth selection skips
   them.
6. Parent detail navigation:

   ```text
   /settings/roles/7
   → /settings/roles/7/permissions
   ```

   keeps `roles-detail` mounted. Only nested child enters.
7. Sibling child navigation:

   ```text
   /settings/roles/7/permissions
   → /settings/roles/7/edit
   ```

   keeps `roles-detail` mounted and transitions child outlet.
8. Record identity navigation:

   ```text
   /settings/roles/7/permissions
   → /settings/roles/8/permissions
   ```

   changes outer detail key, remounting/transitioning the detail route page so setup-time ID reads
   remain fresh.
9. List → detail, detail → list, authenticated → public, and other route-record changes retain
   existing full route-page transition.
10. Query/hash-only changes do not transition, matching current `route.path` behavior.
11. Shell/sidebar/inbox remain outside this transition boundary and never remount because of child
    navigation.
12. Native parents use the existing `AppRouterView` as their explicit child outlet. No new route
    meta, transition prop, depth prop, manifest field, or second transition component.

## Current state

- `apps/web/src/components/routing/AppRouterView.vue:7-11` reads the deepest route and keys the
  wrapper by full path plus deepest route refresh state:

  ```ts
  const route = useRoute()

  const routeViewKey = computed(() => {
    return `${route.path}${String(keyManager().value[String(route.name)])}`
  })
  ```

- `apps/web/src/components/routing/AppRouterView.vue:15-28` owns the app route-page transition:

  ```vue
  <RouterView v-slot="{ Component }">
    <Transition name="vfade" mode="out-in" appear>
      <div v-if="Component" :key="routeViewKey">
        <Suspense :timeout="0">
          <component :is="Component" />
          <!-- spinner fallback -->
        </Suspense>
      </div>
    </Transition>
  </RouterView>
  ```

- `authenticated.layout.vue` and `public.layout.vue` use `AppRouterView`, so their shells remain
  outside its transition.
- Roles/users `_parent.route.vue` currently render plain `<RouterView />`; child swaps have no
  independent transition boundary.
- Both detail parents read IDs once during setup:

  ```ts
  const route = useRoute('roles-detail')
  const roleId = route.params.roleId
  ```

  Therefore record-param changes must still replace the parent instance; making every same-record
  navigation reuse forever would display stale IDs.
- `apps/web/src/stores/keyManager.ts` stores route-keyed refresh toggles. No in-repo caller currently
  invokes `triggerChange`, but `AppRouterView` must preserve record-scoped refresh semantics.
- Installed `vue-router@5.1.0` publicly exports `viewDepthKey`. Its RouterView implementation reads
  injected depth, advances past matched records without `components`, renders the selected record,
  then provides `depth + 1` to descendants.
- Installed-router proof confirms `router.resolve({ name: 'roles-detail' })` while currently at
  `/roles/7/members/9` yields `/roles/7`: relevant current params are inherited without forwarding
  child-only params. Passing the full leaf `route.params` also resolves but emits a discarded-param
  warning and must not be used.
- No AppRouterView-specific test exists.
- `detail-parents.spec.ts` proves detail-under composition but mocks only `Tabs`.
- Architecture docs still prescribe a plain child `RouterView`, which this plan supersedes with the
  transition-aware outlet.

Pinned pre-plan hashes:

```text
fc97934f7ec985404e590a24ade09bec4412a828157ad26ee52f57458aa6a6b6  apps/web/src/components/routing/AppRouterView.vue
8382afb34e727692d099a8e9d8e362533ae41a52da35e403f51dd92f3d951668  apps/web/src/stores/keyManager.ts
764cfab64fdc0a12a4f979081ab051ddd876f3c1f0c0a5a1c9858429cf8b4468  apps/web/src/routes/(authenticated)/settings/roles/[roleId]/_parent.route.vue
d4e9555e209431dcb6a79f957fe3fee3c2a00e0fad64f295c59524c3a952d1b3  apps/web/src/routes/(authenticated)/settings/users/[userId]/_parent.route.vue
c746208fc661561b962f8db9b8ae3c40780abecbff89b37995d91b437509125a  apps/web/src/router/__tests__/detail-parents.spec.ts
```

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused tests | `pnpm --filter @southneuhof/framework-web test -- --run src/components/routing/AppRouterView.spec.ts src/router/__tests__/detail-parents.spec.ts src/router/__tests__/tabs.spec.ts` | all pass |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | all pass |
| Type-check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Lint | `pnpm --filter @southneuhof/framework-web lint` | exit 0 |
| Build | `pnpm --filter @southneuhof/framework-web build` | exit 0 |
| Graph refresh | `graphify update .` | exit 0 |

## Scope

**In scope**:

- `apps/web/src/components/routing/AppRouterView.vue`
- `apps/web/src/components/routing/AppRouterView.spec.ts` (create)
- one adjacent pure helper/test file only if needed to keep key derivation directly testable
- `apps/web/src/routes/(authenticated)/settings/roles/[roleId]/_parent.route.vue`
- `apps/web/src/routes/(authenticated)/settings/users/[userId]/_parent.route.vue`
- `apps/web/src/router/__tests__/detail-parents.spec.ts`
- `docs/architecture/resource-migration-guide.md`
- `docs/architecture/routing-and-controls-review.md`
- `docs/architecture/web-application-architecture.md`
- generated `graphify-out/**` from required refresh
- `plans/README.md`

**Out of scope**:

- `Tabs.vue`, `router/tabs.ts`, or Plan 033 selection behavior
- route manifest, route tree, names, paths, guards, redirects, or generated route types
- `keyManager.ts` API/storage redesign
- detail parent ID reactivity refactor
- transition CSS, duration, easing, direction, or reduced-motion behavior
- app shell, Sidebar, NavigationDrawer, or NotificationInbox
- `DetailView`, permissions/user-role child screens, or data loading
- adding transition configuration to route meta
- changing Suspense behavior or spinner presentation
- extracting router behavior into `is-vue-framework`

## Git workflow

- Suggested branch: `codex/034-scope-route-transitions`
- Match existing conventional commits; suggested commit:
  `fix(web): scope transitions to route outlet depth`
- Do not stage, commit, push, or open a PR unless operator requests it.

## Steps

### Step 1: Add lifecycle characterization for nested route transitions

Create `apps/web/src/components/routing/AppRouterView.spec.ts`. Use real Vue Router with
`createMemoryHistory()` and named component-bearing records:

```text
root shell
└─ roles-detail /roles/:roleId
   ├─ roles-permissions permissions
   └─ roles-update edit
```

The root shell renders `AppRouterView`. The detail component renders stable parent content plus a
nested `AppRouterView`. Instrument setup/mount/unmount counters for shell, detail, permissions, and
edit components. Use Vue Test Utils' transition stubbing or an equivalent deterministic no-CSS
test setup; do not sleep for the production 200 ms animation.

Characterize these cases:

1. `/roles/7` → `/roles/7/permissions`: shell/detail mount counts unchanged; permissions mounts.
2. `/roles/7/permissions` → `/roles/7/edit`: shell/detail unchanged; permissions leaves; edit mounts.
3. `/roles/7/permissions` → `/roles/8/permissions`: shell unchanged; detail remounts once with ID 8.
4. `/roles` list → `/roles/7/permissions`: route-page record changes and detail mounts as new page.
5. query/hash-only change on a child: no parent or child remount.
6. componentless matched record before a rendered record: correct depth still selected.
7. nested route depth of at least three rendered outlets: changing deepest child remounts no
   ancestor.

Also assert current broken behavior before Step 2: parent detail remounts when a child is added or
changed because outer key uses deepest `route.path`. This is an expected red test, not a STOP.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run src/components/routing/AppRouterView.spec.ts
```

Expected before implementation: parent-retention cases fail; test harness itself mounts and
navigates successfully. Continue to Step 2.

### Step 2: Derive the record rendered by this outlet's depth

In `AppRouterView.vue`:

1. Import and inject Vue Router's exported `viewDepthKey`.
2. Read injected depth with `unref`; default to `0` only for standalone/root usage.
3. Starting at that depth, advance while `route.matched[depth]` exists and has no `components`,
   matching installed RouterView selection.
4. Return that exact `RouteRecordNormalized` as the rendered record for this `AppRouterView`.

Do not use:

- `route.matched.at(-1)`—that is deepest child;
- a fixed index—layouts and componentless groups shift depth;
- first/last default-component search—must match RouterView's own depth semantics;
- a new `depth` prop—nesting already provides depth;
- route meta—transition ownership is structural.

If Vue Router's exported depth value does not match the record actually rendered by its RouterView
in the focused test, use the STOP condition and report both values. Do not invent independent depth
configuration.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run src/components/routing/AppRouterView.spec.ts
```

Expected: depth/componentless selection assertions pass; key/remount assertions may remain red until
Step 3.

### Step 3: Key transition by rendered record and its own concrete path

Replace full-leaf `routeViewKey` derivation with a key based on the rendered record:

```text
<record identity> : <resolved concrete record path> : <record refresh value>
```

Required mechanics:

1. Use rendered record `name` as stable identity.
2. Resolve `{ name: record.name }` through current router and take `.path`. Because the record is in
   the current matched chain, Vue Router inherits only params relevant to that named record. Do not
   pass the full leaf `route.params`; installed Vue Router discards child-only params but emits a
   warning.
3. Read `keyManager().value[String(record.name)]`, not the deepest `route.name`.
4. Keep query/hash out of key.
5. Preserve existing keyed wrapper, `Transition name="vfade" mode="out-in" appear`, Suspense, and
   spinner.

All production component-bearing routes are named by the typed manifest. Still handle a temporarily
missing record/name without throwing during initial render: use a stable non-leaf fallback such as
the selected record's pattern path. Do not fall back to full `route.path`, which reintroduces bug.

Add direct assertions for key semantics, either through lifecycle behavior in the SFC test or a
small adjacent pure helper:

- same parent name + same parent params + different child → equal outer key;
- same parent name + different parent param → different outer key;
- different record name at same URL shape → different key;
- child-only param → equal parent key;
- query/hash-only → equal key;
- refresh toggle for parent record → different parent key;
- refresh toggle for child record → does not change parent key but changes nested key.
- no discarded-invalid-param warning when a child owns additional params.

Do not remove the key entirely. That would avoid child remounts but also reuse setup-time `roleId`
when navigating from role 7 to role 8.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run src/components/routing/AppRouterView.spec.ts
```

Expected: all transition-key and lifecycle cases pass.

### Step 4: Make native detail parents own transition-aware child outlets

In roles and users `_parent.route.vue`:

1. Import `AppRouterView` from `@/components/routing/AppRouterView.vue`.
2. Replace plain `<RouterView />` with `<AppRouterView />`.
3. Keep `DetailView` and `Tabs` order and unconditional rendering.
4. Keep scripts, typed params, resources, and tab declarations unchanged.

Final shape:

```vue
<DetailView ... />
<Tabs ... />
<AppRouterView />
```

This remains an explicit parent-owned subroute entrypoint. It adds animation ownership, not content
fallback or route selection.

Update `detail-parents.spec.ts` so it remains deterministic with nested transitions. Prefer real
`AppRouterView` plus transition stubbing when practical; mock it to a plain RouterView only if the
new dedicated AppRouterView test already proves lifecycle/animation semantics. Preserve assertions
that detail and child each render exactly once.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run \
  src/components/routing/AppRouterView.spec.ts \
  src/router/__tests__/detail-parents.spec.ts \
  src/router/__tests__/tabs.spec.ts
```

Expected: all pass. Tab auto-selection remains unchanged; parent detail instance survives resulting
child replacement.

### Step 5: Update architecture guidance

Update the three in-scope architecture documents:

- replace “plain RouterView” in native detail-parent guidance with transition-aware
  `AppRouterView`;
- define one transition boundary per rendered RouterView depth;
- state that keys use rendered record + its concrete param path, never full leaf route;
- record expected parent-to-child, sibling-child, parent-param, and query/hash behavior;
- retain component-owned first-valid-tab selection from Plan 033;
- state that `Tabs` does not control or suppress animation;
- state that shells remain outside route-page transition.

Do not edit completed Plans 032 or 033. Plan 034 and current architecture docs supersede only their
plain-child-outlet transition detail.

**Verify**:

```sh
rg -n "AppRouterView|transition boundary|outlet depth|rendered record|concrete.*path" \
  docs/architecture/resource-migration-guide.md \
  docs/architecture/routing-and-controls-review.md \
  docs/architecture/web-application-architecture.md
```

Expected: all three documents describe depth-scoped transition ownership; no current architecture
guidance prescribes plain RouterView for animated native detail children.

### Step 6: Run full gates and refresh graph

Run:

```sh
pnpm --filter @southneuhof/framework-web lint
pnpm --filter @southneuhof/framework-web type-check
pnpm --filter @southneuhof/framework-web test
pnpm --filter @southneuhof/framework-web build
graphify update .
git status --short
```

Expected: all commands exit 0. Only pre-existing user changes plus files allowed by this plan are
modified. Review diff for accidental `Tabs`, manifest, route-name, CSS, or shell changes. After
implementation and review, mark Plan 034 `DONE` in `plans/README.md`.

## Test plan

Primary test: new `apps/web/src/components/routing/AppRouterView.spec.ts`, using real nested Vue
Router records and component lifecycle counters.

Required cases:

- bare parent → first child keeps parent;
- child → sibling child keeps parent and swaps child;
- parent param changes remount parent;
- route-page record changes remount page;
- query/hash changes do not remount;
- componentless matched records preserve depth;
- three-level nesting changes only deepest affected outlet;
- record-scoped `keyManager` refresh changes only intended outlet;
- missing record during initial render does not throw.

Regression tests:

- `detail-parents.spec.ts`: detail-under structure remains;
- `tabs.spec.ts`: automatic first-valid-child replacement remains;
- full web suite: public/authenticated layouts retain routing and transition component compatibility.

## Done criteria

- [ ] Outer `AppRouterView` key remains stable when only a deeper child changes.
- [ ] Outer key changes when its rendered record or that record's concrete params change.
- [ ] Query/hash and child-only params do not change ancestor keys.
- [ ] Componentless matched records use same depth selection as RouterView.
- [ ] Bare detail → first tab does not unmount/remount DetailView parent.
- [ ] Permissions ↔ edit transitions only nested child outlet.
- [ ] Role/user ID change remounts corresponding detail parent.
- [ ] List/detail and public/authenticated record changes retain route-page transition.
- [ ] Roles/users parents render `DetailView`, `Tabs`, `AppRouterView` unconditionally.
- [ ] `Tabs.vue`, route manifest, guards, resources, CSS, and shells remain unchanged.
- [ ] Focused and full web tests pass.
- [ ] Web lint, type-check, and build pass.
- [ ] Architecture docs describe depth-scoped transition ownership.
- [ ] `graphify update .` succeeds.
- [ ] `plans/README.md` status updated after review.

## STOP conditions

Stop and report; do not improvise if:

- Plans 032–033 are not complete or native detail parents/automatic tab replacement no longer match
  Current state.
- Installed Vue Router does not export `viewDepthKey`, or injected depth fails to identify the same
  record rendered by the colocated RouterView. Report minimal test, injected depth, full matched
  list, and observed component.
- A production component-bearing matched record is unnamed despite Plan 032's manifest equality
  invariant. Report route source and generated record; do not derive identity from deepest URL.
- Resolving `{ name: parentRecord.name }` does not inherit the parent record's current params, or
  emits a discarded-invalid-param warning. Report current route and resolved parent before adding a
  custom param parser.
- Preserving parent-param remount requires changing detail parent ID handling. That is outside this
  plan; report why record concrete path did not change.
- Correct behavior appears to require a `Tabs` flag, route meta, global navigation hook, CSS change,
  or manual depth prop.
- Focused verification fails twice after one reasonable in-scope correction.
- Work requires modifying a file outside Scope.

## Maintenance notes

- Transition boundary belongs to each `AppRouterView`, not each navigation event. New nested route
  parents that want animated children should render `AppRouterView` at their child outlet.
- `viewDepthKey` is a low-level but exported Vue Router integration. Re-run componentless/deep
  nesting tests when upgrading Vue Router.
- Concrete named-record path is intentional: it preserves setup-time param correctness without
  coupling ancestor transitions to descendant URL suffixes.
- Record-scoped `keyManager` means a child refresh animates/remounts only child outlet; parent
  refresh targets parent record name.
- Transition visual style remains `vfade`. This plan changes boundary, not appearance.
