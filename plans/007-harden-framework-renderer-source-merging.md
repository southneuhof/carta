# Plan 007: Harden framework renderer and source merging

> **Implementation instructions**: This plan changes a framework package.
> Execute it only after the user gives explicit approval for changes under
> `packages/is-vue-framework`. Follow this plan in order and update its status
> in `plans/README.md` only after the implementation and review pass.
>
> **Drift check (run first)**: `git diff --stat abb232f..HEAD -- packages/is-vue-framework/src/fields packages/is-vue-framework/src/components/core/Form.vue packages/is-vue-framework/src/renderers/inputProps.ts`
> If the current excerpts do not match, stop and reassess this plan.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: 001
- **Category**: bug
- **Planned at**: commit `abb232f`, 2026-08-10
- **Approval**: BLOCKED — explicit user approval is required before framework changes.

## Why this matters

Field layers currently merge `renderer` and `source` independently. A later
layer can change `radio` to `switch` while an earlier layer source remains.
Input props then fail only when Form evaluates that field. This produces a
blank child page unless the application has an error fallback.

The framework should not create invalid renderer/source combinations during
normal field resolution. This plan makes a renderer change clear inherited
source unless that same layer explicitly provides a source. It keeps explicit
same-layer source overrides and `source: null` clearing behavior intact.

## Current state

- `packages/is-vue-framework/src/fields/resolve.ts` merges field layers. Its
  documented precedence is defaults, schema metadata, field entry, surface,
  then overrides.
- `packages/is-vue-framework/src/validation/zod.ts` infers form renderers from
  Zod type tags.
- `packages/is-vue-framework/src/renderers/inputProps.ts` normalizes a source
  only for renderers with registered adapters.
- `packages/is-vue-framework/src/fields/__tests__/resolve.spec.ts` already
  tests source precedence and explicit `source: null` clearing.
- `packages/is-vue-framework/src/components/core/__tests__/` contains Form
  test harness helpers.

Current independent source merge in `packages/is-vue-framework/src/fields/resolve.ts:120-124`:

```ts
if (layer.source !== undefined) {
  hasSource = layer.source !== null
  source = layer.source
}
```

Current inferred renderer in `packages/is-vue-framework/src/validation/zod.ts:157-163`:

```ts
const layer: FieldLayer = { renderer }
if (!value.isOptional?.()) layer.props = { required: true }
layers[key] = layer
```

The web application Plan 001 is an app-level mitigation. This plan is the
framework-level invariant and can affect every framework consumer.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Field resolver tests | `pnpm --filter @southneuhof/is-vue-framework test -- resolve.spec.ts` | exit 0; all resolver tests pass |
| Form tests | `pnpm --filter @southneuhof/is-vue-framework test -- Form` | exit 0; all focused Form tests pass |
| Framework type check | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0; no type errors |
| Full framework test | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0; all framework tests pass |

## Scope

**In scope**:

- `packages/is-vue-framework/src/fields/resolve.ts`
- `packages/is-vue-framework/src/fields/__tests__/resolve.spec.ts`
- one focused Form test only if resolver tests cannot prove the former crash

**Out of scope**:

- Application field defaults and resource declarations — Plan 001 owns them.
- New renderers, new input adapters, or a generic source adapter.
- Public API renames or backward-compatibility branches.
- Any unrelated framework cleanup.

## Git workflow

- Branch: `codex/007-harden-field-source-merge`
- Commit message: `fix(framework): clear source on renderer change`
- Do not begin until explicit user approval is recorded. Do not push or create
  a pull request unless instructed.

## Steps

### Step 1: Define and test the merge invariant

In `resolve.spec.ts`, add tests for these exact cases:

1. An earlier `radio` renderer with source, followed by a later `switch`
   renderer without source, resolves to `switch` with no source.
2. A later renderer with its own source keeps that source.
3. A later `source: null` still clears source.
4. A layer that changes only props or label keeps the existing source.

Run these tests before changing resolver code; the first case must currently
fail or demonstrate the invalid inherited source.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework test -- resolve.spec.ts` → first case proves the old behavior, then passes after Step 2.

### Step 2: Clear inherited source only on renderer change

Update `mergeFieldLayers` in `resolve.ts`. Track the effective renderer while
processing layers. When a layer sets a non-null renderer that differs from the
current effective renderer and does not explicitly set `source`, clear the
inherited source. Keep explicit source values, null clearing, and unchanged
renderer behavior as Step 1 tests define.

Use the existing merge function. Do not add a second resolver, renderer
classification table, or special case for `switch`.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework test -- resolve.spec.ts` → exit 0.

### Step 3: Add one Form regression only if needed

If the resolver tests do not execute input-props resolution, add one Form test
using an inherited radio source and schema-like switch override. Assert Form
renders without an input-props exception. Use the existing core test harness.
Do not mount the whole web application in the framework suite.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework test -- Form` → exit 0.

### Step 4: Run the framework contract checks

Run framework type check and full tests. Review all source merge tests because
field source precedence is a framework contract.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework type-check && pnpm --filter @southneuhof/is-vue-framework test && git diff --check` → all exit 0.

## Test plan

- Renderer change clears inherited source.
- Explicit source with a renderer change wins.
- `source: null` clears source.
- No renderer change keeps source.
- If a Form test is needed, it proves no input-props exception reaches render.

## Done criteria

- [ ] The resolver cannot return an inherited source after an incompatible
  renderer change without an explicit new source.
- [ ] Existing source precedence and null-clear behavior remain covered.
- [ ] Framework type check and full framework tests pass.
- [ ] No application files change in this plan.
- [ ] `plans/README.md` marks Plan 007 as DONE.

## STOP conditions

- User approval for framework changes is absent. Stop before editing package files.
- Existing framework consumers rely on cross-renderer source inheritance.
  Stop and report the consumer and expected contract before changing behavior.
- The invariant requires a renderer compatibility registry. Stop; that is a
  larger API design decision outside this plan.

## Maintenance notes

Review schema-inference changes against this invariant. A field layer should
either define a source for its renderer or inherit the source only when it
keeps the same renderer.
