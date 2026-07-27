# Plan 035: Prove mechanical file-route names and lazy action discovery

> **Implementation instructions**: Execute this proof before Plan 036. It must use the installed
> `vue-router@5.1.0` generator and runtime, not a hand-built approximation. Modify only the proof
> fixture and this plan's status row. Do not touch production source. If a proof fails, report the
> generated route tree/types or navigation trace named below; do not revive `_parent`, the full route
> catalog, or route-name suffix inference.
>
> **Drift check (run first)**:
>
> ```sh
> git diff --stat e4f345c..HEAD -- apps/web/package.json pnpm-lock.yaml apps/web/node_modules/vue-router/package.json
> ```
>
> The working tree contains the completed but uncommitted Plans 026–034. That is expected. This proof
> depends only on the installed router version and public generator/runtime behavior.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW (proof-only; migration must not start on a failed premise)
- **Depends on**: `plans/034-scope-route-transitions-to-outlet-depth.md`
- **Category**: tests / migration / DX
- **Planned at**: commit `e4f345c`, 2026-07-27

## Why this matters

Plan 036 removes the hand-written route catalog and undocumented `_parent.route.vue` convention.
Two mechanics are load-bearing:

1. Vue Router's documented same-name file/folder nesting must generate a named detail parent with
   typed inherited params while a custom name function omits route groups, `index`, and dynamic
   parameter segments.
2. A permission guard moved to `beforeResolve` must run after a lazy route component's module has
   evaluated, so a resource imported by that component can register its action before direct-entry
   authorization.

Both claims are cheap to prove against the installed package. This proof prevents another migration
from repeatedly stopping on assumptions about generated names.

## Locked naming rule under proof

Route names are the route file's effective **static** segments joined with `-`:

- omit route groups such as `(authenticated)` because they add no URL segment;
- omit `index`;
- omit every dynamic segment, including `[roleId]` and catch-all parameters;
- preserve every other segment verbatim and in order;
- perform no singularization, CRUD mapping, or semantic rewrite.

Examples:

```text
(authenticated)/settings/roles/index.route.vue
  -> settings-roles

(authenticated)/settings/roles/[roleId]/detail.route.vue
  -> settings-roles-detail

(authenticated)/settings/roles/[roleId]/detail/permissions/index.route.vue
  -> settings-roles-detail-permissions

(authenticated)/settings/roles/[roleId]/edit.route.vue
  -> settings-roles-edit

organizations/[organizationId]/users/[userId]/detail.route.vue
  -> organizations-users-detail
```

Dynamic parameter names are transport details, not screen identity. Changing `roleId` to `id` must
not rename a route. Two route files differing only by parameter spelling would also produce the same
URL pattern, so a duplicate generated name is a useful build failure.

Nodes with no component are structural and must be unnamed. A route with no static segment cannot
derive a non-empty name; Plan 036 handles the root catch-all explicitly by naming the file
`not-found.route.vue` and using typed `definePage({ path: '/:path(.*)' })` as the exceptional path
override.

## Current state

- `apps/web/vite.config.ts:15-20` scans `.route.vue` and `.layout.vue`, then passes every node through
  `applyFileRouteConventions(root, routeCatalog, projectRoot)`.
- `apps/web/src/router/file-routing/layout-groups.ts:60-89` applies a catalog name/meta to every
  component and then promotes `.layout.vue`.
- Roles and users currently use `[id]/_parent.route.vue`. Installed Vue Router treats `_parent`
  specially and suppresses its name; official file-routing documentation instead supports
  `detail.route.vue` plus a sibling `detail/` folder.
- Installed generator option `getRouteName(node)` receives a `TreeNode`; `node.value.rawSegment` and
  `node.parent` expose the exact file segments needed by the locked rule.
- Installed Vue Router's navigation flow resolves async route components before `beforeResolve`.
  The runtime proof must verify module evaluation order rather than merely cite that contract.

Pinned package:

```text
apps/web/package.json: vue-router ^5.1.0
installed: vue-router 5.1.0
```

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Proof | `node plans/proofs/035-mechanical-routes/prove.mjs` | exact two PASS lines below |
| Web package version | `pnpm --filter @southneuhof/framework-web exec node -p "require('vue-router/package.json').version"` | `5.1.0` |

Expected proof output:

```text
PASS: static-only names and same-name detail nesting generated correctly
PASS: lazy resource module registered its action before beforeResolve
```

## Scope

**In scope**:

- `plans/proofs/035-mechanical-routes/**` (create)
- `plans/README.md` status row for Plan 035

**Out of scope**:

- all files under `apps/web/src/**`
- all files under `packages/**`
- dependency or lockfile changes
- generated production `apps/web/src/route-map.d.ts`
- architecture docs
- patching or vendoring Vue Router

## Git workflow

- Suggested branch: `codex/035-prove-mechanical-routes`
- Suggested commit: `test(web): prove mechanical file routes`
- Do not stage, commit, push, or open a PR unless the operator requests it.

## Steps

### Step 1: Build a real file-generator fixture

Create:

```text
plans/proofs/035-mechanical-routes/
  prove.mjs
  route-map.d.ts                 # generated by the proof and committed as evidence
  src/routes/
    (authenticated)/
      authenticated.layout.vue
      settings/roles/index.route.vue
      settings/roles/new.route.vue
      settings/roles/[roleId]/edit.route.vue
      settings/roles/[roleId]/detail.route.vue
      settings/roles/[roleId]/detail/permissions/index.route.vue
      organizations/[organizationId]/users/[userId]/detail.route.vue
    not-found.route.vue
```

Fixture SFCs may contain minimal templates. `detail.route.vue` must contain `<RouterView />`; the
folder with the same `detail` stem must hold `permissions/index.route.vue`. Do not use `_parent`,
`<route>` blocks, a route catalog, or per-route name overrides. `not-found.route.vue` may use typed
`definePage({ path: '/:path(.*)' })`, because a root catch-all has no static segment from which a name
can be derived.

In `prove.mjs`, import `createRoutesContext` and `resolveOptions` from the installed app dependency,
matching `plans/proofs/031-native-parent-typed/prove.mjs`. Configure the real generator with:

- fixture root and `src/routes`;
- `.route.vue` and `.layout.vue` extensions;
- fixture `route-map.d.ts`;
- the exact static-only `getRouteName` algorithm;
- a minimal `beforeWriteFiles` hook that promotes the fixture layout and sets structural,
  componentless records to `name = false`.

The name function must walk `node.parent`/`node.value.rawSegment`. It must not inspect rendered URL
strings, component source text, CRUD words, or dynamic parameter names.

Assert generated runtime routes and types contain:

```text
settings-roles
settings-roles-new
settings-roles-edit
settings-roles-detail
settings-roles-detail-permissions
organizations-users-detail
not-found
```

Also assert:

- `settings-roles-detail` path is `/settings/roles/:roleId/detail`;
- `settings-roles-detail-permissions` is its child and inherits typed `roleId`;
- composite route path contains both `organizationId` and `userId`, but neither appears in its name;
- detail and edit are siblings beneath the parameter record;
- no generated name contains `authenticated`, `index`, `[`, `]`, `roleId`, `organizationId`,
  `userId`, `_parent`, `create`, or `update`;
- there are no duplicate non-false names;
- no `_parent.route.vue` import appears.

`new` and `edit` are deliberately preserved. The negative `create`/`update` assertions prove no
semantic CRUD mapping occurred.

**Verify**:

```sh
node plans/proofs/035-mechanical-routes/prove.mjs
```

Expected at this point: first PASS line prints. Continue directly to Step 2.

### Step 2: Prove lazy module evaluation precedes `beforeResolve`

Add minimal `.mjs` runtime fixtures beside `prove.mjs`:

```text
action-registry.mjs
lazy-detail.mjs
```

`action-registry.mjs` owns a local test registry and ordered event log. `lazy-detail.mjs` records
module evaluation and registers `settings-roles-detail`. It exports a minimal Vue component.

In `prove.mjs`, create a real memory-history router whose `/settings/roles/:roleId/detail` component
is `() => import('./lazy-detail.mjs')`. Record:

1. `beforeEach` ran while the action was absent;
2. lazy module evaluated and registered the action;
3. `beforeResolve` then observed the action;
4. navigation completed.

Assert exact relative order:

```text
beforeEach < lazy-module-evaluated < action-registered < beforeResolve < afterEach
```

Do not import `lazy-detail.mjs` at the top of the proof; that would invalidate the claim. Add a cache
buster to its dynamic import if repeat execution in one process could reuse the module.

**Verify**:

```sh
node plans/proofs/035-mechanical-routes/prove.mjs
```

Expected: both exact PASS lines print and process exits 0.

### Step 3: Record proof result

Update only Plan 035's row in `plans/README.md` from `TODO` to `DONE`. Do not mark Plan 036 started.

**Verify**:

```sh
git status --short -- plans/proofs/035-mechanical-routes plans/README.md
```

Expected: only proof files and `plans/README.md` are changed for this plan.

## Test plan

The proof itself is the test. It covers:

- static-only deterministic names;
- no semantic aliasing (`new` remains `new`, `edit` remains `edit`);
- omitted single and composite dynamic params;
- documented same-name detail nesting;
- typed inherited params;
- explicit catch-all escape hatch;
- structural unnamed nodes;
- lazy route-module action registration before `beforeResolve`.

## Done criteria

- [ ] `node plans/proofs/035-mechanical-routes/prove.mjs` exits 0 with both exact PASS lines.
- [ ] Generated fixture types contain `settings-roles-detail` with child
  `settings-roles-detail-permissions` and typed `roleId`.
- [ ] Generated names contain no dynamic parameter name and no CRUD synonym mapping.
- [ ] Runtime event trace proves lazy registration precedes `beforeResolve`.
- [ ] No production source or dependency file changed.
- [ ] Plan 035 status is `DONE`.

## STOP conditions

Stop and report concrete evidence if:

- installed Vue Router is not `5.1.0`;
- same-name `detail.route.vue` plus `detail/` does not produce a parent/child record;
- `getRouteName` cannot access raw ancestry without private-source imports;
- generated types lose an inherited dynamic param;
- lazy module evaluation occurs after `beforeResolve`;
- satisfying the proof would require `_parent`, a route catalog, a package patch, or production edits.

On failure, include generated runtime route text, relevant `route-map.d.ts` excerpt, router version,
and ordered runtime events. One failed assertion with that evidence is sufficient; do not retry the
same rejected structure.

## Maintenance notes

Keep this fixture after migration. It is a fast executable contract for upgrades to Vue Router's
file generator and navigation pipeline. Reviewers should compare any future naming change against
the explicit inclusion/exclusion rule here, not against CRUD semantics.

