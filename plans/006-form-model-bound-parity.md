# Plan 006: Make Form infer model-bound operation and close relevant parity gaps

> **Implementation instructions**: Follow steps in order. Run every verification
> command. Stop on any STOP condition; do not improvise. Update this plan and
> `plans/README.md` only after implementation and review pass.
>
> **Drift check (run first)**:
> `git diff --stat aaec97a..HEAD -- packages/is-vue-framework/src/components/core/Form.vue packages/is-vue-framework/src/contracts/components.ts packages/is-vue-framework/src/components/core/__tests__/form.spec.ts`
> and
> `git diff --stat -- packages/is-vue-framework/src/components/core/Form.vue packages/is-vue-framework/src/contracts/components.ts packages/is-vue-framework/src/components/core/__tests__/form.spec.ts`.
> Compare live code with excerpts below if either prints changes.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED — draft synchronization can loop or erase edits
- **Execution**: DONE — 2026-07-28
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `aaec97a`, 2026-07-28; working tree already contains unrelated edits in `Table.vue`

## Why this matters

List filters need Form rendering and field behavior without submission. Public
API should infer this from `v-model`, not expose a second mode flag. Existing
Form already replaces most legacy features with cleaner equivalents:
`initialData`/`load`, `submit`, emitted lifecycle events, schemas, and reactive
field behavior. This plan adds model-bound operation plus parity features still
useful in the new architecture: touch validation, first-error focus, and
declared grid spans.

## Current state

- `packages/is-vue-framework/src/contracts/components.ts:54-70` requires
  `submit` and has no model contract.
- `packages/is-vue-framework/src/components/core/Form.vue:45-50` owns one
  reactive draft.
- `Form.vue:81-88` marks fields touched on value changes, but validation runs
  only during `submit()`.
- `Form.vue:123` exposes draft/reset/submit state.
- `Form.vue:136-172` renders fields linearly and does not use resolved
  `field.span`.
- Existing convention: resource factories choose create/update behavior outside
  Form; Form must not gain create/update/static/headless mode props.
- Legacy reference maps as follows:
  - `getInitialData` → `initialData` plus `load`
  - dependency evaluation → `createBehaviorRuntime`
  - `beforeSubmit`/`extraData` → caller-owned `submit` wrapper
  - `onSuccess`/`onError` → `submitted`/`error` events
  - `static + v-model` → inferred model-bound operation added here
  - legacy route/local-storage initial data is intentionally not copied

## Commands

| Purpose | Command | Expected |
|---|---|---|
| Target tests | `pnpm --filter @southneuhof/is-vue-framework test -- src/components/core/__tests__/form.spec.ts` | exit 0 |
| Typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Package tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0 |

## Scope

**In scope**

- `packages/is-vue-framework/src/contracts/components.ts`
- `packages/is-vue-framework/src/components/core/Form.vue`
- `packages/is-vue-framework/src/components/core/__tests__/form.spec.ts`

**Out of scope**

- Resource create/update routing and `FormView`
- Legacy `static`, `formType`, HTTP method, API URL, toast, or route-query props
- Browser persistence for form drafts
- Rebuilding old provide/inject contracts or old input-config model

## Steps

### 1. Define model-bound contract without a public mode flag

Refactor the public contract into a shared base plus a union:

- submit branch: no `modelValue`, required `submit`
- model-bound branch: required `modelValue` property (its value may be
  `undefined` during initialization), optional `submit`

Keep resource factory return types on the submit branch. At Vue runtime both
props are optional so binding presence can be inspected, but exported TypeScript
must still reject a normal Form with neither v-model nor submit. Document:
`v-model` present means model-bound; absent means submit operation.

Inside Form, inspect current component vnode props for both `modelValue` and
`onUpdate:modelValue`. Do not infer from `modelValue !== undefined`, because an
explicitly bound empty model is valid. In development, warn on incomplete
one-way binding. Use internal name `isModelBound`; add no public mode prop.

**Verify**: typecheck exits 0.

### 2. Synchronize model and draft without aliasing or loops

Initialize model-bound draft from a shallow clone of `modelValue`. Emit a new
object after every field write or behavior-driven write; never mutate parent
object in place. Watch parent model replacements and reconcile the draft while
preserving no stale keys. Guard echo updates with structural/reference checks.

Normal submit mode keeps existing precedence: loaded values override initial
values; user edits override both. In model-bound operation, parent model is
source of truth; do not silently merge route or storage data.

Reset in model-bound operation restores the model captured when binding/loading
settles and emits it. `submit()` may still validate and call an optional submit
handler when explicitly exposed/called, but default submit controls are absent.

**Verify**: tests prove parent→Form, Form→parent, undefined initial model, reset,
and no recursive update loop.

### 3. Add relevant validation and layout parity

Handle renderer `validation:touch` and native input blur by marking a field
touched and validating the current visibility-filtered draft. On failed submit,
focus the first visible invalid field; call `scrollIntoView` when available.
Keep hidden fields excluded and their stale issues cleared.

Render fields in a 12-column grid and apply resolved `field.span` with a safe
default of 12 and bounds 1–12. Preserve input slots and renderer context.

**Verify**: tests cover touch error, hidden invalid field exclusion, first-error
focus, and span style/class.

### 4. Preserve submit operation behavior

Keep existing normalized server issues, `submitted`, `error`, `reset`,
`dirty`, loading, disabled handling, and exposed API. In submit operation, a
missing handler is a development error with a clear framework message rather
than a later “not a function” failure.

**Verify**: all existing Form tests remain green.

## Test plan

Add cases to `form.spec.ts`:

- v-model presence inference, including explicitly `undefined` model
- field updates emit cloned complete model
- parent replacement updates inputs and removes stale keys
- model-bound default controls hidden; normal controls unchanged
- incomplete binding warning
- no update echo loop
- touch/blur validation and first invalid focus
- field span rendering
- existing create-like/update-like submission behavior remains unchanged

## Done criteria

- [x] No `mode`, `headless`, `static`, or `controlled` prop added
- [x] Model-bound operation is inferred from actual binding props/listener
- [x] Model-bound Form works with no submit handler
- [x] Normal Form reports missing submit clearly
- [x] Target tests, package typecheck, and package tests exit 0
- [x] No files outside scope changed

## STOP conditions

- Vue test rendering cannot reliably expose whether `v-model` was attached.
- Supporting model binding requires changing renderer registry contracts beyond
  existing `value`, `draft`, and `setValue`.
- `FormView` must change to preserve normal submit behavior.

## Maintenance notes

Future filter UIs should use ordinary `v-model` and never depend on internal
`isModelBound`. Review synchronization carefully for object aliasing and
behavior-derived updates.
