# Plan 033: Make Tabs select the first valid child at bare parent URLs

> **Implementation instructions**: Follow this plan step by step. Run every verification command
> and confirm its expected result before moving on. This is a focused follow-up to Plan 032: keep
> resource detail targets pointed at named parent routes and make `Tabs` own default-child
> selection. Do not add route meta, redirect records, parent props, guards, or compatibility code.
>
> **Drift check (run first)**:
> ```sh
> git diff --stat e4f345c..HEAD -- \
>   apps/web/src/components/routing/Tabs.vue \
>   apps/web/src/router/tabs.ts \
>   'apps/web/src/routes/(authenticated)/settings/roles/[roleId]/_parent.route.vue' \
>   'apps/web/src/routes/(authenticated)/settings/users/[userId]/_parent.route.vue' \
>   apps/web/src/router/__tests__/tabs.spec.ts \
>   apps/web/src/router/__tests__/detail-parents.spec.ts \
>   docs/architecture
> ```
> Plan 032's uncommitted migration is expected. Compare live files against the excerpts and hashes
> below. Any other mismatch is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (a wrong ownership test can redirect valid sibling/deeper routes)
- **Depends on**: `plans/032-typed-route-manifest-native-parents.md`
- **Category**: bug / DX
- **Planned at**: commit `e4f345c`, 2026-07-27, with Plan 032's uncommitted implementation present

## Why this matters

Native detail parents deliberately render `DetailView`, `Tabs`, and a plain `RouterView`. Once the
detail entry is correctly removed from tab membership, a bare URL such as
`/settings/roles/7` has no selected child, leaving that outlet empty. Every parent should not need a
duplicate redirect or default-child declaration.

`Tabs` already owns ordered membership, target resolution, params, query preservation, and access
filtering. It must therefore replace a bare owning route with its first resolvable, permitted child.
The ownership check is load-bearing: “no active tab” is insufficient because it would also hijack
valid siblings such as `/settings/roles/7/edit`.

## Locked behavior

1. `RouteTab` entries represent child-content routes only. Parent detail routes never appear as tabs.
2. `resource.detail(id)` continues targeting the named detail parent. Resources do not know which
   child tab is first or currently permitted.
3. On a bare route that owns the mounted `Tabs`, select the first declared tab that resolves and
   passes `mayEnter()`.
4. Navigate with `router.replace()`, never `push()`, so Back does not revisit the redirecting parent.
5. Reuse current inherited params and namespaced sibling-query behavior.
6. One valid tab still redirects even though the existing `tabs.length > 1` rule hides the nav.
7. Zero valid tabs leaves the bare detail route intact.
8. Active tab, sibling child (`edit`), descendant route, and ancestor `Tabs` remain untouched.
9. Nested `Tabs` use the same rule recursively; only the component whose owning route is the current
   deepest component-bearing match may redirect.
10. No new prop, route meta, manifest field, redirect route, or global navigation guard.

## Current state

- `apps/web/src/components/routing/Tabs.vue:18-30` resolves ordered items with current params,
  removes unresolved/denied targets, and marks exact-name activity:

  ```ts
  const tabs = computed(() => {
    return props.items.flatMap((item) => {
      let target
      try {
        target = router.resolve({ name: item.name, params: route.params })
      } catch {
        return []
      }
      if (target.name !== item.name || !target.matched.length) return []
      if (!mayEnter(target.meta)) return []
      return [{ ...item, to: target, active: route.name === item.name }]
    })
  })
  ```

- `apps/web/src/components/routing/Tabs.vue:32-44` preserves only dotted sibling query keys and hides
  nav when fewer than two tabs exist. Preserve both rules.
- `apps/web/src/router/tabs.ts:3-7` already documents entries as ordered child routes; no contract
  field is missing.
- `apps/web/src/routes/(authenticated)/settings/roles/[roleId]/_parent.route.vue:11-14` contains one
  real child and a stale commented detail item:

  ```ts
  const tabs: RouteTab[] = [
    // { name: 'roles-detail', label: 'Detail' },
    { name: 'roles-permissions', label: 'Permissions' },
  ]
  ```

- `apps/web/src/routes/(authenticated)/settings/users/[userId]/_parent.route.vue:11-14` still
  declares `users-detail` as a tab before `users-roles`.
- Both parent templates render `DetailView`, `Tabs`, and plain `RouterView` unconditionally. Keep
  that shape.
- `apps/web/src/router/__tests__/tabs.spec.ts` still models detail as a tab and has no navigation
  side-effect assertions.
- `apps/web/src/router/__tests__/detail-parents.spec.ts` mocks `Tabs`; it proves parent composition,
  not default-child navigation. Keep that separation unless a small assertion rename is required.
- `docs/architecture/web-application-architecture.md:660-669` still describes marked indexes and a
  detail fallback. Other architecture docs describe native `_parent` but omit automatic child
  selection.

Pinned pre-plan hashes:

```text
ff970532eac2ef91560869def754f534819a9381df61aa9ac25f4372ca2abf4e  apps/web/src/components/routing/Tabs.vue
6106dd3648a335e08af430a8be549466772962ba6c9d3fe184d5a274e6580e0c  apps/web/src/router/tabs.ts
d1ee00045cc568f7503b4aeefa1380113969f6eacd9fc36682c973aa51de8c86  apps/web/src/routes/(authenticated)/settings/roles/[roleId]/_parent.route.vue
16491ff977abc686c931f17a6afac8d986e9e057c1d5d6c8d4a800b177d351f8  apps/web/src/routes/(authenticated)/settings/users/[userId]/_parent.route.vue
f68594a34d1ab9d573bb223a3b5d39ab15d6025b4cd744282526d18aced823d0  apps/web/src/router/__tests__/tabs.spec.ts
c746208fc661561b962f8db9b8ae3c40780abecbff89b37995d91b437509125a  apps/web/src/router/__tests__/detail-parents.spec.ts
```

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused tests | `pnpm --filter @southneuhof/framework-web test -- --run src/router/__tests__/tabs.spec.ts src/router/__tests__/detail-parents.spec.ts src/router/__tests__/routes.spec.ts` | all tests pass |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | all tests pass |
| Type-check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Lint | `pnpm --filter @southneuhof/framework-web lint` | exit 0 |
| Build | `pnpm --filter @southneuhof/framework-web build` | exit 0 |
| Graph refresh | `graphify update .` | exit 0 |

## Scope

**In scope**:

- `apps/web/src/components/routing/Tabs.vue`
- `apps/web/src/router/tabs.ts` only if its child-only documentation needs tightening
- `apps/web/src/router/__tests__/tabs.spec.ts`
- `apps/web/src/router/__tests__/detail-parents.spec.ts` only for assertions directly invalidated
  by automatic selection
- `apps/web/src/routes/(authenticated)/settings/roles/[roleId]/_parent.route.vue`
- `apps/web/src/routes/(authenticated)/settings/users/[userId]/_parent.route.vue`
- `docs/architecture/resource-migration-guide.md`
- `docs/architecture/routing-and-controls-review.md`
- `docs/architecture/web-application-architecture.md`
- generated `graphify-out/**` from required refresh
- `plans/README.md`

**Out of scope**:

- route manifest schema/application and generated `route-map.d.ts`
- filesystem route structure or route names/paths
- resource route targets and adapters
- permission semantics or `mayEnter()`
- global guards, redirects, aliases, or route meta
- `DetailView`, `RouterView`, or detail-under presentation
- changing exact-name tab active-state semantics
- showing a one-tab nav
- query preservation beyond existing dotted sibling keys
- generic router/framework extraction

## Git workflow

- Suggested branch: `codex/033-auto-select-first-valid-tab`
- Match existing conventional commits; suggested commit:
  `fix(web): select first valid detail tab`
- Do not stage, commit, push, or open a PR unless operator requests it.

## Steps

### Step 1: Characterize automatic selection before changing Tabs

Rewrite the `apps/web/src/router/__tests__/tabs.spec.ts` fixture so `items` contains child routes
only. Give its router enough routes to distinguish:

- owning parent: `roles-detail`;
- first and second tab children: e.g. `roles-permissions`, `roles-members`;
- non-tab sibling: `roles-update`;
- deeper descendant under a tab;
- optional componentless record between owner and tab, if needed to prove scanning behavior.

Allow each test to supply initial URL, items, and permission behavior. Await navigation with
`vi.waitFor()` rather than assuming one `nextTick()` completes `router.replace()`.

Add failing tests for:

1. bare parent replaces to first valid child with inherited `roleId`;
2. first denied/unresolved item is skipped and second valid item is selected;
3. zero valid items causes no navigation;
4. one valid item redirects while nav remains hidden;
5. existing namespaced query keys survive and unrelated query keys are dropped, matching links;
6. current tab causes no replacement;
7. non-tab sibling `roles-update` causes no replacement;
8. a deeper descendant causes no replacement;
9. nested owner fixture allows only deepest owning `Tabs` to select its child;
10. mixed-owner or ownerless tab targets fail safe with no automatic replacement;
11. navigation calls `replace`, not `push`, and does not loop after route settles.

Keep existing order, visibility, active-state, and unresolved-target coverage.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run src/router/__tests__/tabs.spec.ts
```

Expected before implementation: new redirect tests fail for missing navigation; existing behavior
tests remain meaningful. Continue directly to Step 2.

### Step 2: Infer the owning route from resolved tab targets

Implement small typed helpers inside `Tabs.vue`; do not create a new abstraction module.

For each resolved, permitted tab:

1. Treat its final matched record as the tab target.
2. Walk backward through earlier `target.matched` records.
3. Select the nearest record with `components?.default`; this is that tab's rendered owner.
4. Use normalized route-record object identity. Vue Router returns the same matched record objects
   from `router.resolve()` and `route.matched`; existing route tests already use `includes()` for
   this relationship.

Derive one owner only when every currently valid tab yields the same record. One tab is sufficient.
Componentless grouping records must be skipped. If any valid target has no component-bearing
ancestor, or valid targets disagree on owner, return no owner and perform no automatic navigation.
Links may still render; invalid ownership must never guess.

Derive the current deepest component-bearing matched record with the same predicate. This avoids
route-depth assumptions and supports native parents nested to arbitrary depth.

Do not compare route names, URL prefixes, path strings, active-tab absence, or a fixed
`matched.length`. Those approaches respectively fail for unnamed records, dynamic params,
componentless records, siblings, or recursive nesting.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run src/router/__tests__/tabs.spec.ts
```

Expected: ownership edge-case tests pass; redirect tests may remain failing until Step 3.

### Step 3: Replace the bare owner with the first valid tab

Add a reactive effect/watch in `Tabs.vue` over current matched route, resolved valid tabs, and
preserved sibling query.

Navigate only when all are true:

- at least one resolved/permitted tab exists;
- one unambiguous owner was inferred;
- current deepest component-bearing record is that exact owner;
- the computed destination is not already pending/current.

Call:

```ts
router.replace({
  path: firstTab.to.path,
  query: siblingQuery(),
})
```

Use first item from the already filtered `tabs` computed so declaration order, resolution, and
`mayEnter()` remain single sources of truth. Prevent duplicate in-flight replacement if reactive
dependencies update before navigation settles. Handle Vue Router navigation completion without an
unhandled promise rejection. Once child route becomes current, owner equality naturally becomes
false and ends the effect.

Do not redirect based on `route.name !== firstTab.name` or “no tab is active”; both conditions are
also true on `roles-update` and would hijack edit.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run src/router/__tests__/tabs.spec.ts
```

Expected: all tab tests pass, including exact one-call `replace` and zero-call sibling/deeper cases.

### Step 4: Remove parent detail entries from every tab declaration

In roles parent, delete the commented `roles-detail` line. In users parent, delete the live
`users-detail` item. Keep only actual child-content route entries and preserve their explicit order.
Prefer the existing `as const satisfies readonly RouteTab[]` spelling for both parents so names and
order stay literal without mutable widening.

Do not change parent templates, resource detail targets, manifest entries, or route names.

Add/adjust a lightweight assertion in the closest existing parent test only if needed to prove
detail route names are absent from tab declarations. Avoid brittle source-text tests when the
Tabs behavior test already proves the contract.

**Verify**:

```sh
rg -n "\\{ name: '(roles|users)-detail'.*label" \
  'apps/web/src/routes/(authenticated)/settings/roles/[roleId]/_parent.route.vue' \
  'apps/web/src/routes/(authenticated)/settings/users/[userId]/_parent.route.vue'
```

Expected: no matches.

Then:

```sh
pnpm --filter @southneuhof/framework-web test -- --run \
  src/router/__tests__/tabs.spec.ts \
  src/router/__tests__/detail-parents.spec.ts \
  src/router/__tests__/routes.spec.ts
```

Expected: all focused tests pass. Route resolution still maps bare URLs to named detail parents;
mounted `Tabs` owns the later replacement.

### Step 5: Document parent URL and Tabs ownership

Update the three in-scope architecture documents. Replace stale marked-index/fallback wording with:

- native `_parent.route.vue` owns unconditional detail-under rendering;
- `RouteTab` lists child-content routes only;
- `Tabs` infers its owner from Vue Router matched records;
- bare owner URL replaces to first resolvable/permitted declared child;
- no valid child leaves parent intact;
- siblings/deeper routes are not redirected;
- `replace` prevents a Back loop;
- resource detail targets remain parent targets;
- component-owned redirect may occur after parent setup, unlike a pre-navigation guard.

Do not edit completed historical Plans 028, 031, or 032. Their status and supersession history must
remain intact; Plan 033 and current architecture docs carry the new decision.

**Verify**:

```sh
rg -n "first valid|first-valid|bare.*parent|router\\.replace|child-content" \
  docs/architecture/resource-migration-guide.md \
  docs/architecture/routing-and-controls-review.md \
  docs/architecture/web-application-architecture.md
```

Expected: current behavior is discoverable in architecture docs and no current guidance says parent
detail routes belong in tab membership.

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

Expected: every command exits 0; only pre-existing user changes plus files allowed by this plan are
modified. Review diff specifically for accidental route-manifest, resource-target, or guard edits.
After implementation and review, mark Plan 033 `DONE` in `plans/README.md`.

## Test plan

Use `apps/web/src/router/__tests__/tabs.spec.ts` as main integration-style component test with
`createMemoryHistory()` and real Vue Router records. Mock only `mayEnter()` as current tests do.

Required coverage:

- first declared valid child;
- denied and unresolved leading children;
- no valid child;
- single hidden-nav child;
- params and dotted sibling query;
- active child;
- sibling edit;
- deeper descendant;
- componentless intermediate;
- recursive nested owners;
- mixed/ownerless configuration;
- replace-not-push;
- no replacement loop.

Keep `detail-parents.spec.ts` focused on structural rendering. Keep `routes.spec.ts` proving bare URLs
resolve to named parents before component-owned replacement.

## Done criteria

- [ ] Bare roles/users parent navigation settles on first permitted child tab.
- [ ] Selection uses `router.replace()` exactly once and preserves inherited params plus dotted
  sibling query.
- [ ] First denied/unresolved items are skipped.
- [ ] Zero valid tabs leaves parent route unchanged.
- [ ] One valid tab redirects while nav remains hidden.
- [ ] Active tab, edit sibling, deeper descendant, and ancestor tab bars do not redirect.
- [ ] Ownership inference skips componentless records and works recursively without depth limits.
- [ ] Parent detail route names appear in no `RouteTab` declaration.
- [ ] No new prop, meta, redirect record, route guard, resource target, or compatibility layer.
- [ ] Focused and full web tests pass.
- [ ] Web lint, type-check, and build pass.
- [ ] Architecture docs describe final behavior.
- [ ] `graphify update .` succeeds.
- [ ] `plans/README.md` status updated after review.

## STOP conditions

Stop and report; do not improvise if:

- Plan 032 is not complete or roles/users no longer use native `_parent.route.vue`.
- `router.resolve(tabTarget).matched` does not retain normalized record identity compatible with
  `route.matched` in the installed Vue Router version. Report a minimal failing test and both matched
  record shapes.
- A valid tab target is not represented by a final component-bearing matched record. Report its
  name and matched records before proposing another inference rule.
- Correct behavior appears to require route meta, a new `Tabs` prop, a global guard, or changing
  resource detail targets.
- Parent detail must disappear instead of remaining mounted during child rendering; that contradicts
  locked detail-under design.
- Any verification command fails twice after one reasonable in-scope correction.
- Work requires modifying a file outside Scope.

## Maintenance notes

- `Tabs` performs component-owned default navigation. A short parent-only render before replacement
  is allowed; moving this pre-navigation would require explicit router configuration and is a
  different design.
- Reviewer should scrutinize owner identity and sibling/deeper negative tests more than happy path.
- Future tab permissions automatically affect default selection because resolved visible tabs remain
  source of truth.
- Future nested tab bars need no depth configuration. Each target list must still share one rendered
  owner; mixed owners deliberately disable automatic selection.
- Exact-name active styling remains unchanged by this plan. Descendant-aware active styling can be
  considered separately if a real nested-tab UI needs it.
