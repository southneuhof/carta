# Plan 050: Make resource list handlers directly reusable as option loaders

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan in
> `plans/README.md` after the implementation and review pass.
>
> **Drift check (run first)**:
> `git diff --stat 39dc197..HEAD -- packages/is-vue-framework/src/contracts/load.ts packages/is-vue-framework/src/components/inputs/useOptionSource.ts packages/is-vue-framework/src/components/inputs/__tests__/option-source.spec.ts packages/is-vue-framework/src/hono/resource.ts packages/is-vue-framework/src/hono/__tests__/resource.spec.ts docs/architecture/input-data-migration.md`
>
> This plan was written while the worktree contained unrelated in-progress
> framework migration changes. Also run `git status --short` and compare the
> "Current state" excerpts against the live files. Preserve existing work. If
> an excerpt's behavior has changed, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: migration
- **Planned at**: commit `39dc197`, 2026-07-29

## Why this matters

CRUD resources expose canonical `list` and `detail` capability handlers, but
simple option inputs currently use a narrower loader context that omits
`query`. This prevents assigning
`resource.capabilities.list.handler` directly to Select, RadioGroup, and
CheckboxGroup even though all four collection consumers use the same query
runtime. Aligning the option contract with `CollectionLoadContext` removes that
artificial incompatibility while retaining the honest `data XOR load` input
API. The same pass must preserve `AbortSignal` through the Hono operation
adapter; otherwise direct capability reuse advertises cancellation but silently
drops it at the transport boundary.

## Current state

- `packages/is-vue-framework/src/contracts/load.ts:19-24` defines a special
  option context without a collection query:

  ```ts
  export interface OptionLoadContext extends LoadSignalContext {
    searchParameters: Record<string, unknown>
  }

  export type OptionLoad<TOption extends object> =
    Load<OptionLoadContext, readonly TOption[] | CollectionResult<TOption>>
  ```

- `packages/is-vue-framework/src/components/inputs/useOptionSource.ts:19-25`
  constructs only `{ searchParameters }`, whereas resource list handlers require
  `{ query, searchParameters, signal }`.
- `packages/is-vue-framework/src/components/composites/form-inputs/LookupInput.vue:30-32`
  already exposes the correct low-level contracts:

  ```ts
  load: Function as PropType<Load<CollectionLoadContext, CollectionResult<RecordData>>>,
  loadDetail: Function as PropType<Load<RecordLoadContext, RecordResult<RecordData>>>,
  ```

  Do not replace these props with `source`, `operations`, a registry key, or a
  network-bridge abstraction.

- `packages/is-vue-framework/src/resources/defineResource.ts:152-160` derives
  resource behavior directly from capability handlers:

  ```ts
  return {
    list: capabilities.list?.handler,
    detail: capabilities.detail?.handler,
    create: capabilities.create?.handler,
    update: capabilities.update?.handler,
    delete: capabilities.delete?.handler,
  }
  ```

  Input configuration should be able to reuse the same handlers without
  wrapper factories.

- `packages/is-vue-framework/src/hono/resource.ts:135-140` destructures no
  `signal` and invokes `$get` without Hono's second request-options argument.
  Hono client methods accept `(args, options?)`; cancellation belongs in
  `{ init: { signal } }`.
- `packages/is-vue-framework/src/components/inputs/__tests__/option-source.spec.ts`
  currently covers the removed runtime boundary and CheckboxGroup value
  behavior, but does not assert the option loader context.
- `packages/is-vue-framework/src/hono/__tests__/resource.spec.ts:40-61`
  establishes the operation-adapter test pattern using an `hc()` client and a
  mocked fetch implementation. Extend this test rather than introducing a real
  server.
- `docs/architecture/input-data-migration.md:15-31` documents wrapper closures
  and the old two-property option context. It must show direct capability
  handlers and the standard collection context after this change.

Repository conventions:

- Core components remain resource-agnostic. They receive backend-neutral
  `data`, `load`, and `loadDetail` props; application field declarations choose
  where those functions come from.
- `data` and `load` remain mutually exclusive. Do not change controlled
  `v-model`, selection, caching, error, or retry behavior.
- Tests use Vitest and jsdom; cancellation tests use `AbortController`, not
  sleeps or real network requests.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused option tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/inputs/__tests__/option-source.spec.ts --environment jsdom` | all selected tests pass |
| Focused Hono tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/hono/__tests__/resource.spec.ts --environment jsdom` | all selected tests pass |
| Framework typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0, no errors |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | all tests pass |
| Diff hygiene | `git diff --check` | no output |

## Scope

**In scope**:

- `packages/is-vue-framework/src/contracts/load.ts`
- `packages/is-vue-framework/src/components/inputs/useOptionSource.ts`
- `packages/is-vue-framework/src/components/inputs/__tests__/option-source.spec.ts`
- `packages/is-vue-framework/src/hono/resource.ts`
- `packages/is-vue-framework/src/hono/__tests__/resource.spec.ts`
- `docs/architecture/input-data-migration.md`
- `plans/README.md` status only

**Out of scope**:

- Renaming or removing `data`, `load`, or `loadDetail`.
- Adding `source`, `operations`, endpoint strings, injection registries, or a
  network bridge to input props.
- Changing Lookup selection, hydration, search, pagination, or model semantics.
- Changing resource capability permission or navigation behavior.
- Migrating application callers; that is Plan 051.
- Upload, Location, File Manager, and mutation-operation contracts.

## Git workflow

- Branch: `codex/050-resource-input-loaders`
- Commit: `refactor(framework): reuse resource input loaders`
- Do not push or open a PR unless explicitly requested.

## Steps

### Step 1: Make the option loader a standard collection loader

In `packages/is-vue-framework/src/contracts/load.ts`, retain the exported
`OptionLoadContext` name for the input-specific result vocabulary, but make its
shape include an empty collection query. A suitable target is:

```ts
export interface OptionLoadContext
  extends CollectionLoadContext<Record<string, never>> {}
```

Reorder declarations if needed for readability. Keep `OptionLoad` able to
return either a readonly array or `CollectionResult<TOption>` so bespoke and
resource-backed option loaders both remain valid.

In `useOptionSource.ts`, construct:

```ts
{
  query: {},
  searchParameters: toValue(searchParameters),
}
```

Do not put local search text, pagination, or component state into `query`.
Simple option controls have no collection controls; `{}` is the truthful query.
TanStack Query continues to inject `signal` through `useLoader`.

Add a focused behavioral test that mounts one option input with `load` and
asserts the loader receives:

- `query: {}`;
- the exact reactive `searchParameters`;
- an `AbortSignal`.

Retain the existing namespace/isolation behavior and tests.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/inputs/__tests__/option-source.spec.ts --environment jsdom`
→ all selected tests pass.

### Step 2: Prove a resource list capability is assignable without an adapter

Extend framework test coverage with a compile-checked fixture built from
`defineResource` whose `list.handler` accepts `CollectionLoadContext` and
returns `CollectionResult`. Pass
`resource.capabilities.list.handler` directly as an option input's `load`
prop—no arrow function, cast, or helper.

The test should establish the intended public shape:

```ts
load: resource.capabilities.list.handler
```

Do not couple option components themselves to `Resource` or import resource
runtime APIs from component source. This is structural function compatibility
at the application configuration boundary.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework type-check`
→ exit 0 with no parameter-compatibility error.

### Step 3: Forward cancellation through Hono list and detail operations

Update `createHonoResourceOperations()` so `list` and `detail` accept the
existing context `signal` and pass it to the generated Hono method as the second
argument:

```ts
source.list.$get(
  { query: wireQuery(...) },
  { init: { signal } },
)
```

Apply the same pattern to `detail`. Do not change create/update/delete
signatures in this plan because their canonical resource operations do not
currently accept a signal.

Extend `src/hono/__tests__/resource.spec.ts` with list and detail assertions
using one `AbortController`. Verify the mocked fetch receives the same signal.
Also verify aborting the controller is observable through `signal.aborted`.
Do not use timers or a live fetch.

Preserve query serialization, composite identity serialization, response
normalization, exact compile-time operation keys, and override-friendly object
spread.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework exec vitest run src/hono/__tests__/resource.spec.ts --environment jsdom`
→ all selected tests pass, including list/detail signal forwarding.

### Step 4: Document direct capability reuse

Update `docs/architecture/input-data-migration.md`:

- document option loader context as `{ query: {}, searchParameters, signal }`;
- show `load: roles.capabilities.list.handler` as the preferred
  resource-backed option configuration;
- retain a bespoke closure example only as an escape hatch;
- show Lookup using
  `load: roles.capabilities.list.handler` and
  `loadDetail: roles.capabilities.detail.handler`;
- state explicitly that `load` and `loadDetail` describe the component's real
  collection and hydration behavior and are not compatibility aliases.

Do not introduce a bridge/source/operations prop in the documentation.

**Verify**:
`rg -n "capabilities\\.(list|detail)\\.handler|query: \\{\\}" docs/architecture/input-data-migration.md`
→ matches both option and Lookup examples.

### Step 5: Run convergence gates

Run the focused tests first, then framework typecheck and the full framework
suite. If the full suite fails only in files already dirty before this plan,
record the exact baseline and stop before marking the plan DONE; do not weaken
tests or expand scope.

Run `git diff --check` and inspect `git status --short`. Only the in-scope files
and pre-existing user changes may appear.

**Verify**:

- `pnpm --filter @southneuhof/is-vue-framework type-check` → exit 0.
- `pnpm --filter @southneuhof/is-vue-framework test` → all tests pass.
- `git diff --check` → no output.

## Test plan

- `components/inputs/__tests__/option-source.spec.ts`:
  - option loader receives `query: {}`;
  - reactive search parameters are preserved;
  - loader receives an `AbortSignal`;
  - a resource capability list handler is directly assignable without a
    wrapper or cast.
- `hono/__tests__/resource.spec.ts`:
  - list forwards the exact signal;
  - detail forwards the exact signal;
  - existing query, identity, normalization, and override assertions stay
    green.
- Use existing mounted-input and mocked-`hc()` patterns. No snapshots, sleeps,
  or real network.

## Done criteria

- [ ] `OptionLoadContext` includes `query: {}` through the standard collection
      contract.
- [ ] `useOptionSource` supplies `{ query: {}, searchParameters }`.
- [ ] A resource `list.handler` is passed directly to an option input in
      compile-checked test code.
- [ ] Hono list and detail operations forward `AbortSignal`.
- [ ] Lookup still exposes separate `load` and `loadDetail` props unchanged.
- [ ] Documentation prefers direct resource capability handlers.
- [ ] Focused tests, framework typecheck, and framework tests pass.
- [ ] `git diff --check` returns no output.
- [ ] No out-of-scope source files were changed.
- [ ] `plans/README.md` marks Plan 050 DONE after review.

## STOP conditions

Stop and report rather than improvising if:

- Vue prop inference cannot accept the exact capability handler without a cast
  after `OptionLoadContext` gains `query`.
- Making option query `{}` changes query-key ownership, deduplication, or
  cancellation behavior.
- Hono's generated method in the installed version does not accept request
  options as its second argument.
- Signal forwarding requires changing the public create/update/delete
  signatures.
- Existing option behavior tests reveal a model-value regression unrelated to
  the context shape.
- Current in-scope code no longer matches the behavior described above.

## Maintenance notes

- Keep `load` as the reusable low-level collection boundary. Do not later wrap
  capability handlers merely to rename them.
- Option inputs intentionally pass an empty query. If they gain server-driven
  search, sorting, or pagination, introduce those controls explicitly and
  populate the standard collection query rather than creating another context.
- Review cancellation at every future operation adapter. Advertising `signal`
  in the canonical context while dropping it at transport is a contract bug.

