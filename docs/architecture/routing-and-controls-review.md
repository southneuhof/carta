# Routing and controls review

Recorded 2026-07-27 against `advisor/022-rebuild-identity-and-org-structure`. Findings plus the direction decided; no code changed.

## 1. Nested detail routes

### Current state

`unplugin-vue-router` over `src/routes`, extensions `.route.vue` and `.layout.vue`, with `beforeWriteFiles: applyRouteGroupLayouts`.

A file named after a sibling directory becomes that directory's parent route. Two resources use this:

- `settings/users/[userId].route.vue` + `settings/users/[userId]/{index,edit,roles}.route.vue`
- `settings/roles/[roleId].route.vue` + `settings/roles/[roleId]/{index,edit,permissions}.route.vue`

The parent files hold a hand-written tab bar, a `<RouterView />`, and `siblingQuery()` (preserves namespaced table query params across tab switches). `hr/overtimes/[overtimeId]/` has no parent file because it has no tabs.

`.layout.vue` is reserved: `applyRouteGroupLayouts` promotes a group's layout onto the URL-transparent `(group)` parent and throws if a `.layout.vue` is not a direct child of a parenthesized group. Renaming `[userId].route.vue` to `[userId].layout.vue` would fail the build.

### Why this is wrong

The parent route is addressable and renders as a screen — a tab bar over an empty body until a child resolves. `/settings/users/:userId` is served by `[userId]/index.route.vue`, so "detail" is simultaneously the shell and one of the tabs. The shell and the first tab are the same URL, which is why the shell has to be a route at all.

Opening a detail page must land on the first valid subroute directly. Never a parent screen that then requires a second click.

### Direction

- The template for `[userId]` lives **inside** the detail folder; the detail screen becomes an ordinary sibling tab (`[userId]/detail/index`), not the parent's index.
- Landing on the parent resolves to the first valid subroute **automatically**. Not declared per-route, not a redirect written by hand in each layout — behavior of the routing layer.
- "First valid" implies validity is computed (capability plus access), so the landing tab follows what the caller may actually see.

Open: where the resolution runs (`beforeWriteFiles` tree edit vs. a navigation guard), and how validity is sourced without recreating the `controls` coupling below.

## 2. `controls`

### Current state

`ViewControl` (`packages/is-vue-framework/src/components/views/controls.ts`) is a button or link: `key`, `label`, optional `icon`, `placement` (`primary` / `secondary` / `row`), and either `onSelect` or `to`. Shells render what they are handed, filtered by placement; they resolve nothing themselves.

`standardControls()` (`packages/is-vue-framework/src/resources/controls.ts`) infers the five standard controls — `list`, `detail`, `create`, `update`, `delete` — from a resource and a surface (`list` or `detail`). A control is emitted only when the capability is declared, a route target exists, and access allows it; anything else is absent rather than disabled. Detail throws without `id`. `overrides` and `labels` patch the result.

Every CRUD route calls it the same way:

```ts
const controls = computed(() => standardControls({ resource: users, surface: 'detail', id: userId.value }))
```

### Position

Code smell. Flagged, not yet diagnosed — revisit before building on it.

Points to examine when it is revisited: the same call is repeated in every CRUD route to produce a derivable result; `standardControls` couples resource capabilities, route targets, and access into one helper the shells then treat as opaque; and the surface/`id`/throw contract is enforced at runtime rather than by types.

## Addendum (2026-07-27): decided design

Decided with the maintainer in review of the findings above. This section is the specification; plans 026–028 implement it in order.

### Identity

- Every resource has an identity of a **declared shape**. `{ id: string | number }` extracted from `record.id` is the **framework default, not framework language** — nothing else about the word `id` is contractual.
- Declaration lives on the resource definition, in two spellings: `identity: ['userId', 'roleId']` (first-class; yields the extractor, the `TIdentity` type, and all downstream signatures from one declaration) or `identity: (record) => TIdentity` (escape hatch for derived or renamed shapes). The loader is **never** the identity source — a function signature is erased at runtime, and the framework needs the record → identity direction at runtime (row links, cache keys, invalidation). Loader parameters are instead **checked against** the declared identity, so a config/fetcher mismatch is a compile error at the `defineResource` call site.
- `TIdentity` is inferred from the `identity` value, never a manually supplied generic. It threads through `operations.detail/update/delete`, `routes.detail/update`, `detail({ id })`, `form({ id })`, `remove`, `invalidate`, and cache keys (`stableValue` already serializes objects).
- The identity stays under a **single typed `id` slot** in factory arguments — not flattened into the argument object — so it cannot collide with `searchParameters` and friends. On a composite resource, `detail({ id: 'x' })` is a compile error.
- Identity vs. scope stays a per-resource judgment: a true composite pair (`userRoles`) is `identity`; a parent param scoping rows that have their own key (`role_id` on role-permissions) remains an ordinary `searchParameters` entry. Auto-assembly must never vacuum scope params into identity.

### Route-sourced identity

- Convention: **file-route param names equal identity key names**. The assembly layer picks exactly the declared identity keys off `route.params` by name (falling back to `route.query` as the per-resource escape-hatch spelling), never the whole params bag.
- URL-sourced identity values are **strings**; coercion is the loader's business.
- Segment order in the URL is serialization, not semantics: assembly is name-based, so the framework assigns no meaning to positions. Canonical order = the `identity` array order. True composites mount **flat** (`/user-roles/:userId/:roleId/detail` — coordinates, not hierarchy); nested mounting is reserved for real scope relationships where the containment claim is true.

### Controls

- Capabilities, permissions, and route targets already live on the resource; the smell was the per-route re-projection. **Standard controls fold into the surface factories** (`resource.detail({ id })`, `resource.table()`), which return shell-ready bundles consumed via `v-bind`. `standardControls` becomes internal; its runtime surface/`id` throws become type errors.
- The table bundle exposes record → detail navigation (via the identity extractor plus `routes.detail`) so list screens stop hand-writing `String(record.id)`.
- Placement, custom per-screen actions, and local handlers (delete confirmation UX) remain route-authored — model definitions do not absorb UI placement.
- Shells stay exactly as dumb as `components/views/controls.ts` promises: they render what they are handed and resolve nothing.

### Detail routing, shells, and tabs

- The detail screen is always an explicit **`/detail` sibling** — no exceptions, including tab-less resources — so URLs are stable when tabs appear and the convention has no branches. The parent URL is never a screen.
- The shell is a `.layout.vue` **inside** the detail folder. The suffix keeps one meaning — "wraps its child routes" — with position determining mechanics: direct child of a `(group)` promotes onto the group (unchanged); direct child of any other route directory becomes that directory's route component.
- A single global navigation guard resolves the parent URL to the **first valid tab**: it walks the shell's declared tab list in order, checks each target's access, and redirects, preserving namespaced sibling query params. Validity is sourced from route meta plus the access adapter — the router never imports resources.
- **Shell meta owns presentation; child meta owns access truth.** The layout file declares `meta.tabs` (membership, labels, order — one array, one place); each child route declares its own permission identity for direct-URL guarding. The guard and the tab bar read the same two sources and cannot disagree. `edit.route.vue` is excluded by simply not being listed.
- One `Tabs` component, two state backings: route-backed (items carry targets, active tab from the matched route) and query-backed (`?tab=x`, namespaced like table params) as the escape hatch for n adjacent panels on one route. Query mode knowingly forfeits per-tab access control and code-splitting — for lightweight panels only.
- Core `is-vue-framework` stays router-agnostic. Everything that touches vue-router — param assembly, the guard, `Tabs` — lives in the app's router integration layer.

### Consequences accepted

- Every detail URL gains `/detail`; overtime detail moves. Clean break on the rebuild branch, no legacy redirects.
- A resource mounted at two URLs with different param spellings cannot use auto-assembly at both; the explicit `detail({ id })` call remains for that.
- Type safety ends at the URL boundary: params arrive as strings and the route file's assembly is checked against the identity type, but nothing verifies the URL contains the params — the route author's job, softened by the generated route map.

### Implementation order

1. **Plan 026** — identity generics in contracts and `defineResource` (self-contained; no route changes).
2. **Plan 027** — controls fold into the surface factories (consumes `TIdentity`).
3. **Plan 028** — shell layouts, `meta.tabs`, the first-valid-tab guard, `Tabs`, and the `/detail` URL migration.

### Outcome (2026-07-27)

Plans 026–028 shipped as specified. Recorded deviations, all forced by the tooling rather than by the
design:

- **Identity inference** (026): the declaration is inferred through an optional fifth `const` type
  parameter on `defineResource`. TypeScript takes defaults — never inference — for a partially
  supplied type-argument list, so a call site that spells earlier type arguments must spell the
  declaration too; a call site that spells none infers everything from `fields` and `identity`. The
  function spelling needs its parameter annotated when `TRecord` is itself inferred. No existing call
  site changed.
- **Row links** (027): `rowLink` is a resource member, not a member of the table bundle. A function
  inside the bundle survives `v-bind` onto a shell only as a fallthrough attribute, which Vue renders
  into the DOM; keeping the bundles `{ table, controls }` / `{ detail, controls }` left the shells
  untouched, as the plan required.
- **Control freshness** (027): the core props stay memoized, the `controls` array and the bundle
  wrapper are rebuilt per call. Memoizing a bundle would cache a closure over a route's `onDelete`
  handler — functions drop out of the memo key — and hand a second mount the first component's dead
  handler.
- **Shell meta spelling** (028): `meta.tabs` is declared in the layout's `<route lang="json5">`
  block, not `definePage`. `definePage` meta is not present on the route tree at `beforeWriteFiles`,
  which is where the layout's meta is lifted onto the directory node; the `<route>` block already
  carried layout meta in this app (`authenticated.layout.vue`) and does reach the tree. Child routes
  keep `definePage`, whose meta is merged at runtime where the guard reads it. Placement is unchanged
  — shell owns tabs, child owns access.
- **Identity reflection** (028): `identityFromRoute` needs the declared key names at runtime, so
  `Resource` exposes `identityKeys` (empty for a scalar or function-declared identity). A scalar
  identity has no key name to match, so those routes name the param:
  `identityFromRoute(users, route, 'userId')`.

`.layout.vue` now has one meaning in both positions, `standardControls` is internal, every `/…/:id`
URL redirects to its first valid tab, and detail lives at `/detail` for users, roles, and overtimes.

### Superseded by plans 029–032 (2026-07-27)

Plans 029–031 replace the preceding route decisions. Resource navigation targets are
`RouteLocationRaw`, normally named routes with explicit params; resources map identity → target,
while route files map typed URL params → scalar or composite identity. There is no inverse identity
reflection.

`ListView` and `DetailView` have resource-first forms (`:resource`, plus explicit `:id` for detail)
that call the existing surface factories internally. Raw `:table` and `:detail` forms remain for
composed screens. Resource-first detail owns standard delete feedback, invalidation, and replacement
to the resource list target.

Route-local `definePage()` and JSON5 `<route>` metadata are removed. One typed application manifest
catalogs every route-bearing SFC, owns names/meta/navigation presentation, and is applied to generated
file-route nodes before layout promotion. Generated names are compile-time equal to manifest names.

Detail parents are native `detail.route.vue` files inside parameter folders. They render DetailView,
Tabs, and `AppRouterView` unconditionally, so mapping/edit children render detail-under. Each
`AppRouterView` owns only its rendered RouterView-depth record: its key combines record identity,
that record's concrete inherited-param path, and its record-scoped refresh value. Parent-to-child or
sibling-child navigation leaves parent mounted; a parent-param change remounts parent; query/hash
changes do not transition. Tabs only selects first valid content with `router.replace`; it never
controls animation. App shells remain outside route-page transition. Tabs and direct guard consume
same manifest-applied permission meta. Overtime has no `_parent`, so remains an ordinary index/edit
tree.

RouteTab lists child-content names only; detail resource targets remain named parents. Tabs infers
shared owner from resolved Vue Router matched-record identity. At bare owner URL it selects first
resolvable/permitted child with `router.replace`, preserving params/dotted query keys. Zero valid
children leave parent intact; active children, siblings, and deeper descendants never redirect.
