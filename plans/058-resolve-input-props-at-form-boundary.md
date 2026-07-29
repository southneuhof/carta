# Plan 058: Resolve input props at the plugin and Form boundary

> **Implementation instructions**: Execute only after plan 057 is DONE. Follow
> every step and verification. STOP on contract drift; do not recreate a runtime
> service locator.
>
> **Drift check (run first)**:
> `git diff --stat 2454cf6..HEAD -- packages/is-vue-framework/src/adapters/plugin.ts packages/is-vue-framework/src/fields/defaults.ts packages/is-vue-framework/src/fields/behavior.ts packages/is-vue-framework/src/components/core/Form.vue`
>
> Also inspect uncommitted diffs for those paths. Changed behavior precedence,
> Form renderer ownership, or plugin injection is a STOP.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: 057
- **Category**: architecture / migration
- **Planned at**: commit `2454cf6`, 2026-07-30

## Why this matters

Plan 057 defines honest authored config and a pure registry. This plan connects
it at the only boundary that knows both the effective renderer and the final
field: core `Form`.

Resolution must provide a base, never replace explicit field props. It must also
preserve dynamic behavior:

```ts
source -> { fields, load, loadDetail }
props  -> { searchParameters: { private: true } }
```

The renderer receives all four props. Later behavior props may replace
`searchParameters`; Form-controlled value/error/disabled props still win last.

## Locked precedence

```text
input registry defaults
  < normalized source props
  < explicit static field props
  < behavior.props()
  < behavior.presentation().props
  < Form-controlled props/handlers
```

All merges are shallow. Existing `presentation.props: null` remains an explicit
clear of every renderer prop, including registered defaults. A behavior-selected
renderer re-runs base resolution against that effective renderer.

## Current state

- `adapters/plugin.ts:10-34` accepts adapters/query/renderers/fieldDefaults and
  provides them per app.
- `fields/defaults.ts:5-18` allows `props` on `shared`, `table`, `detail`, and
  `form`, overlapping the new renderer-keyed default registry.
- `fields/behavior.ts:104-128` starts from `field.props`, then shallowly overlays
  `behavior.props` and presentation props. Presentation null clears props.
- `fields/__tests__/behavior.spec.ts:95-120, 272-280` locks shallow behavior
  overlays, dynamic renderer selection, and null clearing.
- `components/core/Form.vue:47-60` resolves fields; `:129` creates behavior
  runtime; `:148-151` selects the effective renderer.
- `Form.vue:307-325` binds behavior props first and controlled Form attrs after
  them. Vue ordering already guarantees Form-owned props win.
- `adapters/__tests__/plugin.spec.ts:12-43` locks canonical plugin options.
- `adapters/__tests__/injection-keys.spec.ts:9-28` locks realm stability and
  per-app isolation.

## Commands

| Purpose | Command | Expected |
|---|---|---|
| Focused framework tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/adapters/__tests__/plugin.spec.ts src/adapters/__tests__/injection-keys.spec.ts src/fields/__tests__/defaults.spec.ts src/fields/__tests__/behavior.spec.ts src/components/core/__tests__/form.spec.ts --environment jsdom` | all pass |
| Typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Package tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass, or exact pre-existing failure recorded |
| Diff check | `git diff --check` | no output |

## Scope

**In scope**:

- `packages/is-vue-framework/src/adapters/plugin.ts`
- `packages/is-vue-framework/src/adapters/__tests__/plugin.spec.ts`
- `packages/is-vue-framework/src/adapters/__tests__/injection-keys.spec.ts`
- `packages/is-vue-framework/src/fields/defaults.ts`
- `packages/is-vue-framework/src/fields/__tests__/defaults.spec.ts`
- `packages/is-vue-framework/src/fields/behavior.ts`
- `packages/is-vue-framework/src/fields/__tests__/behavior.spec.ts`
- `packages/is-vue-framework/src/components/core/Form.vue`
- `packages/is-vue-framework/src/components/core/__tests__/harness.ts`
- `packages/is-vue-framework/src/components/core/__tests__/form.spec.ts`
- `graphify-out/` generated artifacts
- `plans/README.md`

**Out of scope**:

- App/web normalizers and resource migration; plan 059 owns them.
- Input component internals or prop contracts.
- Deep merging, async normalizers, renderer auto-discovery, endpoint templates,
  or network transport in Form.
- Removing keyed `fieldDefaults.fields`; those remain semantic field catalog
  presets.

## Steps

### Step 1: Remove global prop ownership from `fieldDefaults`

Introduce a public surface-default type that excludes `props` and `source`.
Use it for `FrameworkFieldDefaultsInput.shared/table/detail/form`. Retain labels,
renderer selection, formatting, layout, behavior where currently legal, and
keyed `fields`.

The runtime may still pass an empty props object through internal `FieldLayer`
resolution; the public API must reject authored surface-wide props. Keyed
`fieldDefaults.fields.<key>.form.props` and source remain valid because they are
semantic field entries, not uniform renderer policy.

Update tests:

- surface renderer/alignment defaults still resolve;
- `shared/form.props` fail at compile time;
- keyed field props/source remain accepted;
- caller objects remain cloned/isolated.

Replace the existing Form test that uses
`fieldDefaults.form.props: { dense: true }` with a renderer-only default test.

### Step 2: Install one registry per Vue app

Add canonical plugin option:

```ts
inputProps?: InputPropsRegistry
```

Provide it under `inputPropsRegistryKey`; when omitted, provide a fresh empty
registry for that app. Do not use a process-global mutable singleton.

Update plugin and injection-key tests to prove:

- old/default install works with an empty registry;
- a supplied registry is injected unchanged;
- two apps cannot see each other's adapters;
- the key uses `Symbol.for`;
- legacy `runtime`/`defaults` options remain compile-time errors.

Extend the core Form test harness with an `inputProps` install option.

### Step 3: Make behavior runtime accept resolved base props

Add an optional callback to `BehaviorRuntimeOptions`, named
`resolveBaseProps(field, renderer)`. Absence preserves current standalone
behavior by returning `field.props`.

Inside each computed state:

1. evaluate presentation early enough to know its renderer;
2. derive effective renderer: presentation value when defined, otherwise static;
3. call `resolveBaseProps` for a non-null effective renderer;
4. overlay `behavior.props`;
5. clear all props when presentation props is null, otherwise overlay it;
6. preserve existing stable-object reuse through `shallowEqual`.

Do not evaluate behavior functions more than once per computed pass. Preserve
dependency recording, purity checks, derived/reset effects, cycle detection,
and renderer/label/span output.

Extend behavior tests for callback ordering, dynamic renderer re-resolution,
behavior override, presentation override, and presentation null clearing.

### Step 4: Resolve registry props in Form

Inject `useInputPropsRegistry()` beside renderers/defaults. Pass behavior runtime
a base resolver that calls the registry with:

- effective renderer;
- the field's `source` and explicit source-presence flag;
- the field's already-merged static `props`;
- field key/label context.

Do not alter `resolveFields`, resources, or input components here. Do not pass
source through `v-bind`.

Keep the template ordering at `Form.vue:307-325`: resolved/behavior props first,
then `value`, `draft`, `field`, `setValue`, `error`, `touched`, `disabled`,
validation flags, ARIA attrs, and touch handler.

### Step 5: Add integration coverage for the full precedence chain

Mount Form with small synchronous test renderers and a test registry. Prove:

- defaults plus normalized Lookup-like source plus explicit
  `searchParameters` all reach the renderer;
- explicit props override same-name default/normalized props without dropping
  unrelated base props;
- behavior props override static props;
- presentation props override behavior props;
- `presentation.props: null` produces no registry/static props;
- a behavior-selected renderer uses that renderer's adapter;
- source never appears in rendered attrs/props;
- attempted `disabled`, `value`, or error defaults cannot beat Form state.

Keep error tests in plan 057's pure suite; integration tests should focus on
ordering and boundary ownership.

### Step 6: Verify and update graph

Run focused tests, typecheck, package tests, and `git diff --check`; run
`graphify update .`; inspect status for unrelated dirty work. Mark plan 058
`DONE` only after review.

## Done criteria

- [ ] FrameworkPlugin installs a per-app input-props registry.
- [ ] Uniform fieldDefaults can no longer author props/source.
- [ ] Keyed field catalog defaults still support semantic props/source.
- [ ] Form resolves the effective renderer before registry normalization.
- [ ] Explicit and behavior props overlay the base without dropping unrelated
  normalized/default props.
- [ ] Form-owned values/handlers remain authoritative.
- [ ] Dynamic renderer and null-clear behavior remain tested.
- [ ] Focused/package tests, typecheck, diff check, and graph update pass.

## STOP conditions

- Correct ordering requires moving network/resource logic into Form.
- Vue binding order does not keep controlled props authoritative.
- Dynamic renderer behavior cannot resolve without changing behavior evaluation
  count or dependency tracking.
- Narrowing public fieldDefaults requires deleting keyed field catalog defaults.
- Existing callers depend on uniform `fieldDefaults.*.props`; inventory and
  migrate them explicitly before removal.
- Full suite exposes a new failure outside these touched contracts; record it and
  ask before broadening scope.

## Maintenance notes

- Form is the resolver boundary because it knows the final renderer. Inputs stay
  native and app-agnostic.
- Keep registry defaults renderer-keyed; keep semantic labels/accessors and
  field-specific policy in keyed field catalogs.
- `props: null` is a sharp, deliberate behavior escape hatch. Do not silently
  re-add upload/default props after it.
- If a future renderer needs deep merging, give that renderer an app normalizer
  that produces the final nested value; do not change global merge semantics.
