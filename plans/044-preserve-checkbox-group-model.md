# Plan 044: Preserve CheckboxGroup model values across interaction

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update this plan's status in
> `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 4169fb0..HEAD -- packages/is-vue-framework/src/components/inputs/CheckboxGroupInput.vue packages/is-vue-framework/src/components/inputs/__tests__/option-source.spec.ts`
>
> Compare live code with this plan after plan 043 lands. Stop if characterization
> established different public semantics.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: `plans/043-characterize-input-migration-contracts.md`
- **Category**: bug
- **Planned at**: commit `4169fb0`, 2026-07-29

## Why this matters

`CheckboxGroupInput` keeps `modelValue` and a second `selected` array. Without
`uniqueIDAs`, that array starts empty even when the controlled parent supplies
existing values. First click rebuilds the model from empty shadow state and can
erase every preloaded selection.

## Current state

`components/inputs/CheckboxGroupInput.vue:27-52` currently does:

```ts
const modelValue = defineModel<any[]>({ default: () => [] })
const selected = ref<any>([])

function handleItemClick(item: any) {
  if (modelValue.value.map((item) => item[props.pick]).includes(item[props.pick]))
    selected.value = selected.value.filter(...)
  else selected.value = [...selected.value, item]

  modelValue.value = selected.value.map(...)
}
```

Only the `uniqueIDAs` mount branch initializes `selected`. Controlled
`modelValue` must remain source of truth. Option data uses `pick` (default
`id`) and `view` (default `name`); preserve that public vocabulary.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused test | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/inputs/__tests__/option-source.spec.ts --environment jsdom` | all tests pass; checkbox case no longer expected-failure |
| Package tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass |
| Typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Diff check | `git diff --check` | no output |

## Scope

**In scope**:

- `packages/is-vue-framework/src/components/inputs/CheckboxGroupInput.vue`
- `packages/is-vue-framework/src/components/inputs/__tests__/option-source.spec.ts`

**Out of scope**:

- Select and RadioGroup behavior.
- Option loader/query logic.
- Changing `modelValue`, `pick`, `view`, or `uniqueIDAs` public shapes.
- Replacing `v-model`; controlled `v-model` is deliberate.

## Git workflow

- Branch: `codex/044-checkbox-group-model`
- Commit: `fix(framework): preserve checkbox group values`
- Do not push or open a PR unless requested.

## Steps

### Step 1: Make controlled model the only selection source

Remove the independent `selected` ref. Implement small helpers that:

- compare an option and model item through `pick`;
- convert an option to the existing output shape, including `uniqueIDAs`;
- derive the current selected options from `modelValue` when rendering.

`handleItemClick` must start from current `modelValue`, remove only the clicked
identity when selected, or append only the clicked item when absent. Return a
new array; never mutate the parent-owned array in place.

Do not rewrite loaded option objects or insert properties whose value is
`undefined` unless plan-043 characterization proves callers require that exact
shape.

**Verify**: focused test → preloaded selections survive adding/removing another
selection.

### Step 2: Lock external-update and identity behavior

Turn plan 043's expected-failure checkbox case into a normal passing test. Add
or retain assertions for:

- initial `[A, B]`, click C → `[A, B, C]`;
- initial `[A, B]`, click A → `[B]`;
- parent replaces model, next click uses replacement;
- string/number identity follows existing strictness captured by plan 043;
- `uniqueIDAs` maps option identity without erasing untouched model fields.

**Verify**: focused test → all cases pass, no `it.fails` remains for checkbox.

### Step 3: Run full gates

Run package tests, typecheck, and diff check. Confirm only two scoped files
changed.

## Test plan

Use mounted `CheckboxGroupInput` with parent-controlled model from plan 043's
harness. Assert parent model after DOM clicks; do not inspect internal state.

## Done criteria

- [ ] No `selected` shadow ref exists in `CheckboxGroupInput.vue`.
- [ ] Preloaded values survive add/remove interaction.
- [ ] External model replacement becomes next interaction's source.
- [ ] `uniqueIDAs` cases retain characterized output shape.
- [ ] Focused and package tests pass.
- [ ] Typecheck and `git diff --check` pass.
- [ ] `plans/README.md` marks plan 044 DONE.

## STOP conditions

- Plan 043 proves production callers intentionally depend on first-click model
  replacement.
- Correctness requires changing the public model from objects to scalar IDs.
- `uniqueIDAs` behavior remains ambiguous after characterization.
- Fix requires changes outside the two scoped files.

## Maintenance notes

Controlled input means parent model is canonical. Future performance work may
derive a `Set` of picked identities, but must not reintroduce independently
writable selection state.
