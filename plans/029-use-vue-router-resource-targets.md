# Plan 029: Make resource navigation native to Vue Router

> **Implementation instructions**: Follow this plan step by step. Run every verification command and
> confirm the expected result before moving to the next step. If anything in the "STOP conditions"
> section occurs, stop and report — do not improvise. When done, review the diff against this plan and
> update the status row in `plans/README.md`.
>
> **Drift check (run first)**:
> ```sh
> git rev-parse --short HEAD
> git diff -- apps/web/src packages/is-vue-framework/src | shasum -a 256
> ```
> This plan was written at commit `e4f345c` with the uncommitted plans 026–028 implementation present;
> its watched-worktree hash was
> `40c525fc1794f7156fde6f7d135fc27056564233d8a950ac8002917b88a3a843`.
> If neither that exact worktree nor committed equivalents of plans 026–028 are present, compare every
> Current state excerpt with live code and STOP on a semantic mismatch.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (public navigation target type and every web resource target change)
- **Depends on**: plans 026–028 implemented
- **Category**: tech-debt / DX
- **Planned at**: commit `e4f345c`, 2026-07-27; watched worktree hash above

## Why this matters

The framework and app already depend exclusively on Vue Router, but resources reduce route targets to
plain strings. That discards generated route-name and parameter checking, forces raw anchors plus
manual `router.push`, and makes composite identity serialization look like string interpolation.
Resource targets should return `RouteLocationRaw`; links should render through `RouterLink`; composite
identity stays an arbitrary typed value whose resource target explicitly maps it to named-route params.

This plan changes only the forward direction, identity → route. It deliberately does not infer
route params → identity: route components own that mapping, because arbitrary identity shapes cannot
be reversed honestly from an extractor.

## Current state

- `packages/is-vue-framework/package.json:26-45` already declares `vue-router` as peer and direct
  dependency, so no dependency or lockfile change is needed.
- `packages/is-vue-framework/src/resources/defineResource.ts:80-85`:

  ```ts
  export interface ResourceRouteTargets<TIdentity extends RecordIdentity = RecordIdentityValue> {
    list?: string
    create?: string
    detail?: (id: TIdentity) => string
    update?: (id: TIdentity) => string
  }
  ```

- `packages/is-vue-framework/src/components/views/controls.ts:17-28` declares `ViewControl.to?: string`.
- `packages/is-vue-framework/src/components/views/ViewControls.vue:10-19` renders control links as raw
  `<a>` elements.
- `Resource.rowLink` returns a string and app list routes work around SPA navigation with
  `<a :href="..." @click.prevent="router.push(...)">`; examples:
  `apps/web/src/routes/(authenticated)/settings/users/index.route.vue:12-17` and
  `settings/roles/index.route.vue:9-14`.
- Web resources interpolate strings:

  ```ts
  // apps/web/src/framework/adapters/resources/roles.ts:54-59
  routes: {
    list: '/settings/roles',
    create: '/settings/roles/new',
    detail: (id) => `/settings/roles/${id}/detail`,
    update: (id) => `/settings/roles/${id}/edit`,
  }
  ```

- Generated names and typed params exist in `apps/web/src/route-map.d.ts`; use `roles`,
  `roles-create`, `roles-detail`, `roles-update`, equivalent users/overtime names, and their declared
  params. Plan 031 later changes detail paths but keeps these names stable.
- Composite identity is already arbitrary within `RecordIdentity`: scalar or flat record of scalar
  values. Existing type/runtime fixtures use `{ userId, roleId }`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass |
| Framework types | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | all pass |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| String-target sweep | `rg -n "routes:\\s*\\{|rowLink|\\.routes\\.(list|create|detail|update)" apps/web/src packages/is-vue-framework/src` | every remaining target intentional |

## Scope

**In scope**:

- `packages/is-vue-framework/src/resources/defineResource.ts`
- `packages/is-vue-framework/src/resources/controls.ts`
- `packages/is-vue-framework/src/components/views/{controls.ts,ViewControls.vue}`
- Their existing framework type/unit/view specs
- `apps/web/src/framework/adapters/resources/{users,roles,overtimes}.ts`
- CRUD route callers of `rowLink` and `resource.routes.*`
- Existing adapter/route specs whose target assertions change
- `docs/architecture/{web-application-architecture.md,resource-migration-guide.md,routing-and-controls-review.md}`

**Out of scope**:

- DetailView/ListView resource-first props and delete lifecycle — plan 030
- Route-tree moves, `/detail` removal, tabs, guards, or `identityFromRoute` — plan 031
- Changing `RecordIdentity` or restricting composite identity to one object spelling
- Adding an inverse route parser or identity codec
- API/backend route changes

## Git workflow

- Stay on the current branch; plans 026–028 are uncommitted work in the same tree.
- Match existing conventional commit style, e.g. `refactor(framework): retire the legacy CRUD architecture`.
- Do not commit, push, or open a PR unless explicitly requested.

## Steps

### Step 1: Widen framework navigation targets to Vue Router locations

Import `RouteLocationRaw` as a type. Change:

```ts
interface ResourceRouteTargets<TIdentity> {
  list?: RouteLocationRaw
  create?: RouteLocationRaw
  detail?: (id: TIdentity) => RouteLocationRaw
  update?: (id: TIdentity) => RouteLocationRaw
}
```

Thread `RouteLocationRaw` through `Resource.rowLink`, `ViewControl.to`, and `ActionableControl`.
Do not use `any` or cast locations back to strings. Keep `routes` optional per operation.

**Verify**:

```sh
pnpm --filter @southneuhof/is-vue-framework type-check
```

Expected: exit 0 after framework callers/spec fixtures are migrated in the same step.

### Step 2: Render framework navigation with RouterLink

In `ViewControls.vue`, replace the raw anchor branch with `RouterLink :to="control.to"`. Preserve:

- `data-control`
- accessible disabled state
- labels
- button branch for `onSelect`

A disabled navigation control must not navigate. Follow Vue Router custom-slot mode if needed to
prevent navigation while retaining a real `href`; do not simulate links with buttons.

Extend `components/views/__tests__/views.spec.ts` using a memory router, not shallow stubs, and prove:

- a named location resolves to the expected href;
- clicking uses SPA navigation;
- a disabled link does not navigate;
- handler controls remain buttons.

**Verify**:

```sh
pnpm --filter @southneuhof/is-vue-framework test
```

Expected: all tests pass, including new RouterLink cases.

### Step 3: Convert web resources to named typed locations

Migrate users, roles, and overtimes:

```ts
routes: {
  list: { name: 'roles' },
  create: { name: 'roles-create' },
  detail: (id) => ({ name: 'roles-detail', params: { roleId: id } }),
  update: (id) => ({ name: 'roles-update', params: { roleId: id } }),
}
```

Use the corresponding generated names/params for each resource. Keep the `/detail` route names for
now; plan 031 changes paths without changing names. Do not assert raw object identity in tests;
resolve locations through a memory router and assert the resulting path.

Add one framework type fixture proving an arbitrary composite identity maps explicitly:

```ts
identity: ['userId', 'roleId'],
routes: {
  detail: ({ userId, roleId }) => ({
    name: 'user-role-detail',
    params: { userId, roleId },
  }),
}
```

Use a locally augmented test route map or a structurally valid generic route name; do not weaken app
route-name types with casts.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web type-check
pnpm --filter @southneuhof/framework-web test
```

Expected: exit 0; all web tests pass.

### Step 4: Migrate row links and direct navigation callers

Replace raw anchors and manual click interception with `RouterLink`:

```vue
<RouterLink :to="roles.rowLink!(record as Role)">{{ value }}</RouterLink>
```

Pass `resource.routes.*` results directly to `router.push`/`router.replace`; remove unnecessary
string assumptions. Do not add non-null assertions where capability/route presence is not already
guaranteed by the resource declaration.

**Verify**:

```sh
rg -n '@click\\.prevent=.*router\\.push|:href=.*rowLink' apps/web/src/routes
```

Expected: no matches in migrated CRUD routes.

### Step 5: Update architecture documentation

Amend the three scoped docs to record:

- framework intentionally couples navigation controls/resources to Vue Router;
- targets are `RouteLocationRaw`, preferably named locations;
- identity may be scalar or composite/arbitrary within its declared type;
- `identity(record)` and route target functions own record → identity → route;
- route components explicitly own route params → identity;
- `/model/:key1/:key2` is the default composite-coordinate convention;
- containment URLs are reserved for genuine parent/child scope;
- JSON/base64 single-segment identities and object-key-order serialization are rejected.

Do not document the resource-first DetailView or index-detail tree before plans 030–031 implement them.

**Verify**:

```sh
rg -n "RouteLocationRaw|named route|composite" docs/architecture
```

Expected: new rules appear in the scoped architecture docs.

## Test plan

- Extend `resources/__tests__/resources.spec.ts`: scalar and composite `rowLink` return locations
  resolvable by Vue Router.
- Extend `components/views/__tests__/views.spec.ts`: RouterLink href, SPA navigation, disabled link,
  button handler.
- Extend contract type tests: wrong composite route-param mapping fails; correct mapping compiles.
- Update web adapter specs to resolve named targets and assert paths.
- Full framework/web tests and type-checks.

## Done criteria

- [ ] `ResourceRouteTargets`, `rowLink`, and `ViewControl.to` use `RouteLocationRaw`.
- [ ] Framework navigation controls render `RouterLink`, not raw anchors.
- [ ] Users, roles, and overtimes use named route locations with typed params.
- [ ] CRUD list routes contain no raw-anchor/manual-push row-link workaround.
- [ ] Composite identity fixture maps its arbitrary typed shape explicitly to route params.
- [ ] Framework and web tests/type-checks pass.
- [ ] Scoped architecture docs describe forward mapping and reject inverse inference.
- [ ] `plans/README.md` row is `DONE` only after diff review.

## STOP conditions

- Generated route names cannot be preserved without an `as RouteLocationRaw`/`as any` cast in each
  resource. Report the exact inference failure instead of weakening types.
- RouterLink requires a global router in a component test and the existing harness cannot install
  plugins without broad unrelated changes. Add a focused local mount helper; STOP if production
  component architecture would need to change.
- A resource needs one identity mapped differently to the same named route depending on call site.
  That is a missing explicit route target, not permission to add inverse reflection.
- Plan 031 route-name stability is false: if path moves force name changes, inventory all consumers
  before proceeding.

## Maintenance notes

- Named locations decouple resources from path changes; plan 031 relies on this.
- Route params remain strings at URL boundary. Domain-specific coercion belongs in route-to-identity
  mapping or operation loader, never generic router code.
- If identity later becomes nested beyond `RecordIdentity`'s current flat-record constraint, widen
  identity contracts in a separate plan with cache-key tests; do not smuggle nested values through
  string casts.
