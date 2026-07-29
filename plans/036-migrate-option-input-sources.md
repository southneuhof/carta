# Plan 036: Migrate Select, RadioGroup, and CheckboxGroup to explicit option sources

> **Implementation instructions:** Add shared contracts/composable first, then
> migrate all three consumers and web callers. Preserve existing selection
> semantics. Do not route reads through `FrameworkRuntime`.
>
> **Drift check (run first):**
> `git diff --stat 7700799..HEAD -- packages/is-vue-framework/src/contracts packages/is-vue-framework/src/query packages/is-vue-framework/src/components/inputs/SelectInput.vue packages/is-vue-framework/src/components/inputs/RadioGroupInput.vue packages/is-vue-framework/src/components/inputs/CheckboxGroupInput.vue apps/web/src/framework/adapters apps/web/src/routes`

## Status

- **Priority:** P1
- **Effort:** L
- **Risk:** MED
- **Depends on:** 035
- **Category:** migration
- **Planned at:** commit `7700799`, 2026-07-29

## Why this matters

Three option inputs currently accept endpoint strings, call runtime adapters,
and each implements async state differently. Explicit `data XOR load` makes
components backend-neutral while shared `useLoader` behavior supplies cache,
dedupe, cancellation, retry, and normalized errors. Preserving value semantics
avoids mixing API cleanup with form-data migration.

## Target public contract

Use generic records; exact names may follow existing contract conventions:

```ts
export interface OptionLoadContext extends LoadSignalContext {
  searchParameters: Record<string, unknown>
}

export type OptionLoad<TOption extends object> =
  Load<OptionLoadContext, readonly TOption[] | CollectionResult<TOption>>
```

Each component exposes:

```ts
data?: readonly TOption[]
load?: OptionLoad<TOption>
searchParameters?: Record<string, unknown>
namespace?: QueryNamespace
```

`data` and `load` are mutually exclusive. Omitted both means valid empty
options, not a runtime-capability error. Normalize array and
`CollectionResult.data` at one internal boundary. Do not expose TanStack Query
or query keys publicly.

## Current state

- `contracts/load.ts:12-23` already defines `LoadSignalContext`,
  `CollectionLoadContext`, and `searchParameters`.
- `query/loader.ts:36-83` already enforces `data XOR load`, injects
  `AbortSignal`, normalizes errors, and returns `{data,error,loading,refresh}`.
- `SelectInput.vue:18-36,81-82,168-190` uses default `data: []`, `getAPI`,
  `getData`, `useFrameworkRuntime()`, and manual `preflight`.
- `RadioGroupInput.vue:10-46,52-65` repeats endpoint/runtime/manual loading.
- `CheckboxGroupInput.vue:7-44` does the same through
  `runtime.checkboxGroup`.
- `SelectInput.vue:94-247` contains value behavior to preserve:
  multi initialization, `asWhole`, `defaultToFirst`, transforms, clear,
  search, `onSelect`, and `validation:touch`.
- `query/__tests__/loader.spec.ts:16-160` is loader-test exemplar, including
  dedupe, key changes, cancellation, normalization, external data, and XOR.

Current anti-pattern:

```ts
// SelectInput.vue:81-82
const runtime = useFrameworkRuntime()
const getData = props.getData ?? ((getAPI, searchParameters) =>
  defaultSelectGetData(getAPI, searchParameters, runtime.select))
```

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Focused tests | `pnpm --filter @southneuhof/is-vue-framework test -- src/components/inputs/__tests__/option-source.spec.ts src/query/__tests__/loader.spec.ts` | all pass |
| Framework typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | all pass |
| Legacy audit | `rg -n "getAPI|getData|useFrameworkRuntime|defaultSelectGetData" packages/is-vue-framework/src/components/inputs/{SelectInput,RadioGroupInput,CheckboxGroupInput}.vue` | no matches |

## Scope

**In scope**

- `packages/is-vue-framework/src/contracts/load.ts`
- `packages/is-vue-framework/src/contracts/index.ts`
- New internal helper under `packages/is-vue-framework/src/components/inputs/`
  such as `useOptionSource.ts`.
- `SelectInput.vue`, `RadioGroupInput.vue`, `CheckboxGroupInput.vue`
- New tests under `packages/is-vue-framework/src/components/inputs/__tests__/`
- `packages/is-vue-framework/src/runtimeDefaults.ts` only to remove option-only
  helpers after all callers are migrated.
- Web option adapter modules and resource/catalog callers discovered by exact
  `rg` searches.
- Relevant renderer/type/public API tests.

**Out of scope**

- Lookup, location, uploads, File Manager.
- Select model-value redesign or new option schema DSL.
- Remote search UI redesign. Existing local `query` filtering stays unless a
  component already sends search through `searchParameters`.
- Removing option capability types from `runtime.ts`; final cleanup is plan 042.
- Broad removal of `getAPI` from legacy table/detail/model config.

## Git workflow

- Branch: `codex/036-option-input-sources`
- Suggested commits:
  1. `feat(framework): add explicit option sources`
  2. `refactor(web): wire option loaders`
- Do not push/open PR without instruction.

## Steps

### Step 1: Add option source contract and helper

Add typed context/load aliases. Implement `useOptionSource` around `useLoader`.
Give each component instance isolated default cache ownership; honor an explicit
namespace when caller wants stable/shared identity. Cache key must include
reactive `searchParameters`. Normalize `readonly T[]` and
`CollectionResult<T>` without mutating caller data.

Use `ownerOf`/stable key helpers from core/query where suitable; if importing a
core-private helper would create wrong layering, add a small query-level
owner/key helper instead. Do not copy TanStack Query setup into inputs.

**Verify:** focused helper tests prove:

- static data skips load;
- supplying both throws;
- search-parameter change reloads and aborts prior signal;
- shared namespace dedupes equal calls;
- separate instances without namespace do not collide;
- errors are normalized.

### Step 2: Characterize Select behavior before replacing reads

Add component tests for scalar selection, `asWhole`, multi selection,
`transform`, `defaultToFirst`, clear, searchable filtering, external
model update, `onSelect`, and `validation:touch`. Record current null/empty-array
behavior exactly; do not “clean it up.”

**Verify:** new Select characterization cases pass against either old or
partially migrated implementation before proceeding.

### Step 3: Migrate SelectInput

Replace `getAPI`/`getData`/runtime props with explicit source props. Derive
options, loading, and error from helper. Re-run selection reconciliation when
loaded options or external model changes. Ensure `defaultToFirst` runs only when
no existing value and does not overwrite a value while a load is pending.

Render deterministic loading, error, and empty states inside current popover.
Expose retry through existing UI only if a suitable button pattern exists;
otherwise make reload available to tests/internal API without expanding public
component surface.

**Verify:** focused option tests and typecheck pass.

### Step 4: Migrate RadioGroupInput and CheckboxGroupInput

Use same helper and source props. Preserve `defaultValue`, `pick`, `view`,
variant/direction, checkbox array semantics, and validation touch emission.
Ensure rejected loads clear no valid existing model value. Render the same
loading/error/empty vocabulary used by Select.

**Verify:** tests cover static/loaded options, reactive parameters, default
value, selection, loading, empty, error, and cancellation for both controls.

### Step 5: Convert web callers to operation closures

Replace endpoint-string props with closures owned by app/resource operation
modules. Web service adapters may still know endpoint strings internally, but
the component receives only:

```ts
load: ({ searchParameters, signal }) =>
  loadOptionsForResource(searchParameters, { signal })
```

Thread `signal` into service requests where supported. If current service layer
cannot accept `AbortSignal`, extend its existing request options rather than
dropping signal silently. Update input catalog with local synchronous or async
load fixtures.

Delete `defaultSelectGetData` only when `rg` shows no caller. Leave runtime type
members until plan 042 to keep migration slices compilable.

**Verify:** framework and web full tests/typechecks pass.

## Test plan

- New `option-source.spec.ts`: helper behavior and three mounted components.
- Use query harness in `query/__tests__/harness.ts` for plugin/query client.
- Use fake deferred promises, never real network/timers.
- Assert old-model compatibility, not only rendered labels.
- Web resource tests assert field props contain loader functions and no
  component-facing endpoint string.

## Done criteria

- [ ] Three inputs expose `data XOR load`.
- [ ] Reactive parameters and `AbortSignal` work.
- [ ] No three component files import runtime/default endpoint adapters.
- [ ] Select legacy value behavior remains covered and passing.
- [ ] Loading/error/empty states covered.
- [ ] Web callers pass closures.
- [ ] Package and web gates pass.
- [ ] Only in-scope files changed.

## STOP conditions

- Preserving behavior requires changing core Form value contracts.
- Service cancellation requires a cross-workspace HTTP rewrite beyond app
  service request options.
- `data` defaulting makes Vue unable to distinguish omitted data from `[]`;
  stop and change prop declaration deliberately rather than weakening XOR.
- Existing model semantics are ambiguous and characterization tests disagree
  with production fixtures.

## Maintenance notes

Review query-key ownership closely. Unnamed inputs need per-instance isolation;
named inputs may share cache only through explicit namespace. Future option
pagination should use a separate contract rather than silently interpreting
collection metadata in these simple controls.

