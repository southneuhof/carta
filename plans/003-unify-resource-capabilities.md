# Plan 003: Unify resource behavior and access metadata under capabilities

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` after the implementation and review pass.
>
> **Drift check (run first)**:
> `git diff --stat af08462..HEAD -- packages/is-vue-framework apps/web/src docs`
> Also inspect `git status --short`: this plan was written while the working
> tree already contained the completed terminology-pass edits listed in
> `plans/README.md`. Preserve those edits; do not reset or overwrite them.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: 001-honest-resource-terminology-pass.md, 002-contract-and-docs-reconciliation.md
- **Category**: migration
- **Planned at**: commit `af08462`, 2026-07-28

## Why this matters

Every standard CRUD resource currently declares two parallel maps with the same
keys: `operations` contains executable data functions while `actions` contains
permission and navigation metadata. The type system relates the maps, but the
reader must remember that an action does not call its operation and that
programmatic operations may have no action. This plan makes one neutral
`capabilities` map the source of truth: each capability has one `handler`,
permission metadata, optional visibility, and an optional route target. A
capability such as `verify` can therefore sit beside `list` and `delete`
without inventing another vocabulary, while non-resource workflows can remain
ordinary functions.

## Current state

### Framework contracts and construction

- `packages/is-vue-framework/src/resources/defineResource.ts` defines
  `ResourceOperations` with only `list`, `detail`, `create`, `update`, and
  `delete` handlers (lines 59–78).
- The same file defines `ResourceActionDefinition` with `permission`, optional
  `to`, and optional `visible` (lines 152–168); `ResourceDefinition` accepts
  separate `operations` and `actions` (around lines 224–234).
- `defineResource()` stores the operation object, normalizes action declarations,
  registers routed actions, and wires operations into table/detail/form/delete
  surfaces (around lines 393–531).
- `normalizeActions()` currently registers only route-targeted actions in the
  global route registry (around lines 330–347). The new capability map must keep
  this behavior for capabilities with `to`.
- The completed terminology pass has already renamed the public resource
  deletion method and row/detail navigation names. Do not regress those names.

### Current data adapter boundary

- `packages/is-vue-framework/src/hono/resource.ts` turns typed Hono routes into
  the standard CRUD operation object. It intentionally returns universal
  runtime wrappers while the public TypeScript type keeps only real endpoint
  keys (lines 132–146 and the surrounding `HonoResourceOperations` type).
- Keep this adapter backend/transport-focused. It may continue to export an
  operation-shaped helper internally, but app resource declarations must
  assemble capabilities from its handlers rather than declaring a second
  `actions` map.

### Current UI/router consumers

- `packages/is-vue-framework/src/components/views/FormView.vue` reads
  `resource.actions.detail.to` and `resource.actions.list.to` to choose
  post-submit navigation (lines 120–126) and its resource prop/type contracts
  require `actions` (lines 36–74).
- `apps/web/src/router/guards.ts` looks up a registered route action and checks
  its permission/action key (lines 11–20).
- `apps/web/src/manifest/navigation.ts` consumes `resource.actions.list` for
  entrypoint navigation (lines 6–10 and 17–27).
- `apps/web/src/router/tabs.ts` types tabs as `NavigableResourceAction`.
- App routes and tests use `resource.actions.*` for links, tabs, permissions,
  and assertions. Search all direct consumers before changing the public name.

### Existing application exemplar

`apps/web/src/routes/(authenticated)/settings/roles/roles.resource.ts` currently
declares `operations: roleOperations` and a separate `actions` map (lines
10–25). Its transport functions live in the neighboring
`roles.operations.ts`, which imports the Hono adapter and data normalizer
(lines 1–9). Preserve this file boundary: `*.operations.ts` must not import
Vue/router/components, and `*.resource.ts` must not perform RPC directly.

### Custom workflow evidence

`apps/web/src/routes/(authenticated)/hr/overtimes/[overtimeId]/overtime-workflow.operations.ts`
contains `submitOvertime` and `verifyOvertime` functions (lines 10–15), while
`apps/web/src/routes/(authenticated)/to-do/notifications.operations.ts`
contains `unreadNotificationCount` and `markNotificationsSeen` (lines 15–20).
The new capability type must support adjacent named capabilities, but this plan
does not automatically invent surfaces or routes for arbitrary custom keys.
Routes may invoke a custom capability handler explicitly.

## Target contract

Implement a single declaration source of truth:

```ts
const roles = defineResource({
  key: 'roles',
  fields: roleFields,
  capabilities: {
    list: {
      handler: roleOperations.list,
      permission: 'roles.list',
      to: { name: 'settings-roles' },
    },
    detail: {
      handler: roleOperations.detail,
      permission: 'roles.detail',
      to: { name: 'settings-roles-detail', params: (id) => ({ roleId: id }) },
    },
    update: {
      handler: roleOperations.update,
      permission: 'roles.update',
      to: { name: 'settings-roles-edit', params: (id) => ({ roleId: id }) },
    },
    delete: {
      handler: roleOperations.delete,
      permission: 'roles.delete',
    },
    verify: {
      handler: verifyOvertime,
      permission: 'overtimes.verify',
    },
  },
})
```

Requirements:

- `handler` is the only executable-function field. Do not add separate
  `load`, `run`, or `execute` vocabulary.
- `permission` remains required and accepts `string | null`.
- `visible` remains optional.
- `to` remains optional: targetless capabilities such as `delete` and `verify`
  are valid and are not registered as navigable routes.
- Standard keys retain their current typed surface behavior. A missing
  `create` handler must not expose `resource.form()` for create, and a missing
  `delete` handler must not expose the resource deletion method.
- Custom capability keys are metadata/handler entries available on the resource
  for explicit route workflows; they must not be silently treated as standard
  table/detail/form capabilities.
- The public resource property should be `capabilities`, not a compatibility
  `actions` projection. Update all in-repo consumers in this plan so the two
  vocabularies are genuinely removed from the resource API. Unrelated UI slot
  names such as component `actions` slots are out of scope.
- Keep backend authorization authoritative. Client capability metadata controls
  presentation and route entry only.

## Proven type design

The feasibility proof is
`plans/proofs/003-capability-inference.type-test.ts`. Run it before restarting
implementation:

```sh
pnpm exec tsc --strict --noEmit --skipLibCheck --lib ES2022,DOM \
  plans/proofs/003-capability-inference.type-test.ts
```

Expected result: exit 0 with no diagnostics.

The proof establishes all of the following with TypeScript 5.9 from this
workspace:

- the literal capability map retains standard and custom keys;
- a custom `verify.handler` retains its exact argument union;
- standard handler signatures are checked;
- record/query/create/update/identity types are inferred through the nested
  `.handler`;
- absent standard keys remove the corresponding resource surfaces;
- the implementation can project a typed standard-handler view without
  `any`, runtime enumeration, or per-handler casts.

Use the proof's type decomposition rather than attempting to make a generic
`TCapabilities[key].handler` expression narrow itself at every call site:

```ts
type AnyHandler = (...arguments_: never[]) => unknown

type ResourceCapability<THandler extends AnyHandler = AnyHandler> = {
  handler: THandler
  permission: string | null
  to?: ResourceCapabilityTarget
  visible?: ResourceCapabilityVisibility
}

type StandardCapabilityHandlers<
  TRecord,
  TQuery,
  TCreate,
  TUpdate,
  TIdentity,
> = {
  list: (context: CollectionLoadContext<TQuery>) =>
    MaybePromise<CollectionResult<TRecord>>
  detail: (context: RecordLoadContext<TIdentity>) =>
    MaybePromise<TRecord | undefined>
  create: (input: TCreate) => MaybePromise<TRecord>
  update: (id: TIdentity, input: TUpdate) => MaybePromise<TRecord>
  delete: (id: TIdentity) => MaybePromise<unknown>
}

type ResourceCapabilitiesDefinition<...> =
  Partial<{
    [TKey in keyof StandardCapabilityHandlers<...>]:
      ResourceCapability<StandardCapabilityHandlers<...>[TKey]>
  }>
  & Record<string, ResourceCapability>
```

`(...arguments_: never[]) => unknown` is deliberate: under strict function
variance it is a safe top constraint for preserving arbitrary function
signatures. Do not replace it with `(...arguments_: any[]) => any` or
`(...arguments_: unknown[]) => unknown`.

Inference helpers must unwrap the nested handler before reading its return or
arguments:

```ts
type CapabilityHandlerAt<TCapabilities, TKey extends PropertyKey> =
  TCapabilities extends Record<
    TKey,
    ResourceCapability<infer THandler>
  > ? THandler : never
```

Derive record/query/create/update/identity from
`CapabilityHandlerAt<TCapabilities, 'list' | ...>` using the existing operation
extractor logic as the model. Do not apply the old extractors directly to the
descriptor object.

Inside `defineResource`, call one typed helper equivalent to the proof's
`standardHandlers()`:

```ts
const handlers = standardHandlers<
  TRecord,
  TQuery,
  TCreate,
  TUpdate,
  TIdentity,
  TCapabilities
>(definition.capabilities)
```

The helper returns optional `list/detail/create/update/delete` functions with
their exact canonical signatures. The table/detail/form/delete implementation
uses this view; the returned resource exposes the original literal capability
map so custom handler types remain exact.

### Cast policy

The previous version of this plan said not to use casts anywhere in
`defineResource`; that was too broad. The existing implementation already uses
a localized assertion when returning the conditionally shaped public resource,
and route-target normalization has narrow `RouteLocationRaw` assertions.

Allowed:

- one localized assertion at the final resource-construction boundary to expose
  conditional surface members;
- existing narrow route-target normalization assertions;
- existing identity/field adapter assertions unrelated to capability handlers.

Forbidden:

- casting `definition.capabilities` to `any`, `unknown`, `ResourceOperations`,
  or a broad record to obtain standard handlers;
- casting any `capabilities.<standard>.handler` before invoking it;
- per-handler assertions in table/detail/form/delete wiring;
- `Object.keys`, truthiness of Hono proxies, or runtime enumeration as
  capability truth;
- weakening handler parameters or results to `object`, `unknown`, or `any` to
  make the implementation compile.

If the final resource return needs more than the existing single localized
conditional-surface assertion, stop and compare the implementation against the
proof before continuing.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0; all Vitest tests pass |
| Framework type-check | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0; `vue-tsc` reports no errors |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | exit 0; all web tests pass |
| Web type-check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0; `vue-tsc` reports no errors |
| Full verification | `pnpm type-check && pnpm test` | both commands exit 0 |
| Search for stale public vocabulary | `rg -n "definition\\.operations|operations:|actions:|resource\\.actions|ResourceAction|ResourceOperations" packages/is-vue-framework/src apps/web/src docs/architecture` | no matches except explicitly out-of-scope generic UI slot/action names and Hono adapter implementation/type names documented in the step |

## Scope

**In scope** (modify only as required by the ordered steps):

- `packages/is-vue-framework/src/resources/defineResource.ts`
- `packages/is-vue-framework/src/resources/index.ts`
- `packages/is-vue-framework/src/resources/__tests__/resources.spec.ts`
- `packages/is-vue-framework/src/hono/resource.ts`
- `packages/is-vue-framework/src/hono/index.ts`
- `packages/is-vue-framework/src/hono/__tests__/resource.spec.ts`
- framework resource/view contracts and type tests that directly expose
  `actions`/`ResourceAction*`
- `packages/is-vue-framework/src/components/views/FormView.vue` and its direct
  type/tests
- `apps/web/src/router/guards.ts`, `tabs.ts`, router tests
- `apps/web/src/manifest/contract.ts`, `navigation.ts`, and manifest tests
- every `*.resource.ts`, route component, and resource test under
  `apps/web/src/routes` that directly consumes the resource API
- `docs/architecture/web-application-architecture.md`,
  `docs/architecture/resource-migration-guide.md`,
  `docs/architecture/routing-and-controls-review.md`
- `plans/README.md` status/index metadata

**Out of scope** (do not touch):

- generic component slot names/props named `actions` that are unrelated to
  resource capabilities (for example image preview or confirmation dialog UI)
- the Hono route API shape or server authorization implementation
- non-resource custom workflow functions themselves, except to expose them in a
  resource capability declaration where an existing route already needs that
  metadata
- mobile app code, landing SvelteKit code, or unrelated packages
- a new authorization model, route-generation system, or generic command bus
- compatibility aliases after the in-repo migration; do not leave both
  `resource.actions` and `resource.capabilities` as long-term public APIs

## Git workflow

- Branch: follow the repository's existing `codex/` branch convention if a
  branch is created.
- Do not reset, commit, push, or open a PR unless separately instructed.
- Preserve the pre-existing dirty worktree edits identified by the drift check.

## Steps

### Step 1: Add capability types and characterize standard handler contracts

First run the proof command from "Proven type design." In `defineResource.ts`,
implement that proven decomposition: `AnyHandler`, the generic capability
descriptor, the mapped standard handler/capability types, nested-handler
extractors, and literal standard-key surface projection. Allow additional
string keys with an exact handler, permission, optional visibility, and optional
route target.

Preserve exact record/query/create/update/identity inference by unwrapping each
standard capability's `.handler`; do not expect the existing operation
extractors to understand the descriptor automatically. `ResourceRecordOf` and
the other transport extractors may remain available for `*.operations.ts` and
Hono callers, but `defineResource` inference must use capability-aware
extractors. Replace `ResourceAction*` public types with capability-named
equivalents, retaining route-target and navigable capability types where needed
by router/navigation consumers.

Before changing runtime behavior, update framework resource type tests to prove:

- list/detail/create/update/delete capabilities accept the correctly typed
  handlers;
- a targetless delete/verify capability is valid;
- a capability without a standard handler does not create the corresponding
  resource surface;
- a custom `verify` capability is accessible but does not create `table`,
  `detail`, `form`, or delete behavior.

**Verify**:

- `pnpm exec tsc --strict --noEmit --skipLibCheck --lib ES2022,DOM plans/proofs/003-capability-inference.type-test.ts` → exit 0;
- `pnpm --filter @southneuhof/is-vue-framework type-check` → exit 0; the type
  tests reject the existing invalid-capability cases with the expected
  `@ts-expect-error` annotations.

### Step 2: Make `defineResource()` construct all behavior from capabilities

Refactor `defineResource()` so `definition.capabilities` is the only input
map. Normalize capability metadata and register route targets exactly once,
preserving HMR duplicate handling and targetless behavior. Wire standard
`capabilities.<key>.handler` functions into the existing table/detail/form/
delete surfaces and access-filtered row-action derivation. Expose the
capability map on the returned resource and update the resource base/types to
use it.

Create the single typed `standardHandlers()` projection described in "Proven
type design" and use its result throughout table/detail/form/delete wiring.
Do not repeatedly index the unconstrained literal map and try to narrow each
handler locally.

Do not infer capability presence with `Object.keys`, runtime truthiness of Hono
proxies, `any`, broad/per-handler casts, or runtime enumeration. Continue
deriving standard capability keys from the literal type, as the current Hono
integration does. The one existing-style final resource-shape assertion is
permitted under the cast policy above.

Update `resources.spec.ts` to cover route registration, targetless delete,
custom capability storage, HMR conflicts, row-action permission/visibility
filtering, table loading, form submission, and deletion invalidation.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework test` → exit 0; all
resource tests pass, including the new targetless/custom-capability cases.

### Step 3: Update framework views, router, and navigation consumers

Replace direct resource action reads with capability reads in:

- `FormView.vue` and its resource prop/type contracts;
- `ListView`/resource surface contracts only where they refer to resource
  capability metadata;
- router guard registry lookup and registered metadata;
- route tab types and navigation contracts/manifest helpers.

Keep ordinary UI slot names such as `row-actions` unchanged. Route guards must
still look up a named route capability, check its permission through the access
adapter, and fall back to extraordinary route metadata. Navigation must still
filter entries by permission and ignore targetless capabilities.

Update framework view/router tests and type fixtures rather than weakening
their assertions.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework test && pnpm --filter @southneuhof/framework-web test` → both exit 0.

### Step 4: Migrate every web resource declaration and direct consumer

For each resource under `apps/web/src/routes`, replace the paired
`operations`/`actions` declarations with one `capabilities` map. Wire the
existing standard operation functions into `handler` fields without moving RPC
code into resource files. Preserve route names, permissions, identity
parameter builders, field definitions, schemas, and existing route-owned
workflow behavior.

Update route components, navigation, tabs, and resource/router tests from
`resource.actions.*` to `resource.capabilities.*`. Where a future adjacent
capability is useful, use an existing workflow handler (for example
`verifyOvertime`) only if the route already owns that workflow; do not create
new product behavior as part of this migration.

**Verify**:

- `rg -n "resource\\.actions|\\.actions\\.(list|detail|create|update|delete)|actions:\\s*\\{" apps/web/src/routes apps/web/src/router apps/web/src/manifest` → no resource-API matches;
- `pnpm --filter @southneuhof/framework-web type-check` → exit 0;
- `pnpm --filter @southneuhof/framework-web test` → exit 0.

### Step 5: Reconcile public exports and architecture documentation

Update package exports, comments, type-test names, and architecture/migration
docs so the canonical vocabulary is `capabilities`, `handler`, `permission`,
`visible`, and optional `to`. Explain that `to` means “navigable target,” not
“required for a capability”; explicitly document targetless `delete` and custom
commands such as `verify`. Remove the old resource-specific `actions`/`
operations` split from active examples.

Do not rewrite unrelated generic UI `actions` terminology or historical plan
records that accurately describe completed work; update the plan index to mark
this plan only after implementation and review.

**Verify**:

- `rg -n "resource\\.actions|actions:\\s*\\{|operations:\\s*|ResourceAction|ResourceOperations" packages/is-vue-framework/src apps/web/src docs/architecture` → no stale resource API references, except the explicitly retained Hono adapter implementation names if the chosen implementation keeps them internal;
- `pnpm type-check` → exit 0;
- `pnpm test` → exit 0;
- `git status --short` → only the in-scope implementation/docs files and pre-existing worktree changes are present.

## Test plan

Follow the existing patterns in:

- `packages/is-vue-framework/src/resources/__tests__/resources.spec.ts` for
  resource construction, route registration, permission filtering, surface
  wiring, and invalidation;
- `packages/is-vue-framework/src/hono/__tests__/resource.spec.ts` for typed
  Hono operation adapter behavior;
- `packages/is-vue-framework/src/hono/__type-tests__/resource.type-test.ts`
  and framework view type tests for compile-time capability exactness;
- `apps/web/src/router/__tests__/guards.spec.ts`,
  `apps/web/src/router/__tests__/navigation.spec.ts`, and resource specs for
  direct-entry authorization and application declarations.

Add or update tests for:

- one standard capability with a route target;
- one targetless standard capability (`delete`);
- one targetless custom capability (`verify`) with a callable handler;
- absence of a standard handler removing the corresponding typed surface;
- route registry registration/conflict/reset behavior;
- navigation and direct-entry permission checks;
- row-action filtering by permission and visibility;
- form default navigation using capability targets;
- Hono-derived handler types remaining exact.

## Done criteria

- [ ] `defineResource()` accepts one `capabilities` map and no longer accepts
  separate resource `operations` and `actions` maps.
- [ ] The compile-only feasibility proof exits 0 with TypeScript 5.9.
- [ ] Every capability uses one executable property named `handler`; no
  resource capability API introduces `run`, `load`, or `execute`.
- [ ] `to` is optional and targetless delete/custom capabilities are tested.
- [ ] Standard table/detail/form/delete surfaces preserve their existing
  runtime and compile-time behavior.
- [ ] Custom capabilities are typed and accessible without accidentally
  creating standard surfaces or routes.
- [ ] Standard handlers are invoked through one typed projection with no
  `any`, broad capability-map cast, or per-handler assertions.
- [ ] The only capability-refactor assertion is the localized final
  conditional resource-shape boundary; existing route/identity/field assertions
  are not counted.
- [ ] No in-repo resource consumer uses `resource.actions`.
- [ ] `pnpm type-check` exits 0.
- [ ] `pnpm test` exits 0.
- [ ] Focused framework and web tests cover the new capability model.
- [ ] `plans/README.md` status row is updated to `DONE` after implementation
  and review.

## STOP conditions

Stop and report instead of improvising if:

- the live code no longer matches the current-state excerpts or the prior
  terminology plans have not actually been applied;
- a required consumer depends on `resource.actions` from outside the listed
  in-repo scope;
- the compile-only feasibility proof does not pass before implementation starts;
- the implementation cannot match the proof's nested-handler extraction and
  typed standard-handler projection;
- invoking a standard handler requires `any`, a broad capability-map cast, or a
  per-handler assertion after using the proven projection;
- the final resource shape requires multiple new assertions rather than the
  one localized conditional-surface boundary allowed above;
- custom capabilities require a new global command-dispatch or authorization
  system rather than exposing existing route-owned handlers;
- preserving existing Hono exact-key behavior would require changing the Hono
  route API or relying on runtime proxy reflection;
- focused verification fails twice after a reasonable correction;
- implementation requires touching mobile, landing, server authorization, or
  unrelated generic UI `actions` APIs.

## Maintenance notes

Reviewers should verify that `capabilities` is genuinely the source of truth:
there must not be a second hidden action map that can drift from handlers.
They should also check that route registration occurs only for capabilities
with `to`, that permission checks remain client-side presentation/entry
policy rather than server authorization, and that standard capability typing
still removes absent CRUD surfaces.

Future custom capabilities should be added next to the route-owned resource
only when they have a meaningful UI permission/visibility policy. Pure helper
functions that are not capabilities should remain ordinary exports in
`*.operations.ts` or workflow modules. A later plan may add a convenience
access-check helper for custom capabilities, but this migration must not
invent one.
