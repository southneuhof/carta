# Plan 038: Colocate route resources, split operations, and derive application types

> **Implementation instructions**: Execute after Plan 037 is `DONE`. Migrate all current web
> resources as one clean break: exact Hono-derived types, operation files separate from declarative
> resource definitions, and every application resource colocated with its owning route subtree.
> Create no central resource folder, barrel, or compatibility copy of the old flat modules.
> Preserve UI-local state in Vue routes. Make the web package's `build` command run `vue-tsc`
> before Vite so agents cannot produce a successful build from invalid transport/resource wiring.
> Run every focused and final gate.
>
> **Drift check (run first)**:
>
> ```sh
> git diff --stat 17e7ed9..HEAD -- \
>   apps/web/package.json \
>   apps/web/src/framework/adapters/resources \
>   apps/web/src/routes \
>   apps/web/src/components/navigations/NotificationInbox.vue \
>   apps/web/src/framework/notifications \
>   apps/web/src/manifest/navigation.ts \
>   apps/web/src/router/__tests__/detail-parents.spec.ts \
>   docs/architecture
> ```
>
> Plan 037 changes outside this watched application scope are expected. Any application-scope change
> requires comparison against Current state before editing.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED (exact API inference will expose existing handwritten-contract drift)
- **Depends on**: `plans/037-add-optional-hono-resource-tools.md`
- **Category**: architecture / migration / DX
- **Planned at**: commit `17e7ed9`, 2026-07-27
- **Revised**: 2026-07-27 for Plan 037's accepted type-exact/runtime-universal operation design

## Why this matters

Current flat resource files mix declarative fields/actions, ordinary CRUD transport, custom
workflows, response casts, and handwritten API mirrors. This is tolerable at 100 lines and hostile
at 1,000: agents must scan implementation detail to understand a resource's visible capabilities,
while route components risk accumulating controller logic. Keeping those files in a separate
framework adapter tree also forces humans to jump between distant directory branches while working
on one screen.

The Hono client already knows transport types. Plan 037 preserves their exact keys and payloads as
typed `ResourceOperations`, removes runtime `ResourceCapabilities`, and makes actions the only UI
affordance truth. This plan removes duplicated interfaces and reorganizes each domain so the
resource declaration remains a compact map while operations can scale by cohesive use case. Route
folders become the human-facing unit of ownership.

## Locked ownership

### Resource definition files own

- `defineResource()` call;
- fields and presentation;
- schemas;
- table/detail/form projections;
- route actions and permissions;
- imports of operation functions.

### Operation files own

- Hono/RPC calls and response parsing;
- ordinary CRUD adapter construction;
- multi-request orchestration;
- reusable mutations;
- workflow functions;
- transport-derived type aliases.

### Vue route/view files own

- route params;
- component composition;
- temporary UI state;
- optimistic display state and rollback trigger;
- dialog/toast state;
- calling imported operations.

Vue files do not call raw Hono endpoints. Operation files do not import Vue, router, toasts, or
components.

### Scaling rule

One route subtree may contain several operation files organized by cohesive use case. Never grow one
`controller.ts` bucket to thousands of lines. Use `operations` vocabulary, not `controller`.

Place each file at the nearest route subtree that semantically owns the concern:

- resource shared by list/create/detail/edit belongs at CRUD route root;
- operation used only with one dynamic identity belongs under that `[id]` folder;
- detail child resource belongs inside its child route folder;
- parent tab declarations and global UI may import a nested/canonical route resource directly; those
  consumers do not take ownership away from its rendered route.

Target layout:

```text
apps/web/src/routes/(authenticated)/
  settings/
    roles/
      roles.resource.ts
      roles.operations.ts
      index.route.vue
      new.route.vue
      [roleId]/
        edit.route.vue
        detail.route.vue
        detail/permissions/
          index.route.vue
          role-permissions.resource.ts
          role-permissions.operations.ts
    users/
      users.resource.ts
      users.operations.ts
      index.route.vue
      [userId]/
        edit.route.vue
        detail.route.vue
        detail/roles/
          index.route.vue
          user-roles.resource.ts
          user-roles.operations.ts
  hr/overtimes/
    overtimes.resource.ts
    overtimes.operations.ts
    index.route.vue
    new.route.vue
    [overtimeId]/
      edit.route.vue
      detail.route.vue
      verification-steps.resource.ts
      verification-steps.operations.ts
      overtime-workflow.operations.ts
  to-do/
    index.route.vue
    notifications.resource.ts
    notifications.operations.ts
```

Tests and compile-time proofs sit beside the resource/operation they exercise. Do not add `index.ts`
barrels: route ownership and direct import paths must remain visible to humans and agents.

## Type-source rules

1. Standard Hono CRUD:

   ```ts
   export const roleOperations = createHonoResourceOperations(rpc.roles)
   export type Role = ResourceRecordOf<typeof roleOperations>
   export type RoleCreate = ResourceCreateOf<typeof roleOperations>
   export type RoleUpdate = ResourceUpdateOf<typeof roleOperations>
   ```

   The typed result exposes only operations present in `typeof rpc.roles`. Its physical JavaScript
   keys are not capability metadata and must never be enumerated. Actions continue to describe UI
   targets and permissions; an operation may exist without an action.

2. Custom Hono endpoint:

   ```ts
   type Response = HonoResponseOf<typeof rpc.roles[':roleId'].permissions.$get, 200>
   export type RolePermission = Response['data'][number]
   ```

3. Shared schema may still provide validation, but must not manually restate its TypeScript shape.
4. A genuinely client-created projection may be local, but derive existing pieces:

   ```ts
   type Row = Pick<Role, 'id' | 'name'> & { selected: boolean }
   ```

5. Prefer the actual endpoint response over a client projection when the endpoint already returns
   the required row.
6. Standard `RoleQuery`, `UserQuery`, and `NotificationQuery` mirrors disappear. Ordinary table
   query state uses the inferred operations/framework query contract. A UI-only filter type may
   narrow a field from a derived record/endpoint type, never restate pagination/search boilerplate.
7. Status unions derive from records or authoritative exported constants:

   ```ts
   type OvertimeStatus = Overtime['statusCode']
   type NotificationStatus = NotificationRecord['statusCode']
   ```

8. No resource operation uses `as unknown as RpcCRUDRoute`, generic response casts, or manually
   repeated request/record interfaces.
9. A narrower UI-authorable draft is a legitimate derived projection when the transport accepts
   fields that server hooks overwrite:

   ```ts
   type OvertimeCreateRequest = ResourceCreateOf<typeof overtimeOperations>
   type OvertimeDraft = Pick<
     OvertimeCreateRequest,
     'date' | 'startTime' | 'estimatedMinutes' | 'description'
   >
   ```

   This does not claim that the RPC contract rejects the omitted server-derived fields.

## Current state

- `rpcRoute.ts:9-20` erases the typed client into `AsyncFunction`/`RpcCRUDRoute`.
- `rpcResource.ts:22-70` requires four generic arguments to recreate record/query/create/update.
- `roles.ts` contains 3 manual interfaces, 2 resource declarations, a custom list loader, and a
  mutation.
- `users.ts` contains 4 manual interfaces/types, 2 resources, a two-request composition, and a
  mutation.
- `overtimes.ts` contains CRUD configuration, 2 manual record interfaces, verification resource,
  record loader, and workflow mutations.
- `notifications.ts` contains handwritten record/query/status types plus CRUD and custom operations.
- `UserDraft` currently includes `email`, but
  `apps/api/src/routes/users/users.entity.ts:21` omits `email` from update. The edit UI therefore
  presents a field the authoritative update contract does not accept.
- `overtimes.ts` declares a delete action even though `overtimeModel` deliberately registers no
  delete route. The current broad/proxy adapter can make that invalid control appear in production;
  the migrated resource must remove the action and prove delete is absent at type and UI level.
- The overtime create schema intentionally retains server-derived fields because its hook
  overwrites them before source validation. The RPC create request must remain honestly inferred;
  only the UI-authorable draft narrows it.
- `listUserRoles` already returns `{ id, name, scope, assigned }` rows. The web instead fetches all
  roles plus assignments, invents `AssignableRole.active`, and joins them client-side.
- Route, manifest, router-test, inbox, and notification-module consumers currently import flat paths
  such as `@/framework/adapters/resources/users`. This plan replaces them with direct imports from
  owning route folders; no compatibility barrel preserves those specifiers.
- `apps/web/vite.config.ts:13-17` restricts file-route discovery to `.route.vue` and `.layout.vue`.
  Colocated `.resource.ts`, `.operations.ts`, `.spec.ts`, and `.type-test.ts` files therefore must
  not generate routes. The committed route map is the regression oracle.
- `apps/web/package.json:7-12` runs `vite build` without `vue-tsc`; CI happens to type-check in a
  separate preceding step, but a local/agent package build can currently succeed with TypeScript
  errors.

Pinned hashes:

```text
100673ba0b5aee1930fffead6c4d241ad18661696412172a726098937c8f9b84  apps/web/src/framework/adapters/resources/rpcResource.ts
b5be79c8c76319e6ae724792ad5d04f3d7e3c2ea36de40beed44800304c9e5ff  apps/web/src/framework/adapters/resources/rpcRoute.ts
f960b2ad8c37477f524d17f94d39a669b9d4d02259604a129d2c693b4d322c8b  apps/web/src/framework/adapters/resources/users.ts
a5283cc9b2ec9278c28f12962daa943237730e06f2606e611e3aeb9d36c2f1a5  apps/web/src/framework/adapters/resources/roles.ts
6a37a254a36af4f5deb5e4752296f145c2da2ec8a44a64a18709911cdc9a6a10  apps/web/src/framework/adapters/resources/overtimes.ts
0425f1205b4b7e47e2336e6bb6a1a2e7c602cfa0b9bb69c87cc45eac9c56f640  apps/web/src/framework/adapters/resources/notifications.ts
1077dea03dd35d1e2ad7b0fb74a87a566d489b23053347e59e75df48b91fbfb8  apps/web/src/route-map.d.ts
b404a904d037be3e97afd03fdc9d40e8b7a043744a189a7b7d2200b49877387b  apps/web/src/router/__tests__/layout-groups.spec.ts
e92084c07787b462513d9b6293e350a6f9c9c7ebe89542109585599ade10cc43  apps/web/package.json
```

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Plan 037 gate | `pnpm --filter @southneuhof/is-vue-framework test -- --run src/hono/__tests__/resource.spec.ts` | all pass |
| Resource focused tests | `pnpm --filter @southneuhof/framework-web test -- --run 'src/routes/(authenticated)/settings' 'src/routes/(authenticated)/hr/overtimes' 'src/routes/(authenticated)/to-do'` | all colocated resource and route tests pass |
| Route focused tests | `pnpm --filter @southneuhof/framework-web test -- --run 'src/routes/(authenticated)/settings' 'src/routes/(authenticated)/hr' 'src/routes/(authenticated)/to-do'` | all matched route tests pass |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | all pass |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` | exit 0; all type assertions consumed |
| Web lint | `pnpm --filter @southneuhof/framework-web lint` | exit 0 |
| Web build | `pnpm --filter @southneuhof/framework-web build` | runs `vue-tsc` before Vite; exit 0 |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass |
| Graph refresh | `graphify update .` | exit 0 |

## Scope

**In scope**:

- `apps/web/package.json`
- `apps/web/src/framework/adapters/resources/**`
- `apps/web/src/routes/(authenticated)/settings/roles/**`
- `apps/web/src/routes/(authenticated)/settings/users/**`
- `apps/web/src/routes/(authenticated)/hr/overtimes/**`
- `apps/web/src/routes/(authenticated)/to-do/**`
- `apps/web/src/components/navigations/NotificationInbox.vue`
- `apps/web/src/framework/notifications/moduleRoutes.ts`
- `apps/web/src/framework/notifications/moduleRoutes.spec.ts`
- `apps/web/src/manifest/navigation.ts`
- `apps/web/src/router/__tests__/detail-parents.spec.ts`
- `apps/web/src/router/__tests__/layout-groups.spec.ts`
- `apps/web/src/route-map.d.ts`
- `docs/architecture/resource-migration-guide.md`
- `docs/architecture/web-application-architecture.md`
- generated `graphify-out/**`
- `plans/README.md`

**Out of scope**:

- API route/schema changes
- Sprindle changes
- framework resource API changes beyond consuming Plan 037
- route hierarchy/names and existing valid actions/permissions; removing the invalid overtime
  delete action is explicitly in scope
- visual redesign
- moving optimistic/toast/dialog state out of Vue
- adding a generic repository/service locator
- a single shared `controller.ts`
- route-folder `index.ts` barrels
- compatibility re-exports from old flat `.ts` files
- changing backend authorization

## Git workflow

- Suggested branch: `codex/038-colocated-resource-types`
- Suggested commit: `refactor(web): colocate typed route resources`
- Do not stage, commit, push, or open a PR unless the operator requests it.

## Steps

### Step 1: Make the web build fail on type errors

Change `apps/web/package.json` so `build` runs the existing `type-check` script before `build-only`.
Use sequential execution; do not run `vue-tsc` and Vite in parallel because both depend on the
generated route type surface.

Target script shape:

```json
"build": "run-s type-check build-only"
```

Do not duplicate the `vue-tsc` command inside `build`; keep `type-check` independently callable for
focused agent feedback. Do not remove the separate CI type-check step: it remains a clearer failure
boundary even though build now enforces the same invariant.

**Verify**:

```sh
node -e "const p=require('./apps/web/package.json'); if (p.scripts.build !== 'run-s type-check build-only') process.exit(1)"
pnpm --filter @southneuhof/framework-web type-check
pnpm --filter @southneuhof/framework-web build
```

Expected: the static assertion and both package commands exit 0; build output shows the type-check
command completing before Vite.

### Step 2: Add compile-time proofs against every live Hono resource

Before moving runtime files, add compile-time proofs directly at their final owning paths:

```text
apps/web/src/routes/(authenticated)/settings/roles/roles.operations.type-test.ts
apps/web/src/routes/(authenticated)/settings/roles/[roleId]/detail/permissions/role-permissions.operations.type-test.ts
apps/web/src/routes/(authenticated)/settings/users/users.operations.type-test.ts
apps/web/src/routes/(authenticated)/settings/users/[userId]/detail/roles/user-roles.operations.type-test.ts
apps/web/src/routes/(authenticated)/hr/overtimes/overtimes.operations.type-test.ts
apps/web/src/routes/(authenticated)/hr/overtimes/[overtimeId]/overtime-workflow.operations.type-test.ts
apps/web/src/routes/(authenticated)/to-do/notifications.operations.type-test.ts
```

Cover:

- roles CRUD;
- users read/update-only;
- overtimes read/create/update with no delete;
- notifications read-only;
- role permissions custom list/mutations;
- user roles custom list/mutations;
- verification steps;
- overtime submit/verify;
- notification unread-count/mark-seen.

Prove exact successful response/request types through Plan 037 helpers. Include negative assertions:

- user update rejects `email`;
- users expose no typed create/delete operation;
- overtimes expose no typed delete operation;
- notifications expose no typed create/update/delete operation;
- role create rejects missing/wrong `name`;
- overtime RPC create is inferred exactly, while the UI-authorable overtime draft excludes
  server-derived fields through a derived `Pick`;
- invalid status literals fail;
- custom route params are required;
- list/detail records expose their actual returned properties.

If the API type contradicts runtime/schema intent, STOP with exact endpoint and inferred type. Do not
paper over it with an interface.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web type-check
```

Expected: all positive proofs compile and every `@ts-expect-error` is consumed.

### Step 3: Replace the broad RPC adapter and casts

Migrate ordinary CRUD construction to the Plan 037 parent-route API:

```ts
createHonoResourceOperations(rpc.<resource>)
```

Delete `rpcResource.ts`, `rpcRoute.ts`, and `rpcResource.spec.ts` after their consumers move; Plan
037's Hono adapter tests replace the obsolete generic-adapter test. Custom operations use
`HonoRequestOf`, `HonoResponseOf`, and the shared parsed-response helper from the optional Hono
subpath; do not recreate a local `RpcCRUDRoute`.

Do not pass selected endpoint objects and do not maintain a capability list. Plan 037 maps the
parent proxy's TypeScript shape to exact public operation keys while its runtime object remains
universal and opaque. Never enumerate the resulting object, derive controls from its physical keys,
or reintroduce `ResourceCapabilities`. `defineResource()` uses typed operation keys for behavior
and existing actions for UI controls.

Static gate:

```sh
rg -n "RpcCRUDRoute|AsyncFunction|as unknown as Rpc|createRpcOperations|parseRpcResponse<" \
  apps/web/src/routes apps/web/src/framework/adapters/resources
rg -n "createHonoResourceOperations\\(\\{" apps/web/src
rg -n "\\.capabilities\\b|ResourceCapabilities" apps/web/src
```

Expected: all three scans return no matches.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run \
  'src/routes/(authenticated)/settings' \
  'src/routes/(authenticated)/hr/overtimes' \
  'src/routes/(authenticated)/to-do'
pnpm --filter @southneuhof/framework-web type-check
```

Expected: focused tests pass; type-check exits 0.

### Step 4: Colocate roles with their owning route subtrees

Move primary role files to:

```text
apps/web/src/routes/(authenticated)/settings/roles/roles.operations.ts
apps/web/src/routes/(authenticated)/settings/roles/roles.resource.ts
```

`roles.operations.ts` exports Hono-derived CRUD operations and `Role`, `RoleCreate`, `RoleUpdate`.
`roles.resource.ts` owns fields/schemas/surfaces/actions only.

Move child permission files to their exact route owner:

```text
apps/web/src/routes/(authenticated)/settings/roles/[roleId]/detail/permissions/role-permissions.operations.ts
apps/web/src/routes/(authenticated)/settings/roles/[roleId]/detail/permissions/role-permissions.resource.ts
```

`role-permissions.operations.ts` derives `RolePermission` from the list endpoint and owns list,
assign, and revoke calls. `role-permissions.resource.ts` owns fields, list resource, and action.

Keep optimistic pending/rollback/toasts in the permissions Vue route. It imports typed operations
directly from sibling files. Other role routes import the primary resource directly from
`roles.resource.ts`. `apps/web/src/manifest/navigation.ts` also imports that direct route-owned
resource path.

Delete handwritten `Role`, `RoleQuery`, `RoleDraft`, and `RolePermission` declarations.
Replace runtime `roles.capabilities` assertions with:

- type proofs for the five typed role operation/resource behaviors;
- control assertions driven by declared actions/access;
- ordinary runtime request/normalization assertions.

Move `apps/web/src/framework/adapters/resources/roles.spec.ts` to
`apps/web/src/routes/(authenticated)/settings/roles/roles.resource.spec.ts`; keep permission route
tests in their existing child route folder.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run \
  'src/routes/(authenticated)/settings/roles' \
  src/router/__tests__/detail-parents.spec.ts
```

Expected: role resource and screen tests pass.

### Step 5: Colocate users and use the typed user-role endpoint directly

Move primary user files to:

```text
apps/web/src/routes/(authenticated)/settings/users/users.operations.ts
apps/web/src/routes/(authenticated)/settings/users/users.resource.ts
```

`users.operations.ts` exports Hono-derived list/detail/update operations plus exact `User` and
`UserUpdate`. `users.resource.ts` owns fields/schemas/surfaces/actions.

Because the API update body excludes email:

- email remains visible on list/detail;
- email is `form: false`;
- edit form submits only inferred `UserUpdate` fields;
- no API change is made.

For user roles, stop fetching roles plus assignments separately. The existing
`rpc.users[':userId'].roles.$get` endpoint already returns display-ready rows. Derive its item type,
use `assigned` directly, and let `userRoles` load that endpoint. Place both files under their exact
child route owner:

```text
apps/web/src/routes/(authenticated)/settings/users/[userId]/detail/roles/user-roles.operations.ts
apps/web/src/routes/(authenticated)/settings/users/[userId]/detail/roles/user-roles.resource.ts
```

Delete:

- `User`, `UserQuery`, `UserDraft` interfaces;
- `AssignableRole`;
- `loadAssignableRoles`;
- client-side role/assignment join;
- `active` renaming.

Replace runtime user capability-object assertions with negative compile proofs for create/delete
plus action/control assertions. Do not introduce a replacement boolean matrix.

Update the Vue route's optimistic state from `active` to the endpoint's `assigned` field.
`setUserRole` stays in `user-roles.operations.ts`.

All user routes and `apps/web/src/manifest/navigation.ts` use direct imports from these files. Add
no route-folder barrel.

Tests must assert one list request, not the current two-request join.
Move `apps/web/src/framework/adapters/resources/users.spec.ts` to
`apps/web/src/routes/(authenticated)/settings/users/users.resource.spec.ts`; keep user-role route
tests in their existing child route folder.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run \
  'src/routes/(authenticated)/settings/users' \
  src/router/__tests__/detail-parents.spec.ts
```

Expected: user resource/routes pass; role list performs one endpoint request; email is not submitted.

### Step 6: Colocate overtimes by CRUD root and identity subtree

Place files shared by list/create/detail/edit at the CRUD route root:

```text
apps/web/src/routes/(authenticated)/hr/overtimes/overtimes.operations.ts
apps/web/src/routes/(authenticated)/hr/overtimes/overtimes.resource.ts
```

Place ID-only detail concerns under the dynamic route folder:

```text
apps/web/src/routes/(authenticated)/hr/overtimes/[overtimeId]/verification-steps.operations.ts
apps/web/src/routes/(authenticated)/hr/overtimes/[overtimeId]/verification-steps.resource.ts
apps/web/src/routes/(authenticated)/hr/overtimes/[overtimeId]/overtime-workflow.operations.ts
```

- `overtimes.operations.ts`: inferred list/detail/create/update operations plus `Overtime`, create,
  and update types.
- `overtimes.resource.ts`: fields/schemas/surfaces/actions.
- `verification-steps.operations.ts`: typed custom loader and `VerificationStep`.
- `verification-steps.resource.ts`: child resource presentation.
- `overtime-workflow.operations.ts`: typed load/submit/verify workflow functions.

Derive `OvertimeStatus` from `Overtime['statusCode']` or the API's exported authoritative constant;
do not repeat its literal union. Derive verification status from `VerificationStep`.

Define `OvertimeDraft` as a `Pick` of the inferred create request containing only authorable form
fields. Do not change the API contract or assert that its server-overwritten fields are absent.

`loadOvertime()` may delegate to inferred CRUD detail operation or call the typed endpoint directly,
but it must return exact `Overtime` without a response cast.

Keep workflow-dependent control visibility and dialog/toast state in the detail Vue route.
Delete the resource's current `delete` action: the API intentionally exposes no delete endpoint, so
Plan 037's action constraint must reject it. Add a screen/resource assertion that no delete control
is rendered; do not replace it with a hidden/disabled flag.
All imports are direct. Update `apps/web/src/manifest/navigation.ts` to import
`overtimes.resource.ts` from the route root.
Move `apps/web/src/framework/adapters/resources/overtimes.spec.ts` to
`apps/web/src/routes/(authenticated)/hr/overtimes/overtimes.resource.spec.ts`.
Replace its runtime capability matrix with a negative delete type proof and action/control behavior
assertions.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run \
  'src/routes/(authenticated)/hr/overtimes'
```

Expected: overtime resource/workflow/route tests pass.

### Step 7: Colocate notifications with the canonical To Do route

The To Do list is the canonical notification route. Move its files to:

```text
apps/web/src/routes/(authenticated)/to-do/notifications.operations.ts
apps/web/src/routes/(authenticated)/to-do/notifications.resource.ts
```

- `notifications.operations.ts`: inferred read operations, unread-count, mark-seen, `unreadIds`,
  and all endpoint-derived types.
- `notifications.resource.ts`: fields and surface declarations.

Derive:

- `NotificationRecord` from list/detail response;
- `NotificationStatus` from `NotificationRecord['statusCode']` or authoritative API constant;
- unread-count and mark-seen results from their endpoint responses.

Delete `NotificationQuery` and all generic response casts. Preserve `unset` exclusion behavior and
tests.

Update `NotificationInbox.vue`, the To Do route, `moduleRoutes.ts`, and `moduleRoutes.spec.ts` to use
direct imports from these route-owned files. Global reuse does not move ownership back to
`framework/`; To Do remains canonical owner.
Move `apps/web/src/framework/adapters/resources/notifications.spec.ts` to
`apps/web/src/routes/(authenticated)/to-do/notifications.resource.spec.ts`.
Replace capability-object assertions with negative write-operation type proofs and action/control
behavior assertions.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run \
  'src/routes/(authenticated)/to-do' \
  src/framework/notifications \
  src/components/navigations
```

Expected: notification resource, inbox/module routing, and To Do tests pass.

### Step 8: Enforce architectural boundaries

Add static boundary tests:

1. `*.resource.ts` may import framework APIs, entity schemas, and sibling operations; it must not
   access `rpc` or Hono endpoint methods.
2. `*.operations.ts` may import RPC/Hono tools and sibling operation types; it must not import Vue,
   router, components, or toast libraries.
3. `.route.vue` files under migrated CRUD routes must not call `rpc.*` directly.
4. Each resource/operation file is inside its owning route subtree at the locked path.
5. No route-folder `index.ts` barrel re-exports resource/operation symbols.
6. Old flat resource files, `rpcResource.ts`, and `rpcRoute.ts` are absent; central
   `apps/web/src/framework/adapters/resources/` contains no application resource.
7. No handwritten transport mirror remains for migrated resources.
8. Every `createHonoResourceOperations` call receives exactly one typed `rpc.<resource>` parent
   proxy, never selected endpoint objects, casts, strings, arrays, flags, or metadata.
9. No application code reads `resource.capabilities`, imports `ResourceCapabilities`, or enumerates
   a Hono-derived operations object.
10. `apps/web/package.json` keeps `vue-tsc` in the package build gate.

Do not enforce arbitrary line-count limits. Cohesion determines splitting; line count is only a
review signal.

Run the production build, then verify colocated TypeScript files did not alter the generated route
surface:

```sh
pnpm --filter @southneuhof/framework-web build
shasum -a 256 apps/web/src/route-map.d.ts
```

Expected route-map hash at the pinned revision:

```text
1077dea03dd35d1e2ad7b0fb74a87a566d489b23053347e59e75df48b91fbfb8
```

If drift existed before implementation, compare semantic route names/paths against the pre-change
file instead of forcing this historical hash. Resource colocation must introduce zero route-map
changes.

**Verify**:

```sh
pnpm --filter @southneuhof/framework-web test -- --run \
  src/framework/__tests__ \
  'src/routes/(authenticated)'
```

Expected: boundary tests pass.

### Step 9: Document resource authoring workflow

Update architecture and migration docs:

```text
Hono app
  typed client endpoint
    -> route-owned *.operations.ts
      -> exact ResourceOperations + derived types
        -> route-owned *.resource.ts
          -> Vue route/view
```

Document:

- route subtree is resource ownership and navigation unit;
- shared CRUD resources sit at the CRUD route root;
- ID-only and child-resource files sit at the nearest owning nested route;
- cross-cutting UI imports directly from the canonical route-owned file;
- route resource barrels and a central application resource registry are forbidden;
- resource definitions stay declarative;
- operations stay separate from Vue;
- split complex operations by use case;
- Hono types derive automatically;
- autocomplete/build-time operation keys come from the Hono parent route type;
- physical Hono-derived operation-object keys are opaque and must not be enumerated;
- actions are UI truth, not transport selectors;
- external/local backends may provide manual types/operations;
- local projection types are valid only when the client creates a genuinely new shape;
- UI state remains in Vue;
- query-state and wire-query types are distinct at serialization boundary.

Include one Hono resource and one bring-your-own backend example.

**Verify**:

```sh
rg -n "route.*own|operations\\.ts|createHonoResourceOperations|bring-your-own|client.*projection" \
  docs/architecture
```

Expected: all five concepts appear in maintained docs.

### Step 10: Run final gates and refresh graph

```sh
pnpm --filter @southneuhof/is-vue-framework test
pnpm --filter @southneuhof/is-vue-framework type-check
pnpm --filter @southneuhof/framework-web test
pnpm --filter @southneuhof/framework-web type-check
pnpm --filter @southneuhof/framework-web lint
pnpm --filter @southneuhof/framework-web build
graphify update .
```

Expected: all exit 0. Update Plan 038 status to `DONE`.

## Test plan

- Exact live API inference for every migrated resource/custom endpoint.
- Autocomplete-equivalent key proofs for full, partial, and read-only parent routes.
- Negative compile proofs for forbidden user email update and invalid statuses/bodies.
- Negative compile proofs for every absent standard operation.
- Runtime parity for supported standard operations.
- Role-permission and user-role assignment behavior.
- One-request user-role loading.
- Overtime workflow behavior.
- Notification unread semantics.
- Import-boundary/static architecture tests.
- Route-colocation and no-barrel architecture tests.
- No runtime capability-object or operation-enumeration usage.
- Web package build invokes `vue-tsc` before Vite.
- Full web/framework regression suite and build.

## Done criteria

- [ ] Every application resource and operation file exists at its locked owning route path.
- [ ] `apps/web/src/framework/adapters/resources/` contains no application resource or compatibility
  re-export; obsolete adapter files are deleted.
- [ ] No route-folder `index.ts` barrel hides resource ownership.
- [ ] Resource declaration files contain no raw RPC calls.
- [ ] Operation files contain no Vue/router/toast imports.
- [ ] Vue route files contain no raw RPC calls.
- [ ] Standard record/create/update types derive from Hono operations; narrower UI drafts use
  `Pick`/`Omit` over those derived types.
- [ ] Custom endpoint records/results derive from Hono response types.
- [ ] `RoleQuery`, `UserQuery`, `NotificationQuery`, `UserDraft`, `AssignableRole`, and equivalent
  mirrors are deleted.
- [ ] User email remains read-only and is absent from update submissions.
- [ ] Overtime has no typed delete operation, delete action, or delete control.
- [ ] User-role list uses one typed endpoint request and the `assigned` field.
- [ ] No `RpcCRUDRoute`, `AsyncFunction`, RPC cast, or generic response assertion remains.
- [ ] Every Hono resource passes one typed parent route to `createHonoResourceOperations`; no
  endpoint list, capability data, runtime proxy probing, or operation enumeration exists.
- [ ] `ResourceCapabilities` and application `.capabilities` reads are absent.
- [ ] Actions remain UI target/permission truth and are never used to materialize transport.
- [ ] `pnpm --filter @southneuhof/framework-web build` runs `vue-tsc` before Vite.
- [ ] External/manual backend path remains supported and documented.
- [ ] Framework/web tests and types pass; web lint/build pass.
- [ ] `graphify update .` exits 0.
- [ ] Plan 038 status is `DONE`.

## STOP conditions

Stop and report if:

- Plan 037 is not `DONE`;
- a live Hono endpoint resolves to `any`, `unknown`, or a broad record despite exact API typing;
- list and detail endpoints for one resource return incompatible record shapes that cannot be
  represented honestly;
- migration reveals an intended UI write the API contract forbids, other than the already-decided
  read-only user email;
- a local type is required but cannot be expressed as a derivation/projection of typed inputs;
- route behavior would need to move into operations to satisfy the file layout;
- backend/API changes appear necessary;
- any consumer cannot import its canonical route-owned resource without a cycle;
- the parent-route helper loses exact typed keys or requires duplicated path strings, endpoint
  selection, or a separate capability manifest;
- the file router treats colocated non-`.route.vue` TypeScript files as routes or otherwise changes
  generated route names/paths;
- preserving old import paths appears necessary;
- a focused gate fails twice after one reasonable correction.

Report exact endpoint type, expected usage, and smallest conflicting code excerpt. Do not restore a
handwritten transport mirror to make compilation green.

## Maintenance notes

When a resource grows, add a cohesive operation file at the nearest route subtree semantically
owning that concern; do not move it to a central resource registry, into Vue, or into a generic
controller. When a resource gains a consumer outside its route subtree, keep canonical ownership
stable and use a direct import unless that creates a cycle; then stop and reassess ownership. When
API shape changes, Hono compile failures should lead directly to affected operations/resources. A
handwritten type is acceptable only at a bring-your-own boundary or for a genuinely client-created
projection. Runtime enumeration of Hono-derived operations is unsupported; reviewers should reject
`Object.keys`, `Reflect.ownKeys`, truthiness-based capability inference, and broad casts around
those objects.
