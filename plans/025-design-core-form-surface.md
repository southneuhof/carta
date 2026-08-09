# Plan 025: Design and wire the core form surface

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update this plan's status in
> `plans/README.md` after implementation and review.
>
> **Drift check (run first)**:
> `git diff --stat fc8c9ec..HEAD -- packages/is-vue-framework/src/renderers/form.ts packages/is-vue-framework/src/components/core/Form.vue packages/is-vue-framework/src/components/views/FormView.vue packages/is-vue-framework/src/renderers/__tests__/registry.spec.ts packages/is-vue-framework/src/components/core/__tests__/form.spec.ts packages/is-vue-framework/src/components/views/__tests__/views.spec.ts`
>
> Plans 022–024 were implemented in the current uncommitted working tree at the
> time this plan was written, so commit drift alone is insufficient. Before
> editing, compare the live files against the excerpts and SHA-256 fingerprints
> below. Do not reset, restore, or overwrite those existing changes.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/022-wire-core-form-renderers-and-schema-metadata.md, plans/023-add-form-presentation-and-safe-value-effects.md, plans/024-add-composed-async-form-validation.md
- **Category**: direction
- **Planned at**: commit `fc8c9ec`, 2026-07-28

## Why this matters

Resource forms now render and function, but the default surface shown by the
web app is browser-native markup: the title has no shell, the built-in text
renderer is a raw input, labels and errors have no visual hierarchy, and the
submit/cancel buttons run together. The apparent "classes" (`is-form-view`,
`is-form-field`, and `is-form-view-controls`) are semantic/test hooks only;
there are no CSS rules for them.

This plan gives forms the same Material-token visual language already used by
`DetailView`, `Card`, `Button`, and legacy inputs. It does not add a second
theme, resource-specific CSS, or configuration API.

## Current state

### Working-tree baseline

These fingerprints identify the uncommitted plans 022–024 implementation this
plan was written against:

```text
1ed8292587463127652937e499452fcd9c1957e1a87b144117a3efeba4710b57  packages/is-vue-framework/src/renderers/form.ts
9a6655c461fc7be84707162e302d9ea113df9e379839ec7f6548c07a247951ba  packages/is-vue-framework/src/components/core/Form.vue
dbb09d926cef16a816d97fdfbc939c45a6461fc582133a3a6476479ff0974bef  packages/is-vue-framework/src/components/views/FormView.vue
f9718556a7e82727cfbe45a8d037743be6d5555f9defcf980712a94f115d6c76  packages/is-vue-framework/src/components/core/__tests__/form.spec.ts
40ff1cf1ce0e83feba6bc9104e110afe14e80fb3fca870308f535f1df964a7f4  packages/is-vue-framework/src/components/views/__tests__/views.spec.ts
b9e51a264870e6f5eb83d0fb75609f3cd1176afd0d60a3bde417683834ec627b  packages/is-vue-framework/src/renderers/__tests__/registry.spec.ts
```

Run:

```sh
shasum -a 256 \
  packages/is-vue-framework/src/renderers/form.ts \
  packages/is-vue-framework/src/components/core/Form.vue \
  packages/is-vue-framework/src/components/views/FormView.vue \
  packages/is-vue-framework/src/components/core/__tests__/form.spec.ts \
  packages/is-vue-framework/src/components/views/__tests__/views.spec.ts \
  packages/is-vue-framework/src/renderers/__tests__/registry.spec.ts
```

If a fingerprint differs, inspect the diff. Continue only when plans 022–024
semantics still match; otherwise stop and report drift.

### Bare control renderer

`packages/is-vue-framework/src/renderers/form.ts:10-24` deliberately implements
`text` as a core-compatible renderer, but emits an unclassed native input:

```ts
const coreTextRenderer = defineComponent({
  name: 'CoreTextRenderer',
  inheritAttrs: false,
  props: { value: { type: null, default: undefined }, setValue: { type: Function, required: true }, disabled: Boolean },
  emits: ['validation:touch'],
  setup(props, { attrs, emit }) {
    return () => h('input', {
      ...attrs,
      value: props.value ?? '',
      disabled: props.disabled,
      onInput: (event: Event) => props.setValue((event.target as HTMLInputElement).value),
      onBlur: () => emit('validation:touch'),
    })
  },
})
```

Other built-in keys use legacy input adapters and therefore retain their input
component styling. `text` is the visible regression in the supplied "Tambah
Role" screenshot.

### Bare core layout and feedback

`packages/is-vue-framework/src/components/core/Form.vue:259-335` has a working
12-column grid and accessibility wiring, but only the grid has utility classes.
Field wrapper, label, issue text, loading/error messages, fallback input, and
fallback submit button are unstyled:

```vue
<div class="grid grid-cols-12 gap-4">
  <div v-for="field in visibleFields" class="is-form-field">
    <label :for="`field-${field.key}`">...</label>
    ...
    <p v-if="issueFor(field.key)" role="alert">{{ issueFor(field.key) }}</p>
  </div>
</div>
```

Do not change field ordering, dynamic span calculation, visibility rules,
renderer selection, validation timing, focus behavior, slots, or payload
semantics while adding presentation.

### Bare page shell

`packages/is-vue-framework/src/components/views/FormView.vue:164-198` emits
plain header and buttons:

```vue
<section class="is-form-view">
  <header>
    <h1 v-if="title">{{ title }}</h1>
    ...
  </header>
  ...
  <div class="is-form-view-controls">
    <button type="submit">...</button>
    <button type="button">Batal</button>
  </div>
</section>
```

Use `packages/is-vue-framework/src/components/views/DetailView.vue:41-68` as
the shell exemplar. It composes `Card`, `Button`, theme color roles, responsive
padding, and explicit header hierarchy.

### Existing design language

- `components/base/Card.vue:112-123`: rounded `Card` surfaces, theme role
  backgrounds, outline variants.
- `components/base/Button.vue:91-140`: 40px pill buttons, filled/text variants,
  focus rings, disabled states.
- `components/inputs/TextInput.vue:62-83`: rounded outlined input, error outline,
  disabled surface, transparent native input.
- `apps/web/tailwind.config.js:5`: scans
  `../../packages/is-vue-framework/src/**/*.{vue,js,ts,tsx}`, so static utility
  classes in framework source are generated by the app.
- `apps/web/tailwind.config.js:21-109`: Material role tokens such as `primary`,
  `error`, `surface-container`, `outline`, and matching `on-*` colors.

## Target design

Use this ownership and hierarchy:

```text
FormView
└─ outlined surface Card
   ├─ header: title + optional description + page controls
   └─ Form body
      ├─ form/root issues
      ├─ responsive 12-column field grid
      │  └─ label → renderer → helper/error
      └─ divider + Cancel(text) + Submit(filled)
```

Visual contract:

- One outlined `surfaceContainer` card; 12px radius comes from `Card`.
- Header: 20px/24px responsive padding, subtle bottom divider, 18px semibold
  title, 14px muted description.
- Form body: 20px/24px responsive padding.
- Grid: 16px horizontal gap, 20px vertical gap; existing 12-column spans stay
  authoritative. Default fields remain full width.
- Field: 8px vertical gap; 14px medium label; 48px minimum control height.
- Text input: `surface` background, 8px radius, 1px low-emphasis outline, 2px
  primary focus outline, 2px error outline, disabled surface/text tokens.
- Error/root/operational feedback: `errorContainer` surface with
  `onErrorContainer` text; field issues remain 14px `error` text below control.
- Actions: top divider, 20px top padding, end aligned with 8px gap. Cancel uses
  `Button variant="text"`; submit uses default filled `Button`. Both are full
  width on narrow screens and intrinsic width from `sm` upward.
- Pending submit label becomes `Menyimpan…`; controls remain disabled while
  submitting/validating. Do not add animation in this plan.
- Keep `is-form-*` classes as stable hooks, but never rely on undefined global
  CSS for appearance.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused renderer/core/view tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/renderers/__tests__/registry.spec.ts src/components/core/__tests__/form.spec.ts src/components/views/__tests__/views.spec.ts --environment jsdom` | all selected tests pass |
| Framework package tests | `pnpm --filter @southneuhof/is-vue-framework test` | all tests pass |
| Framework typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0, no errors |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0, no errors |
| Web production build | `pnpm --filter @southneuhof/framework-web build` | exit 0 and Tailwind compiles framework utility classes |
| Diff validation | `git diff --check` | no output |

## Scope

**In scope**:

- `packages/is-vue-framework/src/renderers/form.ts`
- `packages/is-vue-framework/src/renderers/__tests__/registry.spec.ts`
- `packages/is-vue-framework/src/components/core/Form.vue`
- `packages/is-vue-framework/src/components/core/__tests__/form.spec.ts`
- `packages/is-vue-framework/src/components/views/FormView.vue`
- `packages/is-vue-framework/src/components/views/__tests__/views.spec.ts`
- `plans/README.md` (status row only after implementation)

**Out of scope**:

- `apps/web/src/assets/main.css` and `apps/web/tailwind.config.js`; current
  token definitions and package scan already support this plan.
- Resource definitions and routes; forms must gain styling without per-resource
  changes.
- `BaseInput.vue` and legacy input redesign. Existing non-text renderers already
  use those components.
- New form configuration props for colors, variants, or spacing.
- Plans 022–024 behavior, validation, renderer registry, and resource contracts.
- Global `.is-form-*` CSS rules.
- Navigation semantics for "Batal"; it continues to reset the draft.
- Visual snapshot infrastructure or theme redesign.

## Git workflow

- Branch: `codex/025-design-core-form-surface`
- Preserve all pre-existing dirty files and plans 022–024 changes.
- Conventional commit example: `feat(framework): design core form surface`
- Do not commit, push, or open a PR unless explicitly requested.

## Steps

### Step 1: Style the built-in core text renderer

In `packages/is-vue-framework/src/renderers/form.ts`, keep `CoreTextRenderer`
core-native; do not route it through legacy injected form state.

Add explicit `id` and `error` props. Render a styled wrapper plus native input:

- Spread ordinary input/ARIA attrs onto the native input, not the wrapper.
- Preserve `id`, `value`, `disabled`, `setValue`, and `validation:touch`.
- Use `twMerge` so resource `behavior.presentation.props.class` can extend or
  override wrapper styling.
- Apply the target input styles above using static Tailwind strings.
- Error and disabled classes derive only from core props.

Add renderer tests in
`packages/is-vue-framework/src/renderers/__tests__/registry.spec.ts` (or a new
adjacent `form.spec.ts` if that keeps the file clearer) proving:

1. built-in text renderer retains value/update/blur behavior;
2. `id`, `aria-invalid`, and `aria-describedby` land on the native input;
3. normal, error, and disabled classes land on the wrapper;
4. a supplied class is merged, not lost.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework exec vitest run src/renderers --environment jsdom`
→ all renderer tests pass.

### Step 2: Style core field layout and validation states

In `packages/is-vue-framework/src/components/core/Form.vue`, add only
presentation:

- root form layout;
- loading and loader-error surfaces, with a small `Button` retry action calling
  existing `loaded.refresh`;
- submit/root issue alert surfaces;
- grid gap and field wrapper hierarchy;
- label and field issue typography;
- styled fallback input matching the built-in text renderer;
- styled default controls using `Button`.

Import and reuse `components/base/Button.vue`; do not duplicate its filled/text
button classes. Keep all existing slot names and slot props. Keep the fallback
native input because ad-hoc fields without renderer selection still require it.

For derived fields, existing behavior already forces disabled state; styling
must show the same disabled treatment without changing draft behavior.

Extend `components/core/__tests__/form.spec.ts` with structural assertions:

- field wrappers carry layout classes without losing inline grid spans;
- labels remain associated with native inputs;
- field errors retain `role="alert"` and gain error text classes;
- root issues and loader errors use container classes;
- retry invokes `loaded.refresh`;
- default submit is a framework `Button` and disables during validation/submit;
- slot replacements still replace default visuals.

Do not assert full class strings; assert stable semantic utilities individually
to avoid `tailwind-merge` ordering brittleness.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/core/__tests__/form.spec.ts --environment jsdom`
→ all Form tests pass.

### Step 3: Compose the designed FormView shell

In `packages/is-vue-framework/src/components/views/FormView.vue`, follow
`DetailView.vue`:

- import and use `Card` and `Button`;
- wrap header and form body in one outlined `surfaceContainer` card;
- style title, description, responsive padding, divider, and page controls;
- keep `body`, `header`, `controls`, `form-controls`, per-field input slots, and
  `footer` behavior intact;
- replace native cancel/submit buttons with `Button`;
- render cancel before submit visually;
- show `Menyimpan…` while submitting;
- disable both actions while submission is in progress;
- keep cancel wired to `instance.reset()` and submit as native form submit.

Extend `components/views/__tests__/views.spec.ts`:

- FormView renders one outlined surface card;
- title/description/action regions retain slots and hierarchy;
- action bar has divider, responsive layout, and distinct text/filled buttons;
- submit and reset behavior remains unchanged;
- body/header/form-control overrides still bypass their defaults.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/views/__tests__/views.spec.ts --environment jsdom`
→ all view tests pass.

### Step 4: Verify real resource output and compiled utilities

Run focused tests, full framework tests, both typechecks, and web production
build from the command table.

Inspect the built CSS without editing generated output:

```sh
rg -l "surface-container|outline-error" apps/web/dist/assets/*.css
```

Expected: at least one emitted CSS asset matches. If `apps/web/dist` uses a
different ignored build path, locate the emitted CSS with `rg --files
apps/web | rg 'dist/.+\\.css$'`; do not change Vite/Tailwind config.

Then run the existing web app and inspect the real route:

```sh
pnpm dev:web
```

Open `/settings/roles/create` in the signed-in browser session. Confirm:

- title and form share the outlined card;
- input, label, focus, error, disabled, and action states match Target design;
- at 375px width actions stack full-width and no horizontal overflow appears;
- at desktop width actions align right and field span behavior remains intact;
- dark theme preserves readable contrast.

Capture before/after screenshots in the implementation report, not in source
control. If authentication or API state prevents the route check, report that
manual gate as blocked; do not add test credentials or bypass auth.

**Verify**:

```sh
pnpm --filter @southneuhof/is-vue-framework test
pnpm --filter @southneuhof/is-vue-framework type-check
pnpm --filter @southneuhof/framework-web type-check
pnpm --filter @southneuhof/framework-web build
git diff --check
```

Expected: every command exits 0; no new warnings from Form, FormView, renderer,
Vue, or Tailwind.

## Test plan

- Renderer unit tests: core text value flow, blur, ARIA forwarding, error,
  disabled, custom class merging.
- Core Form unit tests: field hierarchy, alert styling, loader retry, fallback
  control, disabled/pending state, preserved slots and accessibility.
- FormView unit tests: Card/Button composition, responsive utility hooks,
  title/description/controls, submit/reset, slot replacement.
- Regression suite: all existing behavior, async validation, resource, and
  view tests from plans 022–024.
- Real app: roles create route at mobile/desktop widths plus dark theme.

Use existing tests in `components/core/__tests__/form.spec.ts` and
`components/views/__tests__/views.spec.ts` as structural patterns. Do not add
pixel snapshots.

## Done criteria

- [ ] Built-in `text` renderer no longer emits an unstyled top-level input.
- [ ] `Form.vue` has styled loading, error, field, fallback-input, and default
  control states without changing form contracts.
- [ ] `FormView.vue` composes existing `Card` and `Button` primitives.
- [ ] `rg -n "<button" packages/is-vue-framework/src/components/views/FormView.vue`
  returns no native action buttons.
- [ ] `rg -n "class=\"is-form-(view|field|view-controls)\"" packages/is-vue-framework/src/components/{core/Form.vue,views/FormView.vue}`
  returns no hook used as the sole class.
- [ ] Focused and full framework tests pass.
- [ ] Framework and web typechecks pass.
- [ ] Web build passes and emitted CSS contains target utilities.
- [ ] Real roles-create form reviewed at mobile, desktop, and dark theme, or
  manual gate explicitly reported blocked by external auth/API state.
- [ ] `git diff --check` returns no output.
- [ ] No files outside scope changed by this plan.
- [ ] `plans/README.md` row 025 marked DONE only after implementation review.

## STOP conditions

Stop and report; do not improvise if:

- Any baseline fingerprint differs and the live code no longer has plans
  022–024 renderer, behavior, or async-validation semantics.
- Styling requires changing resource definitions, route code, global theme
  tokens, or Tailwind content configuration.
- `Button` cannot preserve native submit behavior or `Card` cannot preserve
  FormView slots without changing their public APIs.
- Fixing a legacy renderer requires editing `BaseInput.vue` or individual
  legacy input components; keep that as a separate migration.
- A verification command fails twice after a reasonable in-scope correction.
- Visual review exposes a design choice not specified here that materially
  changes hierarchy or behavior.

## Maintenance notes

- Renderer owns control appearance; core Form owns field layout and feedback;
  FormView owns page shell and action chrome. Keep this split when adding new
  renderer types.
- Static Tailwind class strings are required because the web app scans framework
  source. Do not generate token class names dynamically.
- Project renderer overrides and field slots remain the escape hatches for
  product-specific form visuals.
- Review ARIA placement carefully: wrapper styling must never move `id`,
  `aria-invalid`, or `aria-describedby` away from the focusable native input.
- A future navigation-aware cancel action should be a separate FormView API
  decision; this plan intentionally preserves reset semantics.
