# Plan 048: Name and document the controlled input adapter

> **Implementation instructions**: This plan is cleanup for a rejected audit
> finding. Do not replace `v-model`; controlled input components are deliberate.
> Follow every gate and update `plans/README.md` after review.
>
> **Drift check (run first)**:
> `git diff --stat 4169fb0..HEAD -- packages/is-vue-framework/src/renderers/form.ts packages/is-vue-framework/src/renderers/__tests__/registry.spec.ts docs/architecture/input-data-migration.md plans/README.md`
>
> Stop if the project has changed its controlled-input decision.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `4169fb0`, 2026-07-29

## Why this matters

Audit finding ARCH-01 was rejected: `modelValue`/`update:modelValue` is the
intentional controlled input API. Core Form owns draft state through
`value`/`setValue`, and a thin adapter maps that contract to `v-model`.
Current names `legacyComponent` and `legacyInput` falsely imply planned removal;
rename and document the stable boundary.

## Current state

`renderers/form.ts:1-7` already describes the correct architecture:

```ts
Existing inputs speak Vue's `modelValue` contract while core Form exposes
`value` and `setValue`. Keep that compatibility boundary here.
```

But `renderers/form.ts:45-77` names the functions:

```ts
function legacyComponent(input: Component): Component
function legacyInput(loader: () => Promise<{ default: Component }>): Component
```

The adapter forwards ordinary attrs, `id`, `disabled`, `error`, controlled
value updates, and `validation:touch`. Core Form continues owning draft, field
layout, labels, schema validation, and submission.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/renderers/__tests__/registry.spec.ts src/components/core/__tests__/form.spec.ts --environment jsdom` | all pass |
| Package tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass |
| Typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Diff check | `git diff --check` | no output |

## Scope

**In scope**:

- `packages/is-vue-framework/src/renderers/form.ts`
- `packages/is-vue-framework/src/renderers/__tests__/registry.spec.ts`
- `docs/architecture/input-data-migration.md`
- `plans/README.md`

**Out of scope**:

- Any input component rewrite.
- Replacing `modelValue` with native `value/setValue` props.
- Core Form behavior or renderer registry keys.
- Forwarding new renderer context without a separate use case and plan.

## Git workflow

- Branch: `codex/048-controlled-input-adapter`
- Commit: `refactor(framework): name controlled input adapter`
- Do not push or open a PR unless requested.

## Steps

### Step 1: Lock adapter behavior in tests

Add a small test component with:

- `modelValue` prop;
- `update:modelValue` and `validation:touch` emits;
- rendered `id`, disabled, error, and ordinary attr visibility.

Mount it through the adapter and assert:

- core `value` arrives as `modelValue`;
- component update calls `setValue` exactly once;
- touch forwards exactly once;
- `id`, disabled, error, and ordinary renderer props arrive;
- core-only draft/field/touched/validating state does not leak accidentally.

Export adapter function from `form.ts` for internal testing if needed; do not
add it to package root exports.

**Verify**: focused tests pass before and after rename.

### Step 2: Rename adapter symbols

Use names that encode behavior, not age:

```ts
adaptVModelInput(component)
controlledInput(loader)
```

Equivalent clear names are acceptable, but avoid `legacy`, `compat`, or
`temporary`. Rename every built-in entry call without changing keys, async
loading, or render behavior. Rename component `name` from
`CoreFormRendererAdapter` only if tests/devtools snapshots do not depend on it;
prefer `ControlledFormInputAdapter`.

**Verify**:

```sh
rg -n "legacyComponent|legacyInput|CoreFormRendererAdapter" \
  packages/is-vue-framework/src/renderers
```

Expected: no matches.

### Step 3: Document stable controlled boundary

Add a short “Controlled inputs” section to
`docs/architecture/input-data-migration.md`:

- parent/core Form owns data;
- reusable controls expose Vue `v-model`;
- adapter maps `value/setValue` to `modelValue/update:modelValue`;
- this is intentional, not deprecated;
- business validation remains core/schema-owned.

Do not call `v-model` uncontrolled or imply two independent state owners.

**Verify**:

```sh
rg -n "Controlled inputs|modelValue|setValue" docs/architecture/input-data-migration.md
```

Expected: new section and all three contract terms present.

### Step 4: Record rejected finding and run gates

Add to `plans/README.md` rejected findings:

> Rewriting controlled `v-model` inputs as native `value/setValue` renderers:
> rejected because parent-owned `v-model` is the deliberate reusable input
> contract; plan 048 only names and documents its adapter.

Run focused/full tests, typecheck, and diff check.

## Test plan

Use `renderers/__tests__/registry.spec.ts` createApp/h() style. Test observable
contract only; no snapshots or async import resolution is required.

## Done criteria

- [ ] Renderer adapter contains no `legacy*` naming.
- [ ] Controlled `v-model` mapping has direct tests.
- [ ] Built-in keys and components are unchanged.
- [ ] Migration guide states controlled input decision.
- [ ] Rejected finding is recorded in plan index.
- [ ] Focused/full tests, typecheck, and diff check pass.
- [ ] `plans/README.md` marks plan 048 DONE after implementation.

## STOP conditions

- Maintainers decide input components should no longer expose `v-model`.
- Adapter rename changes public exports or renderer keys.
- Existing tests depend on old component `name` for supported behavior.
- Cleanup requires editing individual input components.

## Maintenance notes

Future controlled inputs should use this adapter. A project may still register
a native core renderer when it needs full renderer context; that is an override,
not the default migration direction.
