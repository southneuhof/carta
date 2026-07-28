# Plan 022: Make resource forms render with built-in inputs and schema metadata

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update this plan's status in
> `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat fc8c9ec..HEAD -- packages/is-vue-framework/src/renderers packages/is-vue-framework/src/components/core/Form.vue packages/is-vue-framework/src/components/composites/formInputRegistry.ts packages/is-vue-framework/src/validation packages/is-vue-framework/src/adapters/plugin.ts packages/is-vue-framework/src/index.ts`
>
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against live code. Stop on a semantic mismatch.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `fc8c9ec`, 2026-07-28

## Why this matters

`Form.vue` has real draft, load, validation, and submission machinery, and web
routes already mount it through `FormView`. Those routes fail to render their
configured fields because the framework plugin creates an empty form-renderer
registry. Existing styled inputs also use the legacy `v-model` contract rather
than the core renderer contract. This plan supplies compatible built-in
renderers, lets projects override them, connects Zod renderer inference, and
renders load failures instead of leaving a blank form.

## Current state

- `packages/is-vue-framework/src/components/core/Form.vue:45-55` gets the form
  renderer registry, resolves fields without schema metadata, and starts the
  optional loader.
- `packages/is-vue-framework/src/components/core/Form.vue:231-246` requires the
  configured renderer key and passes the core `value`/`setValue` contract.
- `packages/is-vue-framework/src/renderers/registry.ts:53-58` constructs empty
  registries unless the application supplies every renderer.
- `packages/is-vue-framework/src/adapters/plugin.ts:44` calls
  `createRendererRegistries(options?.renderers)`.
- `apps/web/src/main.ts:56` supplies no `renderers`, so `renderer: 'text'`
  throws `No form renderer registered for "text". Registered: none.`
- `packages/is-vue-framework/src/components/composites/formInputRegistry.ts`
  already contains the built-in input map, but it is private legacy composite
  machinery.
- Inputs such as `components/inputs/TextInput.vue` use `defineModel()` and
  expect a string `field`; core renderers receive `value`, `setValue`, and a
  `FieldRendererInfo` object. Do not register these components directly without
  an adapter.
- `packages/is-vue-framework/src/validation/zod.ts:129-148` already implements
  `inferFieldLayers()`.
- `packages/is-vue-framework/src/validation/__tests__/validation.spec.ts:74-83`
  proves the inference works when manually passed to `resolveFields()`, but
  `Form` never passes it.
- `packages/is-vue-framework/src/query/useLoader.ts` exposes normalized
  `error`, `loading`, and `refresh`; `Form.vue` renders only loading.

Repository rules:

- Field configuration uses `renderer`, never `type`.
- Project renderer entries override framework defaults.
- Core Form remains resource-agnostic and never reads routes, API URLs,
  `appDefaults.inputConfig`, or CRUD mode.
- Existing input components may remain legacy-compatible during migration, but
  new core contracts must not depend on injected legacy form state.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/renderers src/validation src/components/core/__tests__/form.spec.ts --environment jsdom` | all selected tests pass |
| Package tests | `pnpm --filter @southneuhof/is-vue-framework test` | all tests pass |
| Typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0, no errors |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0, no errors |
| Diff validation | `git diff --check` | no output |

## Scope

**In scope**:

- `packages/is-vue-framework/src/renderers/registry.ts`
- `packages/is-vue-framework/src/renderers/form.ts` (create)
- `packages/is-vue-framework/src/renderers/index.ts`
- `packages/is-vue-framework/src/renderers/__tests__/registry.spec.ts`
- `packages/is-vue-framework/src/components/core/Form.vue`
- `packages/is-vue-framework/src/components/core/__tests__/form.spec.ts`
- `packages/is-vue-framework/src/components/composites/formInputRegistry.ts`
- `packages/is-vue-framework/src/validation/zod.ts`
- `packages/is-vue-framework/src/validation/index.ts`
- `packages/is-vue-framework/src/validation/__tests__/validation.spec.ts`
- `packages/is-vue-framework/src/index.ts`
- `packages/is-vue-framework/src/__tests__/public-api.spec.ts`

**Out of scope**:

- `apps/web/src/configs/defaults.ts` and legacy `inputConfig`.
- Input component redesign.
- Dynamic presentation and value-effect changes; plan 023 owns them.
- Custom/async validators and touched-error policy; plan 024 owns them.
- Toast, navigation, and submission-success behavior in `FormView`.

## Git workflow

- Branch: `codex/022-core-form-renderers`
- Use conventional commits, for example:
  `fix(framework): wire core form renderers`
- Do not push or open a PR unless explicitly instructed.

## Steps

### Step 1: Extract a reusable built-in form renderer map

Create `renderers/form.ts`. Move ownership of the built-in renderer keys out of
the legacy composite registry. Export a `builtInFormRenderers` map containing
the currently supported stable keys (`text`, `textarea`, `password`, `number`,
`currency`, `select`, `radio`, `date`, `daterange`, `month`, `year`, `time`,
`checkbox`, `checkbox-group`, `switch`, `file`, `image`, `tag`, `color`,
`lookup`, `master-lookup`, `location`, `multi-location`, `rich-text`,
`icon-select`, `table`, `dynamic-form`, `separator`, `canvas`, `file-manager`,
and `iso-clause`).

Each entry must be a core-compatible adapter, not the legacy component directly.
The adapter must:

- accept core renderer context (`value`, `setValue`, `field`, `error`,
  `touched`, `disabled`, plus ordinary renderer props);
- bind `value` through `modelValue` and `onUpdate:modelValue`;
- pass `field.key` to legacy inputs expecting a string field;
- pass label/error/disabled without requiring legacy injected validation state;
- forward `validation:touch`;
- avoid mutating the supplied draft or field object.

Keep async component loading. Change
`components/composites/formInputRegistry.ts` to consume the same underlying
built-in component definitions or exported legacy map, so there is one list of
keys rather than two divergent registries.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework exec vitest run src/renderers src/components/composites/__tests__/formInputRegistry.spec.ts --environment jsdom`
→ all selected tests pass, including a new adapter test proving a legacy
`defineModel()` input calls core `setValue`.

### Step 2: Install defaults while preserving project overrides

Change `createRendererRegistries()` so its form registry begins with
`builtInFormRenderers` and shallowly overlays `input.form`. Do not add implicit
table or detail defaults in this plan.

Required precedence:

```text
built-in form renderer < project renderer with same key
```

Add registry tests proving `text` exists without configuration and a supplied
`form.text` replaces it.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework exec vitest run src/renderers/__tests__/registry.spec.ts --environment jsdom`
→ all registry tests pass.

### Step 3: Connect schema metadata to field resolution

Add a structural helper in `validation/zod.ts` that accepts
`ValidationSchema | undefined` and returns inferred field layers only when the
schema carries a Zod `source`. Opaque custom validation schemas return `{}`.
Do not inspect private Zod metadata anywhere outside the Zod bridge.

In `Form.vue`, resolve form fields using that inferred schema layer:

```text
inferred schema metadata < shared field definition < form projection
```

Explicit resource field configuration must continue to beat inference. A
resource field without a renderer should infer `text`, `number`, `switch`,
`date`, `select`, or `tag` where supported.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework exec vitest run src/validation/__tests__/validation.spec.ts src/components/core/__tests__/form.spec.ts --environment jsdom`
→ new tests prove schema-only renderer inference and explicit renderer
precedence.

### Step 4: Render loader errors and retry access

Add an `error` slot before form content:

- slot props: normalized `error` and `retry` (`loaded.refresh`);
- default: accessible `role="alert"` message;
- do not render fields while load error is active;
- keep `refresh` exposed.

Add a Form test with a rejected loader proving the normalized message renders
and the error slot receives retry.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/core/__tests__/form.spec.ts --environment jsdom`
→ all Form tests pass.

### Step 5: Verify a real resource-form path

Add an integration-level framework test that mounts `FormView` with a
`defineResource()` containing `renderer: 'text'`, no project renderer config,
and a Zod schema. Assert:

- the built-in text input renders;
- editing reaches resource `submit`;
- invalid data blocks submit and displays the Zod issue.

Use test-local resource runtime setup. Do not depend on live API or router
navigation.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework test`
→ full package suite passes.

## Test plan

Add tests for:

- built-in renderer availability with no plugin renderer input;
- project override precedence;
- legacy `v-model` adapter → core `setValue`;
- core context → legacy string field key;
- schema-only renderer inference;
- explicit field renderer beating inference;
- load-error default and slot/retry behavior;
- resource → FormView → built-in input → validation → submit integration.

Follow existing patterns in:

- `src/renderers/__tests__/registry.spec.ts`
- `src/components/core/__tests__/form.spec.ts`
- `src/components/views/__tests__/views.spec.ts`

## Done criteria

- [ ] A resource field with `renderer: 'text'` renders without app-level renderer registration.
- [ ] Project renderers override built-ins by key.
- [ ] Existing legacy inputs update core draft through adapters.
- [ ] Zod schema metadata reaches form field resolution.
- [ ] Explicit field presentation beats inferred presentation.
- [ ] Loader failures render an accessible error and expose retry.
- [ ] Focused tests, package tests, package typecheck, and web typecheck pass.
- [ ] `git diff --check` returns no output.
- [ ] No out-of-scope source files changed.
- [ ] `plans/README.md` marks plan 022 DONE after implementation and review.

## STOP conditions

Stop and report if:

- Existing inputs cannot be adapted without changing their public `v-model`
  behavior.
- Core compatibility requires restoring legacy injection keys.
- A built-in renderer imports application code or route state.
- Schema inference requires Zod-private reads outside `validation/zod.ts`.
- Existing form routes still render blank after the integration test passes.

## Maintenance notes

- Keep built-in renderer keys centralized. New inputs must be added once.
- Renderer adapters are migration boundaries. New native core renderers should
  implement core context directly and may later replace adapters one by one.
- Review bundle impact from async imports, but do not convert them to eager
  imports.

