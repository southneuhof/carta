# Plan 047: Remove legacy validation ownership from input components

> **Implementation instructions**: Follow every step and gate. Preserve
> controlled `v-model`; this plan removes old validation coupling, not the
> controlled input API. Update `plans/README.md` only after review.
>
> **Drift check (run first)**:
> `git diff --stat 4169fb0..HEAD -- packages/is-vue-framework/src/components/inputs/BaseInput.vue packages/is-vue-framework/src/components/inputs/commonprops.ts packages/is-vue-framework/src/components/inputs/NumberInput.vue packages/is-vue-framework/src/components/inputs/TextareaInput.vue packages/is-vue-framework/src/components/inputs/PasswordInput.vue packages/is-vue-framework/src/components/inputs/__tests__ packages/is-vue-framework/src/components/core/Form.vue`
>
> Stop if core Form no longer owns label, touched state, and field errors.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/043-characterize-input-migration-contracts.md`
- **Category**: migration
- **Planned at**: commit `4169fb0`, 2026-07-29

## Why this matters

Core Form now owns validation and schemas decide validity, but `BaseInput`
still imports legacy `InputConfig` and reads legacy injection keys.
Number/Textarea/Password also expose validator props that do no work. Removing
dual ownership prevents configuration that silently appears supported while
preserving reusable controlled inputs.

## Current state

- `fields/MIGRATION.md:27-33`: behavior decides presence; schemas decide
  validity.
- `components/core/Form.vue:290-321` owns label, error/touched state, ARIA
  wiring, and `validation:touch`.
- `components/inputs/BaseInput.vue:2-15` imports old validation helpers and
  defines a private legacy form context.
- `BaseInput.vue:46-63` injects `formValidation` and `formInputConfig`, derives
  required/error state from old model config.
- `BaseInput.vue:66-78` directly calls injected touch methods.
- `NumberInput.vue:29-37` declares unused `validator` and `formData`.
- `TextareaInput.vue:12-15` and `PasswordInput.vue:25-28` declare unused
  `validator`.
- Nineteen input controls render through `BaseInput`; standalone direct use
  still needs label/helper/error display and a touch event.

Target ownership:

```text
Core Form: schema validation, touched state, field label/error/ARIA
Input component: controlled value and user interaction
BaseInput: presentational label/helper/error shell; emits validation:touch
```

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/inputs/__tests__ src/components/core/__tests__/form.spec.ts src/renderers/__tests__/registry.spec.ts --environment jsdom` | all pass |
| Package tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass |
| Framework typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Diff check | `git diff --check` | no output |

## Scope

**In scope**:

- `packages/is-vue-framework/src/components/inputs/BaseInput.vue`
- `packages/is-vue-framework/src/components/inputs/commonprops.ts`
- `packages/is-vue-framework/src/components/inputs/NumberInput.vue`
- `packages/is-vue-framework/src/components/inputs/TextareaInput.vue`
- `packages/is-vue-framework/src/components/inputs/PasswordInput.vue`
- `packages/is-vue-framework/src/components/inputs/__tests__/base-input.spec.ts` (create)
- `packages/is-vue-framework/src/components/inputs/__tests__/text-input-surface.spec.ts`
- `packages/is-vue-framework/src/renderers/__tests__/registry.spec.ts`
- Direct app callers only if removing a dead prop causes typecheck failure;
  list each discovered caller before editing it.

**Out of scope**:

- Replacing `modelValue`/`update:modelValue`.
- TagInput's active per-tag acceptance callback.
- Constraint/input filtering behavior.
- Core schema or validation-engine changes.
- Legacy composite Form deletion.

## Git workflow

- Branch: `codex/047-input-validation-ownership`
- Commit: `refactor(framework): remove legacy input validation state`
- Do not push or open a PR unless requested.

## Steps

### Step 1: Characterize BaseInput's public presentation contract

Create mounted tests for:

- explicit label;
- helper message;
- explicit error replacing helper text;
- disabled styling remains control-owned;
- focus leaving the BaseInput container emits `validation:touch` once;
- focus moving within container does not emit;
- no framework injection is required.

Use direct props/events. Do not install legacy composite Form.

**Verify**: focused base test passes against current presentation behavior;
touch expectations may be marked expected-failure until step 2.

### Step 2: Make BaseInput presentation-only

Remove:

- `InputConfig` and `hasRequiredValidation` imports;
- `FormValidationContext`;
- `formValidation` and `formInputConfig` injections;
- legacy required-mark derivation.

Declare `validation:touch` and emit it when focus exits the container. Keep
explicit `label`, `helperMessage`, `enableHelperMessage`, and `error`. If direct
consumers need a required mark, add an explicit Boolean `required` presentation
prop; do not infer it from schema/model config inside BaseInput.

Ensure nested control events do not double-emit. Tests decide whether explicit
child `validation:touch` should be forwarded or focusout alone is canonical.

**Verify**: base tests pass with no injections.

### Step 3: Remove dead validation props

Before editing, run:

```sh
rg -n "validator=|:validator|formData=|:form-data|form-data" \
  apps packages --glob '*.vue' --glob '*.ts'
```

Remove unused `validator`/`formData` props from NumberInput, TextareaInput, and
PasswordInput only when no live caller depends on them. If callers pass them,
determine whether they expect real behavior. Stop rather than silently deleting
a public promise.

Do not remove TagInput's actively executed validator.

**Verify**:

```sh
rg -n "validator|formData" \
  packages/is-vue-framework/src/components/inputs/{NumberInput,TextareaInput,PasswordInput}.vue
```

Expected: no matches.

### Step 4: Verify controlled Form integration

Extend renderer/core tests to prove:

- `modelValue` update still calls core `setValue`;
- blur/focus exit touches field;
- core-provided error remains visible;
- one user interaction produces one touch;
- no `formValidation` or `formInputConfig` provider exists on native core path.

**Verify**: focused tests pass.

### Step 5: Run full gates

Run package/web typechecks, package tests, and diff check. Confirm any app edits
are limited to removal of dead props discovered in step 3.

## Test plan

Follow `ColorInput.spec.ts` createApp cleanup style and
`renderers/__tests__/registry.spec.ts` controlled-renderer assertions. Avoid
snapshots.

## Done criteria

- [ ] `BaseInput.vue` imports no model-config or legacy validation helper.
- [ ] `rg -n "formValidation|formInputConfig" components/inputs` returns no matches.
- [ ] BaseInput emits touch without injected form state.
- [ ] Number/Textarea/Password expose no dead validator/formData props.
- [ ] Controlled `v-model` and core adapter behavior remain passing.
- [ ] Focused/full tests, framework/web typechecks, and diff check pass.
- [ ] `plans/README.md` marks plan 047 DONE.

## STOP conditions

- A direct consumer relies on legacy required-mark inference.
- Removing a validator prop reveals production behavior not represented by
  schemas.
- Touch forwarding causes duplicate field validation and no deterministic
  single-event rule can preserve callers.
- Core Form no longer owns field error presentation.

## Maintenance notes

Inputs may validate interaction syntax locally—numeric filtering, color parsing,
file size—but business validity belongs to schemas. New controls should not
inject form configuration.
