# Plan 057: Add a typed input-props registry and honest source contract

> **Implementation instructions**: Follow this plan in order. Run every
> verification command. If a STOP condition occurs, stop and report; do not
> improvise. Update this plan's row in `plans/README.md` only after implementation
> and review.
>
> **Drift check (run first)**:
> `git diff --stat 2454cf6..HEAD -- packages/is-vue-framework/src/contracts/fields.ts packages/is-vue-framework/src/fields/resolve.ts packages/is-vue-framework/src/renderers packages/is-vue-framework/src/index.ts`
>
> Also run the same command without `2454cf6..HEAD` to expose uncommitted edits.
> A materially different field projection or renderer registry is a STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: architecture / DX
- **Planned at**: commit `2454cf6`, 2026-07-30

## Why this matters

Field `props` currently mixes two different truths:

- native props accepted by the selected framework input; and
- app-domain shorthand that still needs translation, such as a resource object.

Putting a resource into `LookupInput`'s `props` is dishonest: Lookup accepts
`fields`, `load`, and `loadDetail`, not a resource. Repeating those native props
everywhere is honest but wasteful. Add one app-owned registry that translates an
explicit `source` into native props, then shallowly overlays explicit `props`.

The framework must define the resolution mechanism without learning what a web
resource, endpoint, or backend response looks like.

## Locked contract

Authored form field:

```ts
form: {
  renderer: 'lookup',
  source: sections,
  props: { searchParameters: { private: true } },
}
```

Resolution:

```text
registered defaults
  < normalize(source)
  < explicit field props
```

Rules:

- `source` is opaque, app-owned authoring data. It is never sent to a renderer.
- `props` contains only genuine renderer props and acts as an override layer.
- Merge is shallow. Nested objects and arrays replace; they do not deep-merge.
- A normalizer is pure and synchronous. It returns a plain props object and may
  return handler functions, but must not fetch.
- A source with no normalizer is a development error.
- A Promise/thenable or non-object normalizer result is an error.
- No registered adapter plus no source is valid: explicit props pass through.
- Registry resolution never mutates defaults, source, normalized props, or field
  props.

## Current state

- `contracts/fields.ts:88-113` defines renderer selection as only
  `{ renderer, props }`; form projections add behavior/span but no honest source.
- `fields/resolve.ts:23-36, 116-133` uses one `FieldLayer` and shallow-merges
  `props`. `ResolvedSurfaceField` at `:38-57` has no source.
- `renderers/registry.ts:25-67` is the established pattern for a pure registry,
  realm-stable injection key, and throwing `require`.
- `renderers/form.ts:46-79` is the controlled input adapter. Registry-produced
  props must target this boundary's underlying native input props.
- `contracts/__type-tests__/fields.type-test.ts:67-87` locks renderer and behavior
  vocabulary.
- `__tests__/public-api.spec.ts:40-64` explicitly locks supported root exports.

## Public API to implement

Names are part of this plan:

- `InputPropsAdapter<TSource, TProps>`
- `InputPropsResolutionContext`
- `InputPropsOf<TComponent>` — component `$props` minus Form-controlled keys
- `InputPropsRegistry`
- `DefinedInputPropsRegistry<TAdapters>`
- `createInputPropsRegistry(adapters)`
- `emptyInputPropsRegistry()`
- `inputPropsRegistryKey`
- `useInputPropsRegistry()`

`createInputPropsRegistry` returns both:

1. `resolve(renderer, { sourcePresent, source, props, context })`; and
2. a typed `field(renderer, config)` authoring helper returning
   `{ renderer, source?, props? }`.

The helper must preserve literal renderer keys and infer each adapter's source
and props types. When an adapter declares `normalize`, `source` is required by
the helper. For a defaults-only adapter, source is rejected. Raw `defineFields`
configuration remains supported and intentionally less renderer-specific.

`InputPropsOf<TComponent>` must omit at least `modelValue`, update/event listener
props, `value`, `setValue`, `draft`, `field`, `disabled`, `error`, `touched`,
`validating`, and `formValidating`. These remain Form-owned.

## Commands

| Purpose | Command | Expected |
|---|---|---|
| Focused tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/renderers/__tests__/inputProps.spec.ts src/fields/__tests__/resolve.spec.ts src/__tests__/public-api.spec.ts --environment jsdom` | all pass |
| Type contract | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0, including type-tests |
| Package tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass, or exact pre-existing failure recorded |
| Diff check | `git diff --check` | no output |

## Scope

**In scope**:

- `packages/is-vue-framework/src/contracts/fields.ts`
- `packages/is-vue-framework/src/contracts/index.ts`
- `packages/is-vue-framework/src/contracts/__type-tests__/fields.type-test.ts`
- `packages/is-vue-framework/src/fields/resolve.ts`
- `packages/is-vue-framework/src/fields/__tests__/resolve.spec.ts`
- `packages/is-vue-framework/src/renderers/inputProps.ts` (create)
- `packages/is-vue-framework/src/renderers/__tests__/inputProps.spec.ts` (create)
- `packages/is-vue-framework/src/renderers/index.ts`
- `packages/is-vue-framework/src/index.ts`
- `packages/is-vue-framework/src/__tests__/public-api.spec.ts`
- `graphify-out/` generated artifacts
- `plans/README.md`

**Out of scope**:

- Vue plugin installation and Form integration; plan 058 owns them.
- Any built-in app normalizer or upload implementation; plan 059 owns them.
- Changes inside File, Image, Lookup, Select, or Radio inputs.
- Endpoint discovery, network calls, async normalizers, deep merging, or a
  framework resource-to-input convention.
- Typed dynamic behavior presentation. The typed helper covers static authoring;
  runtime validation covers a behavior-selected renderer.

## Steps

### Step 1: Add `source` to form-field resolution

Add `source?: unknown` to `FieldFormProjection`, `FieldLayer`, and
`ResolvedSurfaceField`. Do not add it to table/detail public projections.

Resolve it with normal scalar layer semantics:

- `undefined` inherits;
- `null` clears;
- the highest non-null layer wins;
- it is never merged or cloned.

Carry the winning source through `resolveFields` only when present. Preserve all
existing props merge behavior.

Add runtime and compile-time tests proving form source survives catalog/default/
override resolution, an explicit override wins, null clears, and table/detail
projections reject source.

### Step 2: Implement the pure registry

Create `renderers/inputProps.ts`. Copy adapter declarations into an internal map
so caller mutation cannot change registration. For one resolution:

1. read the adapter for the effective renderer;
2. evaluate/copy defaults;
3. if `sourcePresent`, require `normalize` and call it once;
4. reject a thenable, array, null, or non-object result;
5. return `{ ...defaults, ...normalized, ...explicitProps }`.

Detect source presence explicitly; do not infer it from truthiness. A source may
legitimately be `false`, `0`, or an empty array.

Errors must include renderer and field key where available. Keep this module
backend-neutral and free of query/resource imports.

### Step 3: Add typed authoring and component-prop inference

Make adapter definitions retain `TSource` and `TProps`. The registry's `field`
helper must:

- accept only registered renderer literals;
- require/reject source according to that adapter;
- type `props` as `Partial<InputPropsOf<...>>` or the explicit adapter prop type;
- return the ordinary framework form selection shape, with no wrapper object.

Add type-tests for a Lookup-like adapter and a defaults-only File-like adapter:
valid source/override objects compile; missing source, wrong source, unknown
props, source on defaults-only adapters, and controlled props fail with
`@ts-expect-error`.

Do not duplicate every Vue input prop interface in the registry. If Vue SFC
inference cannot support `InputPropsOf`, retain the explicit `TProps` generic as
the supported fallback and report the inference limitation before broadening
component APIs.

### Step 4: Publish and lock the API

Export the registry contract from `renderers/index.ts` and the package root.
Add the new stable exports to `public-api.spec.ts`. Preserve all removed-export
assertions: this is not restoration of `FrameworkRuntime`,
`FrameworkDefaultsInput`, or `getInputComponentRegistry`.

Use `Symbol.for('is-vue-framework-input-props')` for the injection key, matching
the realm-stable convention in `renderers/registry.ts`.

### Step 5: Verify and maintain the graph

Run focused tests, typecheck, package tests, and `git diff --check`. Then run
`graphify update .`. Inspect `git status --short`; do not overwrite unrelated
dirty work. Mark plan 057 `DONE` only after review.

## Test plan

- Pure registry: defaults only, normalize only, all three layers, shallow nested
  replacement, falsy source, no mutation, no-adapter pass-through.
- Failure cases: missing normalizer, async/thenable result, array/null/scalar
  result; error identifies renderer/field.
- Field resolution: source precedence and clear semantics.
- Types: per-renderer source/prop inference and controlled-prop rejection.
- Public API: all named exports exist; retired runtime exports stay absent.

## Done criteria

- [ ] Form field config has an explicit `source` channel.
- [ ] `props` remains native renderer props.
- [ ] Registry resolves defaults, source, and explicit overrides in locked order.
- [ ] Resolution is synchronous, shallow, non-mutating, and backend-neutral.
- [ ] Typed helper catches source/prop mismatches.
- [ ] Focused tests, package typecheck, tests, and diff check pass.
- [ ] Graphify artifacts are refreshed after source changes.

## STOP conditions

- Adding source requires widening table/detail public projections.
- Correct source-presence detection would require changing existing null-clear
  semantics globally.
- Component prop inference cannot exclude controlled props and the only fix is a
  broad rewrite of input component declarations; report before doing that.
- Registry implementation needs resource, RPC, services, or query imports.
- Existing public exports with the proposed names already have incompatible
  semantics.

## Maintenance notes

- `source` is an authoring seam, not a new component prop.
- Normalizers may return functions, including loaders and upload operations; they
  may not execute those functions.
- Prefer one app registry per installed Vue app. Never add mutable module-global
  registrations.
- Preserve shallow merge semantics. A future deep-merge policy needs a separate
  explicit design because functions, arrays, and request parameter objects have
  different replacement semantics.
