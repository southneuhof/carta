# Plan 037: Make resource behavior type-exact without runtime route reflection

> **Implementation instructions**: Follow this plan step by step. Run every verification command
> and confirm the expected result before moving to the next step. If anything in the STOP
> conditions occurs, stop and report; do not improvise. Do not migrate application resources here:
> Plan 038 owns that clean break. When implementation and review are complete, update this plan's
> status row in `plans/README.md`.
>
> **Drift check (run first)**:
>
> ```sh
> git diff --stat 17e7ed9..HEAD -- \
>   packages/is-vue-framework \
>   packages/sdk \
>   pnpm-lock.yaml \
>   docs/architecture/resource-migration-guide.md \
>   docs/architecture/web-application-architecture.md
> ```
>
> Any in-scope change not attributable to a completed plan is drift. Compare the Current state
> excerpts and pinned hashes against the live files before proceeding; a conflicting change is a
> STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED (the runtime implementation intentionally differs from its public type surface; a
  widened generic would silently discard the compile-time safety this plan is meant to add)
- **Depends on**: `plans/036-make-files-and-resource-actions-route-truth.md`
- **Category**: architecture / DX / tests
- **Planned at**: commit `17e7ed9`, 2026-07-27
- **Revised**: 2026-07-27 after accepting type-exact transport behavior plus action-exact UI as the
  codegen-free replacement for runtime route reflection

## Why this matters

Hono RPC already carries exact route, request, and response types from the API to `hc<AppType>`.
The current web adapter erases them into `(...args: any[]) => Promise<any>`, and application
resources compensate with handwritten record, query, create, and update mirrors. Those mirrors have
already drifted: the web user draft permits `email`, while the authoritative update endpoint does
not.

The rejected design tried to make an `hc()` parent proxy double as runtime capability metadata.
That is impossible: Hono returns another callable proxy for every property access, including routes
that do not exist. This plan deliberately stops asking JavaScript object keys to represent
transport truth. TypeScript owns transport availability and autocomplete; resource actions own
visible UI affordances; the API owns runtime enforcement.

This is a clean break. `ResourceCapabilities` is removed rather than replaced with a manifest,
provider, generated file, discovery request, or second metadata layer.

## Locked design

### Three separate truths

1. **Transport truth at authoring/build time** comes from the exact Hono route type.
   `createHonoResourceOperations(rpc.users)` autocompletes `list`, `detail`, and `update`; typed
   access to `create` or `delete` fails.
2. **UI truth at runtime** comes from existing resource `actions` plus their route target,
   permission, visibility predicate, and access adapter. Actions never select or materialize
   transport operations. A typed action key must correspond to a typed operation key.
3. **Runtime enforcement** stays on the API. Unsupported requests return the server's normal
   not-found/method response, and backend authorization remains authoritative.

### Accepted tradeoff

`createHonoResourceOperations(route)` returns an ordinary, spreadable JavaScript object whose
implementation contains conventional wrappers for all five standard CRUD operations. The public
mapped type exposes only operations present in `typeof route`.

Consequences:

- autocomplete and `vue-tsc`/`tsc` errors are exact for normal TypeScript consumers;
- object spread and overrides remain ordinary JavaScript;
- `Object.keys`, `Reflect.ownKeys`, serialization, truthiness, and casts to `any` are not supported
  ways to inspect transport capability;
- a caller that bypasses types can invoke an unsupported wrapper and receive a server error;
- `defineResource()` may likewise retain uniform physical surface methods while its public
  conditional type hides unsupported table/detail/form/remove behavior; resource enumeration is
  not capability reflection either;
- no framework code may derive UI controls or public capabilities from operation-object
  enumeration;
- runtime tests must assert this mismatch explicitly instead of pretending it does not exist.

This does not introduce a new hole. Raw `hc()` already permits arbitrary property chains at runtime.
The change is to stop exposing that behavior as a truthful framework capability API.

### Public API

1. Core resource contracts remain backend-neutral. Hono integration is available only from:

   ```ts
   import {
     createHonoResourceOperations,
     type HonoRequestOf,
     type HonoResponseOf,
   } from '@southneuhof/is-vue-framework/hono'
   ```

2. Root `@southneuhof/is-vue-framework` exports backend-neutral operation extractors:

   ```ts
   ResourceRecordOf<TOperations>
   ResourceQueryOf<TOperations>
   ResourceCreateOf<TOperations>
   ResourceUpdateOf<TOperations>
   ResourceIdentityOf<TOperations>
   ```

3. The root package does not export Hono symbols or import Hono at runtime.
4. `hono` is an optional peer and a development dependency for integration/type tests, not a
   required runtime dependency of the root package.
5. `defineResource()` preserves the exact literal operation-key set in a `const` generic. It must
   not widen an inferred Hono operation object to the current all-optional `ResourceOperations`
   interface.
6. The returned resource type exposes only behavior backed by the inferred operation keys:
   - `table` requires `list`;
   - `detail` requires `detail`;
   - create-form overloads require `create`;
   - update-form overloads require `update`;
   - `remove` requires `delete`;
   - `invalidate`, identity, fields, schemas, and actions remain on the base resource.
7. Public structural aliases make view/component requirements explicit, for example a list-capable
   resource and a detail-capable resource, without Hono vocabulary in their names.
8. `actions` remains UI/navigation/permission data. The accepted action keys are constrained by the
   exact `TOperations` keys, but an operation may exist without an action for programmatic or hidden
   use.
9. Manual/local/external backends still pass ordinary `ResourceOperations`. They receive the same
   exact-key behavior when their operation object remains narrow.
10. `HonoRequestOf` exposes the exact wire query type. `ResourceQueryOf` exposes the adapter-facing
    query contract: it preserves known query keys and literal unions, while broad wire strings may
    accept serializable UI scalars because the adapter converts them to strings. A domain filter
    may narrow one derived key from the inferred record, for example
    `{ statusCode?: Overtime['statusCode'] }`; it must not restate pagination/search boilerplate.
11. No code generation, runtime OpenAPI fetch, route manifest, capability array, boolean map,
    provider symbol, custom global proxy, or Sprindle/API change is permitted.

## Target usage and expected editor/build behavior

Full CRUD:

```ts
const roleOperations = createHonoResourceOperations(rpc.roles)

roleOperations.list
roleOperations.detail
roleOperations.create
roleOperations.update
roleOperations.delete

export type Role = ResourceRecordOf<typeof roleOperations>
export type RoleCreate = ResourceCreateOf<typeof roleOperations>
export type RoleUpdate = ResourceUpdateOf<typeof roleOperations>
```

Partial CRUD:

```ts
const userOperations = createHonoResourceOperations(rpc.users)

userOperations.list
userOperations.detail
userOperations.update

// @ts-expect-error users has no create endpoint
userOperations.create
// @ts-expect-error users has no delete endpoint
userOperations.delete
```

Resource action validation:

```ts
defineResource({
  key: 'users',
  fields: userFields,
  operations: userOperations,
  actions: {
    list: { permission: 'users.list', to: { name: 'settings-users' } },
    update: {
      permission: 'users.update',
      to: { name: 'settings-users-edit', params: (id) => ({ userId: id }) },
    },
    // @ts-expect-error create is not a typed user operation
    create: { permission: 'users.create', to: { name: 'settings-users-new' } },
  },
})
```

Ordinary override:

```ts
defineResource({
  key: 'roles',
  fields: roleFields,
  operations: {
    ...createHonoResourceOperations(rpc.roles),
    list: customList,
  },
  actions: roleActions,
})
```

Bring-your-own backend:

```ts
interface Customer extends Record<string, unknown> {
  id: string
  name: string
}

interface CustomerCreate extends Record<string, unknown> {
  name: string
}

const customerOperations = {
  list: async () => ({ data: await externalClient.customers() }),
  create: async (input: CustomerCreate) => externalClient.createCustomer(input),
} satisfies ResourceOperations<Customer, Record<string, unknown>, CustomerCreate>

const customers = defineResource({
  key: 'customers',
  fields: customerFields,
  operations: customerOperations,
  actions: customerActions,
})
```

If TypeScript cannot infer `Customer` from a structurally narrow manual object, add a
backend-neutral `defineResourceOperations()` identity helper rather than asking the caller for Hono
types or widening `defineResource()`. Add that helper only when a type proof demonstrates the need.

## Current state

- `packages/sdk/src/client.ts:1-15` already returns `hc<AppType>` without an application cast:

  ```ts
  export function createRpcClient(baseUrl: string, options: ClientRequestOptions = {}) {
    return hc<AppType>(baseUrl, { ... })
  }
  ```

- `packages/sdk/src/__tests__/client.spec.ts:13-39` proves missing routes/methods and invalid request
  bodies fail at compile time before this adapter exists.
- `packages/is-vue-framework/src/resources/defineResource.ts:61-75` defines all five operations as
  optional on one broad interface.
- `ResourceDefinition.operations` at `defineResource.ts:142-159` widens operation values to that
  broad interface; it does not carry an exact `TOperations` key set.
- `Resource` at `defineResource.ts:196-224` always exposes `table`, `detail`, both `form` overloads,
  and `remove`, even when the corresponding operation is absent.
- `defineResource()` at `defineResource.ts:277-286` computes `ResourceCapabilities` from runtime
  truthiness.
- `resources/controls.ts:70-103` requires both `capabilities` and `actions` before rendering standard
  controls.
- `ListView.vue` and `DetailView.vue` accept the broad `Resource` type. `DetailView` assumes
  `remove()` always exists and must be adjusted for a typed detail resource without delete.
- `packages/is-vue-framework/package.json` exposes no `/hono` subpath and has no Hono peer.
- Installed Hono version is `4.12.27`.
- Hono `4.12.27` implements `hc()` with a universal JavaScript `Proxy`. Every string property read
  returns another callable proxy; route keys are absent from runtime enumeration.
- `apps/web/src/framework/adapters/resources/rpcRoute.ts` and `rpcResource.ts` currently erase Hono
  signatures and recreate resource types through caller generics. Plan 038 deletes them.

Pinned hashes:

```text
ced8fab81ce3456ab11158e6662d9c83ab757000405124358b55cad1ef2c988e  packages/is-vue-framework/package.json
4dc490f5cb4d2ba603b9df82b128029348d346e0cc6dcb9c9ca7beb500525cdb  packages/is-vue-framework/src/resources/defineResource.ts
103d751554555fb2befe900e316b5f6c661cd88ed3e58aeb5b4dcef4d80a691e  packages/is-vue-framework/src/resources/controls.ts
789dd4950666173790493e9be6226834b18f24143789aa3fe10c37499d71e4c5  packages/is-vue-framework/src/resources/index.ts
a8e0c92b91717b8f9052c1408a74746c7dc05541e8fa98902fe6f153ed6689a9  packages/is-vue-framework/src/components/views/ListView.vue
beffd19af9c498675cc8777660501ac624853179913d61b7a44a4fcab8da918f  packages/is-vue-framework/src/components/views/DetailView.vue
4ae265cf8c2957140729afc39ed9da33394cf5ad3a096e27d47c5a0fd15d5831  packages/sdk/src/client.ts
45563a8ca72f85753a21bbde35b744d0a51f0014fb0d015af462eef460530cc43  packages/sdk/src/__tests__/client.spec.ts
```

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Framework focused runtime tests | `pnpm --filter @southneuhof/is-vue-framework test -- --run src/resources/__tests__/resources.spec.ts src/hono/__tests__/resource.spec.ts` | all matched tests pass |
| Framework types | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0; every negative assertion is consumed |
| Framework build | `pnpm --filter @southneuhof/is-vue-framework build` | exit 0; build runs the framework type checker |
| Framework full tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass |
| SDK tests | `pnpm --filter @southneuhof/sdk test` | all pass |
| SDK types | `pnpm --filter @southneuhof/sdk type-check` | exit 0 |
| Lock consistency | `pnpm install --lockfile-only --offline` | exit 0 without downloading packages |
| Static forbidden-pattern scan | `rg -n "ResourceCapabilities|capabilities:" packages/is-vue-framework/src/resources packages/is-vue-framework/src/components/views` | no matches |
| Graph refresh | `graphify update .` | exit 0 |

## Scope

**In scope**:

- `packages/is-vue-framework/package.json`
- `packages/is-vue-framework/src/hono/resource.ts` (create)
- `packages/is-vue-framework/src/hono/index.ts` (create)
- `packages/is-vue-framework/src/hono/__tests__/resource.spec.ts` (create)
- `packages/is-vue-framework/src/hono/__type-tests__/resource.type-test.ts` (create)
- `packages/is-vue-framework/src/resources/defineResource.ts`
- `packages/is-vue-framework/src/resources/controls.ts`
- `packages/is-vue-framework/src/resources/index.ts`
- `packages/is-vue-framework/src/resources/__tests__/resources.spec.ts`
- `packages/is-vue-framework/src/contracts/__type-tests__/contracts.type-test.ts`
- `packages/is-vue-framework/src/components/views/ListView.vue`
- `packages/is-vue-framework/src/components/views/DetailView.vue`
- focused view tests/type tests needed for the narrowed resource props
- `packages/is-vue-framework/src/__tests__/public-api.spec.ts`
- `packages/sdk/src/__tests__/client.spec.ts` only for a cross-package inference proof if the local
  Hono fixture cannot prove the real SDK boundary
- `pnpm-lock.yaml`
- `docs/architecture/resource-migration-guide.md`
- `docs/architecture/web-application-architecture.md`
- generated `graphify-out/**`
- `plans/README.md`

**Out of scope**:

- application resource migration under `apps/web/src/**`
- changing `apps/web/package.json`; Plan 038 makes the web build itself type-checking
- API routes, schemas, handlers, or authorization
- Sprindle route factories or runtime
- code generation or generated route/capability manifests
- OpenAPI/OPTIONS/startup route discovery
- server-rendered or injected web bootstrap data
- a Hono dependency or export on the root framework entry point
- compatibility aliases for `ResourceCapabilities`

## Git workflow

- Suggested branch: `codex/037-type-exact-hono-resources`
- Suggested commit: `feat(framework): infer Hono resource behavior`
- Match the repository's conventional commit style.
- Do not stage, commit, push, or open a PR unless the operator requests it.

## Steps

### Step 1: Characterize exact-key inference before changing runtime code

Create `src/hono/__type-tests__/resource.type-test.ts` with an in-memory typed Hono app containing:

- full CRUD;
- read/update-only;
- read-only;
- typed list query;
- required detail path parameter;
- distinct create and update bodies;
- success and typed error statuses;
- one custom endpoint.

Create `hc<typeof app>` and first prove the raw parent route types:

- full CRUD autocompletes all five conventional branches;
- read/update-only lacks `create` and `delete`;
- read-only lacks all write branches;
- invalid method, param, query, body, and response assumptions consume `@ts-expect-error`;
- no inferred request or response becomes `any`, `unknown`, or `Record<string, unknown>`.

Keep this fixture local to the framework package. Do not import the Carta API into framework tests.

**Verify**:

```sh
pnpm --filter @southneuhof/is-vue-framework type-check
```

Expected: exit 0 and all negative Hono assertions are consumed.

### Step 2: Preserve exact operation keys through the backend-neutral resource API

Refactor `resources/defineResource.ts` around an exact `const TOperations` generic.

Add backend-neutral extractors:

```text
ResourceRecordOf
ResourceQueryOf
ResourceCreateOf
ResourceUpdateOf
ResourceIdentityOf
```

Keep any phantom record/query/create/update/identity metadata type-only. It must add no runtime key,
symbol, descriptor, or serialization behavior. Prove that ordinary spread preserves the metadata
needed by the extractors.

Add conditional resource behavior types whose keys are selected from `keyof TOperations`. Keep
identity, fields, schemas, actions, and invalidation on a common base. Provide structural aliases
for list-capable and detail-capable resources so view components do not accept a resource lacking
the surface they invoke.

The create/update `form` property must have only the supported overloads:

- create only: no-id/create arguments only;
- update only: `{ id, ... }` only;
- both: both overload groups;
- neither: no public `form` property.

Make `ResourceActionsDefinition` generic over the supported action keys. `defineResource()` must
reject an action whose key is absent from `TOperations`, while allowing an operation with no action.

If callers that spell early generic arguments cannot preserve later exact-key inference, prefer a
single inferred definition generic or overloads over asking callers to spell five or six generic
arguments. Preserve the existing ergonomic no-generic Hono target usage. Update existing framework
fixtures to keep operation objects narrow.

Add type proofs covering:

- autocomplete-equivalent key presence via `keyof`;
- invalid operation property access;
- invalid action keys;
- list/detail/create/update/delete surface presence and absence;
- full CRUD, read-only, update-only, and no-operation resources;
- scalar and composite identity;
- plain object spread override preserving all non-overridden operation keys;
- manual backend operations;
- exact Hono wire queries through `HonoRequestOf`;
- adapter-facing query keys, literal unions, and scalar-to-string serialization without a repeated
  pagination/search interface;
- no regression in exact form input types.

**Verify**:

```sh
pnpm --filter @southneuhof/is-vue-framework type-check
pnpm --filter @southneuhof/is-vue-framework test -- --run src/resources/__tests__/resources.spec.ts
```

Expected: type-check exits 0, every negative assertion is consumed, and existing resource runtime
tests pass after their assertions are updated for the new public contract.

### Step 3: Remove runtime capabilities and make controls action-driven

Delete `ResourceCapabilities`, `resource.capabilities`, capability construction in
`defineResource()`, capability parameters in `controls.ts`, root/resource exports, and tests that
assert capability booleans.

`standardControls()` must use:

- the declared action;
- required navigation target, except delete;
- permission and `visible`;
- surface context and identity;
- an actual delete handler for delete.

It must not enumerate or test operation keys. Compile-time `actions` constraints established in
Step 2 provide the action-to-operation relationship for typed code.

Adjust:

- `ListView.vue` to accept only a list-capable resource;
- `DetailView.vue` to accept a detail-capable resource and offer delete only when the typed/runtime
  resource action provides it;
- view/resource tests so read-only resources demonstrate absence through action/control output and
  type errors, not runtime capability flags;
- public API tests so `ResourceCapabilities` is absent with no compatibility alias.

Do not replace capabilities with `supports()`, flags, arrays, metadata, a registry, or Hono-specific
logic in core.

**Verify**:

```sh
pnpm --filter @southneuhof/is-vue-framework test -- --run \
  src/resources/__tests__/resources.spec.ts \
  src/components/views/__tests__
pnpm --filter @southneuhof/is-vue-framework type-check
rg -n "ResourceCapabilities|\\.capabilities\\b|capabilities:" \
  packages/is-vue-framework/src/resources \
  packages/is-vue-framework/src/components/views
```

Expected: tests and type-check pass; the scan returns no matches.

### Step 4: Add the isolated Hono subpath and exact endpoint helpers

Add this package export:

```json
"./hono": "./src/hono/index.ts"
```

Add `hono: ^4.12.27` as an optional peer dependency and development dependency. Do not place Hono in
runtime `dependencies`; add the corresponding `peerDependenciesMeta.hono.optional: true`; do not
export the Hono subpath from `src/index.ts`.

In `src/hono/resource.ts`, use Hono's official type utilities to export:

```ts
type HonoRequestOf<TEndpoint>
type HonoResponseOf<TEndpoint, TStatus>
```

Preserve status-specific response inference so a typed error response does not contaminate a
successful record type. Do not copy Hono's internal conditional types.

Add public-boundary tests proving:

- the Hono subpath resolves explicitly;
- the root has no Hono integration exports;
- root source has no `hono` import/export;
- importing the root does not require Hono at runtime.

**Verify**:

```sh
pnpm install --lockfile-only --offline
pnpm --filter @southneuhof/is-vue-framework type-check
pnpm --filter @southneuhof/is-vue-framework test -- --run src/__tests__/public-api.spec.ts
```

Expected: lockfile update succeeds offline; type-check and public API tests pass.

### Step 5: Implement the type-exact, runtime-universal Hono adapter

Implement:

```ts
createHonoResourceOperations(rpc.roles)
```

The input is the typed Hono parent route proxy. Do not accept an endpoint-selection object,
capability list, boolean map, route strings, OpenAPI document, generated manifest, or application
generic arguments.

At the type level:

- inspect only the structural type of conventional `list`, `detail`, `create`, `update`, and
  `delete` branches;
- include an operation key only when its expected nested Hono endpoint/method exists;
- derive exact query, record, create, update, identity, and result types through Hono's official
  inference utilities;
- retain exact keys through object spread;
- reject incompatible conventional endpoint shapes in type tests.

At runtime, create all five conventional wrappers without checking whether their proxy branches
exist. Return a normal enumerable object so spread, override precedence, cloning, and ordinary
property behavior are unsurprising. Do not use a wrapper `Proxy`, symbols, getters, global patches,
or hidden provider state.

Runtime behavior must match the current application adapter:

- filter `null`, `undefined`, and empty-string query values;
- stringify remaining query/search parameters;
- merge `searchParameters` before query so explicit query values win;
- serialize scalar/composite identity;
- use the conventional Hono paths/methods for all five operations;
- parse JSON once;
- throw the parsed non-success payload;
- normalize list metadata to `CollectionResult`;
- normalize detail to the record;
- preserve inferred create/update/delete results.

Tests must explicitly prove both sides of the accepted tradeoff:

- `keyof` and property access expose only real typed route operations;
- `Object.keys()` sees all five runtime wrappers;
- conditional resource types hide unsupported public surfaces even though physical resource methods
  are not capability metadata;
- unsupported runtime invocation through a deliberate `any` escape reaches the fake fetch and
  returns/throws the simulated server failure;
- framework controls do not inspect those runtime keys;
- full CRUD, read/update-only, read-only, spread override, query precedence/serialization,
  successful normalization, parsed errors, scalar identity, and composite identity all work.

This mismatch must be named in the test description. Do not make runtime enumeration appear exact.

**Verify**:

```sh
pnpm --filter @southneuhof/is-vue-framework test -- --run src/hono/__tests__/resource.spec.ts
pnpm --filter @southneuhof/is-vue-framework type-check
```

Expected: all runtime tests pass; exact-key and invalid-access type assertions are consumed.

### Step 6: Document the contract and maintenance hazards

Update the architecture and migration guide with:

- transport availability is a TypeScript/build-time property;
- actions are runtime UI/navigation/permission truth and do not materialize operations;
- API routes and authorization are runtime enforcement;
- operation objects must never be enumerated for capabilities;
- `any`, broad annotations, explicit casts, and `ResourceOperations` widening discard safety;
- plain spread and explicit overrides are supported;
- hidden/programmatic operations need no action;
- manual backends use narrow ordinary operation objects;
- Hono integration stays under `/hono`;
- the web build is made type-checking by Plan 038.

Include one full CRUD example, one partial CRUD negative example, one spread override, and one manual
backend example. Do not claim runtime operation keys are exact.

Add a maintenance note beside the Hono helper implementation explaining that Hono upgrades must
rerun both compile-time key proofs and the universal-proxy runtime fixture.

**Verify**:

```sh
rg -n "build-time|actions|Object\\.keys|createHonoResourceOperations|bring-your-own" \
  packages/is-vue-framework/src \
  docs/architecture/resource-migration-guide.md \
  docs/architecture/web-application-architecture.md
```

Expected: maintained implementation/docs contain all five concepts.

### Step 7: Run final gates and refresh the graph

```sh
pnpm --filter @southneuhof/is-vue-framework test
pnpm --filter @southneuhof/is-vue-framework type-check
pnpm --filter @southneuhof/is-vue-framework build
pnpm --filter @southneuhof/sdk test
pnpm --filter @southneuhof/sdk type-check
graphify update .
```

Expected: all commands exit 0. Review `git diff --stat` against Scope, then update Plan 037 to
`DONE` in `plans/README.md`.

## Test plan

- Raw Hono parent-route presence/absence and request/response inference.
- Exact mapped CRUD keys for full, partial, and read-only routes.
- Negative property-access tests for unsupported operations.
- Negative action-key tests.
- Conditional table/detail/form/remove resource surface types.
- Manual backend exact-key inference.
- Scalar and composite identity.
- Ordinary object spread and custom override precedence.
- Universal runtime wrapper enumeration documented and tested.
- Query precedence and wire serialization.
- Conventional response normalization and parsed error propagation.
- Action/access/target/visibility-based control generation with no capability booleans.
- ListView/DetailView structural resource requirements.
- Root package remains Hono-free; optional `/hono` subpath resolves.

## Done criteria

- [ ] `createHonoResourceOperations(rpc.<resource>)` needs no endpoint list, capability metadata,
  application cast, or caller generic.
- [ ] Editor-visible keys and `vue-tsc` errors match the typed Hono route.
- [ ] Hono request and status-specific response types remain exact.
- [ ] `defineResource()` preserves the literal operation-key set without widening.
- [ ] Unsupported actions and resource behavior produce consumed compile-time errors.
- [ ] An operation may exist without a UI action.
- [ ] `ResourceCapabilities`, `resource.capabilities`, and capability-based controls are absent.
- [ ] Runtime Hono operation objects are ordinary, spreadable, universal wrapper objects, and tests
  document that their enumerable keys are not capability truth.
- [ ] No runtime route discovery, codegen, generated manifest, provider symbol, or new contract layer
  exists.
- [ ] Manual/backend-neutral operation definitions remain supported and tested.
- [ ] Root framework imports/exports no Hono integration; `/hono` is explicit and optional.
- [ ] Framework and SDK tests, type-checks, and builds pass.
- [ ] `graphify update .` exits 0.
- [ ] Plan 037 status is `DONE`.

## STOP conditions

Stop and report if:

- `typeof rpc.<resource>` does not retain literal conventional route branches before reaching the
  helper;
- an exact mapped operation/request/response type becomes `any`, `unknown`, or a broad record for
  the typed fixture;
- preserving exact keys requires caller-supplied record/create/update generics;
- object spread widens the non-overridden Hono operation keys;
- exact action validation cannot coexist with a narrow manual-backend operation object without
  introducing backend vocabulary into core;
- narrowing resource surfaces requires changing native Table/Detail/Form prop contracts rather than
  only resource composition/view typing;
- supporting the subpath requires Hono in root runtime dependencies or exports;
- Sprindle/API changes, route metadata, OpenAPI discovery, code generation, generated artifacts, or
  a hidden provider protocol appear necessary;
- a focused gate fails twice after one reasonable correction;
- any required implementation file falls outside Scope.

Report the exact inferred type, smallest failing type proof, and conflicting API surface. Do not
restore runtime capabilities, endpoint selection, broad casts, or handwritten transport mirrors to
make the build green.

## Maintenance notes

Reviewers must distinguish typed keys from physical JavaScript keys. Reject code that enumerates a
Hono-derived operation object, casts it to a broad `ResourceOperations`, or uses `any` to recover an
operation that the route type omits. Hono upgrades must rerun status-specific response proofs and
the runtime-universal proxy fixture.

Future backend integrations should either return narrow backend-neutral operation objects or live
under their own explicit subpath. They must not reintroduce a root capability registry. Runtime
capability discovery is a different feature with async/versioning semantics and requires a separate
maintainer decision.
