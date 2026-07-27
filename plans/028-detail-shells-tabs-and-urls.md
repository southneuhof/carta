# Plan 028: Detail shells, first-valid-tab resolution, and the /detail URL convention

> **Implementation instructions**: Follow this plan step by step. Run every verification command and
> confirm the expected result before moving to the next step. If anything in the "STOP conditions"
> section occurs, stop and report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**:
> ```sh
> git diff --stat e4f345c..HEAD -- apps/web/src packages/is-vue-framework/src
> ```
> Changes attributable to plans 026–027 (DONE) are expected. If the route tree under
> `apps/web/src/routes/(authenticated)`, `src/router/file-routing/layout-groups.ts`, or the resource
> adapters differ otherwise from the excerpts below, reconcile before proceeding. The specification
> is the Addendum of `docs/architecture/routing-and-controls-review.md`.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED-HIGH (routing plugin change + URL migration; mitigated by the clean-break decision)
- **Depends on**: `plans/026-declared-identity-shapes.md`, `plans/027-fold-controls-into-factories.md`
- **Category**: web architecture (identity / controls / routing track)
- **Planned at**: commit `e4f345c`, 2026-07-27

## Why this matters

Today `/settings/users/:userId` is simultaneously a shell and its first tab: the parent
`[userId].route.vue` is an addressable screen holding a hand-written tab bar, and "detail" is
smuggled in as the parent's index child. The decided design (review note §1 + Addendum): detail is
always an explicit `/detail` sibling; the shell is a `.layout.vue` inside the folder; a single
global guard resolves the parent URL to the first tab the caller may see; the shell's `meta.tabs`
array is the single source for both the guard and the tab bar, so they cannot disagree; child route
meta carries the permission identity that also guards direct URL entry.

## Current state

- `src/router/file-routing/layout-groups.ts` — `applyRouteGroupLayouts` promotes a group's single
  direct `*.layout.vue` onto the `(group)` node and **throws** for a `.layout.vue` anywhere else
  (`:22-24`). Spec: `src/router/__tests__/layout-groups.spec.ts`. Wired via `beforeWriteFiles` in
  `apps/web/vite.config.ts`.
- Tab shells: `settings/users/[userId].route.vue` and `settings/roles/[roleId].route.vue` — each a
  hand-written `tabs` array, a `siblingQuery()` filter (keeps `*.*`-namespaced table params across
  tab switches), and a `<RouterView />`.
- Detail-as-index: `settings/users/[userId]/index.route.vue` (name `users-detail`),
  `settings/roles/[roleId]/index.route.vue`, `hr/overtimes/[overtimeId]/index.route.vue` (no shell —
  no tabs). Non-tab children: `edit.route.vue` under all three; `roles/` and `permissions/` tab
  folders.
- Resource route targets to migrate (all in `apps/web/src/framework/adapters/resources/`):
  `users.ts` / `roles.ts` / `overtimes.ts` — `detail: (id) => '/…/${id}'`.
- Hard-coded detail paths outside adapters: the typed deep-link registry from plan 025 and any
  literals — inventory with
  `grep -rn "settings/users/\|settings/roles/\|hr/overtimes/" apps/web/src apps/base-mobile/src --include='*.ts' --include='*.vue'`.
- Route names (`users-detail`, `roles-permissions`, …) are referenced via the generated route map —
  `apps/web/src/route-map.d.ts`.
- Access adapter: available per plan 027 Step 1 (runtime `adapters.access`, optional).

## Commands you will need

| Purpose | Command |
|---|---|
| Web dev server | `pnpm dev` |
| Web tests | `pnpm --filter @southneuhof/framework-web test` |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` |
| Web build | `pnpm --filter @southneuhof/framework-web build` |
| Path-literal sweep | the `grep` under Current state |

## Scope

**In scope**:

- `src/router/file-routing/layout-groups.ts` + spec (extend `.layout.vue` semantics)
- New router integration modules under `apps/web/src/router/` (guard, tab helpers) and a `Tabs`
  component in the app's component layer (router-coupled ⇒ **not** in `is-vue-framework`)
- Route tree moves/renames under `settings/users`, `settings/roles`, `hr/overtimes`
- Resource adapters' `routes.detail` targets; deep-link registry entries; route specs
- Identity auto-assembly helper (route params → declared identity keys) — router-coupled, lives here

**Out of scope**:

- Legacy URL redirects (clean break decided; the catch-all `[...path].route.vue` keeps handling
  unknown URLs)
- Query-backed `Tabs` consumers (the mode ships with the component; no current screen needs it)
- `is-vue-framework` core changes (must stay router-agnostic)
- `apps/base-mobile` navigation policy changes beyond updating literals the sweep finds

## Steps

### Step 1: Extend `.layout.vue` semantics in the routing plugin

New rule in `applyRouteGroupLayouts` (per the Addendum): exactly one `*.layout.vue` **direct child of
any route directory** becomes that directory's route component, wrapping its children.

- `(group)` position: unchanged promotion onto the group node (existing behavior and error for
  multiples).
- Non-group position (e.g. `settings/users/[userId]/users.layout.vue`): set the directory node's
  component to the layout, carry its `definePage` meta/name onto the node, delete the layout child.
  Throw on multiple direct layouts in one directory (mirror the group error).
- Delete the old "file named after sibling directory" parents in Step 3; the plugin change itself
  must be a no-op for the current tree (no non-group layouts exist yet).

**Verify**: extend `layout-groups.spec.ts` — group promotion unchanged; non-group lift sets
component/meta/name; multiple-layouts throw; a `.layout.vue` at routes root still throws. Web build
green before any tree move.

### Step 2: Guard, tab helpers, and `Tabs`

New module (e.g. `src/router/detail-shells.ts`):

- **Meta contract**: shell layout declares
  `definePage({ meta: { tabs: [{ path: 'detail', label: 'Detail' }, …] } })`; each child route
  declares `meta: { permission: '<resource>.<operation>' }`. Type both via the router's
  `RouteMeta` augmentation.
- **Guard** (`router.beforeEach`): when the resolved target is a shell record itself (matched leaf
  has `meta.tabs`), walk `tabs` in order → resolve each `path` against the shell's children → check
  the child's `meta.permission` with the runtime access adapter (absent adapter = allow, matching
  controls semantics) → redirect to the first pass, **preserving namespaced query params** (the
  `siblingQuery` dot-filter, now implemented once here). All tabs denied → redirect to the app's
  403/fallback, never an empty shell.
- **`Tabs` component** (app components, router-coupled): route mode reads `meta.tabs` + child
  permissions (same two sources as the guard — no private copy) and renders links preserving the
  sibling query; query mode takes `items` + a namespaced param name (`?<ns>.tab=x`) for n adjacent
  panels on one route. Document in the component: query mode has no per-tab access control and no
  code-splitting.
- **Identity auto-assembly helper**: `identityFromRoute(resource, route)` picks the resource's
  declared identity keys off `route.params` by name (fallback `route.query`), returns the typed
  identity object (values are strings by convention). Throws a dev-readable error naming the missing
  param. This completes the Addendum's route-sourced-identity contract.

**Verify**: unit tests with a memory-history router — redirect to first tab; skip a denied tab;
all-denied fallback; query preservation across the redirect; `identityFromRoute` picks declared keys
only (scope params like `role_id` untouched) and errors on a missing param.

### Step 3: Restructure users and roles

Per resource (users shown; roles is symmetric with `permissions` instead of `roles`):

1. `[userId]/index.route.vue` → `[userId]/detail.route.vue` (keep route name `users-detail`).
2. `[userId].route.vue` → `[userId]/users.layout.vue`: template shrinks to `<Tabs />` +
   `<RouterView />`; `definePage` gains `meta.tabs` (`detail` / `roles` for users; `detail` /
   `permissions` for roles). Hand-written tab array and `siblingQuery` are deleted.
3. Children gain `meta.permission` (`users.detail`, `users.list` for the roles-assignment tab as
   appropriate — use the resource's declared permission identities). `edit.route.vue` stays
   unlisted in `tabs` and keeps its own permission meta.
4. Adapter `routes.detail` → `` (id) => `/settings/users/${id}/detail` ``. `routes.update`
   unchanged.

**Verify**: web tests + type-check (route map regenerates; stale name references surface here).
`pnpm dev`: `/settings/users/:id` redirects to `/…/detail`; tab switch preserves table query params;
direct `/…/roles` entry works; `/…/edit` reachable from the update control only.

### Step 4: Overtimes joins the convention

`hr/overtimes/[overtimeId]/index.route.vue` → `detail.route.vue`; add a minimal
`overtimes.layout.vue` with a single-entry `meta.tabs` (`Tabs` renders nothing when only one tab is
visible — implement that rule in the component); adapter `routes.detail` gains `/detail`. Move the
adjacent `index.route.spec.ts` with its file and update its route expectations.

**Verify**: web tests green; `/hr/overtimes/:id` redirects to `/detail`; edit flow intact.

### Step 5: Sweep remaining literals

Run the path-literal grep; update the plan-025 deep-link registry entries and any notification
deep links or specs still pointing at bare detail URLs (`apps/base-mobile` catalog included if the
sweep hits it).

**Verify**: sweep returns only list URLs and the new `/detail` forms; full web + base-mobile test
suites and type-checks green; `pnpm --filter @southneuhof/framework-web build` green.

### Step 6: Update the index and the note

Mark this plan's row in `plans/README.md`; append an outcome line to the Addendum in
`docs/architecture/routing-and-controls-review.md` (what shipped, any recorded deviations).

## Test plan

Beyond per-step checks: one navigation-flow spec per shell (users, roles) covering
parent-URL → first-tab redirect with a permissive adapter, denied-first-tab fallback to the second,
and query preservation; the existing tab-screen specs (`roles/index.route.spec.ts`,
`permissions/index.route.spec.ts`, overtime detail spec) re-pointed at the new paths.

## Done criteria

- No addressable parent screens: every `/…/:id` URL redirects to its first valid tab; detail lives
  at `/detail` everywhere, including overtimes.
- No hand-written tab arrays or per-route `siblingQuery`; one `Tabs` component, one guard, both
  reading `meta.tabs` + child `meta.permission`.
- `.layout.vue` has one documented meaning in both positions; plugin spec covers both.
- `identityFromRoute` exists, tested, and is the documented way routes hand identity to factories.
- Framework package untouched; all suites, type-checks, and the production build green.

## STOP conditions

- `definePage` meta is not processed for `.layout.vue` files by the macro (check the plugin's
  `extensions`/macro config) — stop; `meta.tabs` placement is the load-bearing design decision and
  its fallback (plugin-injected meta) must be decided with the maintainer, not improvised.
- The guard cannot distinguish "landed on shell" from "landed on child" reliably (e.g. the lifted
  node still owns an empty-path child) — stop and report the matched-record shape observed.
- unplugin-vue-router regenerates route names in a way that breaks the typed route map or the
  deep-link registry beyond simple renames — stop and inventory before touching more screens.
- Any need to keep old URLs working surfaces mid-implementation — stop; the clean break was decided
  explicitly and reversing it is a maintainer call.

## Maintenance notes

- The guard + `Tabs` + `identityFromRoute` trio is the app's router integration layer; if a second
  app (base-mobile web?) wants it, extract to a shared package **then**, not preemptively.
- Query-backed tabs ship unused; delete the mode if still unused when this note is next revisited.
