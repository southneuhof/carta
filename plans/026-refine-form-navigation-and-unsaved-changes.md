# Plan 026: Refine form controls, navigation, and unsaved-change protection

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update this plan's status in
> `plans/README.md` after implementation and review.
>
> **Drift check (run first)**:
> `git diff --stat fc8c9ec..HEAD -- packages/is-vue-framework/src/renderers/form.ts packages/is-vue-framework/src/renderers/__tests__/registry.spec.ts packages/is-vue-framework/src/components/core/Form.vue packages/is-vue-framework/src/components/core/__tests__/form.spec.ts packages/is-vue-framework/src/components/inputs/{TextInput,TextareaInput,NumberInput,CurrencyInput,SelectInput}.vue packages/is-vue-framework/src/components/views/FormView.vue packages/is-vue-framework/src/components/views/__tests__/views.spec.ts packages/is-vue-framework/src/components/views/__type-tests__/form-view.type-test.ts 'apps/web/src/routes/(authenticated)/settings/roles/create.route.vue' 'apps/web/src/routes/(authenticated)/settings/roles/[roleId]/edit.route.vue' 'apps/web/src/routes/(authenticated)/settings/users/[userId]/edit.route.vue' 'apps/web/src/routes/(authenticated)/hr/overtimes/create.route.vue' 'apps/web/src/routes/(authenticated)/hr/overtimes/[overtimeId]/edit.route.vue'`
>
> Plans 022–025 are intentionally uncommitted in this working tree. Before
> editing, compare live files against fingerprints below. Do not reset,
> restore, or overwrite their changes.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans/025-design-core-form-surface.md
- **Category**: direction
- **Planned at**: commit `fc8c9ec`, 2026-07-29

## Why this matters

The new form surface still gives text-like controls opaque fills in the core
renderer and fallback, uses a heavy primary focus treatment, and has no
consistent exit path. `Cancel` currently clears a draft instead of leaving the
form; browser back, route changes, and refresh can lose edits without a
warning. Forms should follow DetailView's deterministic navigation-card
pattern, use English framework copy, and protect dirty drafts without moving
route policy into the core Form.

## Current state

### Working-tree baseline

```text
ed10b263ed998422de0a33e72287450f6c42f92d158dab124d8615a5bdec2f20  packages/is-vue-framework/src/renderers/form.ts
9a6b1139839071bdb8d3436447767de046001a1c5480814bd8aa5d9864d51d81  packages/is-vue-framework/src/renderers/__tests__/registry.spec.ts
74c8cdde8488a02cc640c3f9431a1e6393e45ba8521ce6b4fd792f291b34f028  packages/is-vue-framework/src/components/core/Form.vue
a67b5c542ad238ff040bf1117af664c82abe1098512488e0f0b7c5803788ab6b  packages/is-vue-framework/src/components/core/__tests__/form.spec.ts
2714d5441c9798f3647994baa146615f4081aaf1514b405f5a57cc8bd4f66b48  packages/is-vue-framework/src/components/views/FormView.vue
718d000f91f611121b2f535da5d6beb7e763bca93df3b8c55ee742b8116c929d  packages/is-vue-framework/src/components/views/__tests__/views.spec.ts
d61f7b9a4de681a97ba6642e6e4984fc84f91a305519b33815dd802bc6f161a6  packages/is-vue-framework/src/components/views/__type-tests__/form-view.type-test.ts
13141a5f749d32ea87bdc4112054f4edbd7a4a336a2e8458b99906aa7e9a45ce  packages/is-vue-framework/src/components/inputs/TextInput.vue
98f3837c169e11d7b9f68d020d1825bc349ce2a9395cdf5171b8303847e62164  packages/is-vue-framework/src/components/inputs/TextareaInput.vue
e51e198aa3c8012361570ab6c5c37ff67af1af603053a73e61d551875a5e91c4  packages/is-vue-framework/src/components/inputs/NumberInput.vue
92cb044335a5f88559ffed6ed32cdfd6626fe33f194c0515a295995fc5b8b011  packages/is-vue-framework/src/components/inputs/CurrencyInput.vue
bc69f87ff6d6d67d8f6191b48371ee55d63838ac3ff9c85a4b585248ba1367a8  packages/is-vue-framework/src/components/inputs/SelectInput.vue
84ae0f07b6fd46329149f6f303d507a2de38b875c762d15f56d4bef2bf68e063  apps/web/src/routes/(authenticated)/settings/roles/create.route.vue
1a9f10b047ce5ddc56810be49e98d0de3d15897a76beeeb6bba2c53ff0b617da  apps/web/src/routes/(authenticated)/settings/roles/[roleId]/edit.route.vue
117fd68d2751725874af562ed5804401123a31a88e710fda1aaa86eb45648a1f  apps/web/src/routes/(authenticated)/settings/users/[userId]/edit.route.vue
a74c8b323b17d8ac8c5d1a8c465c6e37ee37312d8d120613e4c79edbb758a60a  apps/web/src/routes/(authenticated)/hr/overtimes/create.route.vue
8e4908cd37766f5c64d22e02683011b51a4256343bab7437c1d95957de375cd7  apps/web/src/routes/(authenticated)/hr/overtimes/[overtimeId]/edit.route.vue
b38375ac657ed046bb1983137ba772791e74542e4e0da0bb29bdc94902b63350  apps/web/src/routes/(authenticated)/settings/roles/roles.resource.ts
0a1e9031d0cd5becde984768e64ddb4388ae67e9892721efaeb311e6e86403f6  apps/web/src/routes/(authenticated)/settings/users/users.resource.ts
caf60d40f05e2fc8d214db6e82c045ea1081b10581a84415f8720de05ce81660  apps/web/src/routes/(authenticated)/hr/overtimes/overtimes.resource.ts
```

If any fingerprint differs, inspect its diff and continue only if plans 022–025
semantics remain intact.

### Form controls

- `renderers/form.ts:25-40` wraps the core-native `text` input in
  `bg-surface`, promotes focus to `outline-2 outline-primary`, and uses a
  disabled surface fill. ARIA attributes correctly remain on the native input;
  retain that split.
- `core/Form.vue:323-337` gives fallback inputs the same opaque surface and
  primary two-pixel focus outline. `Form.vue:257` already exposes the reactive
  `dirty` ref needed by a view-level leave guard.
- `TextInput.vue:67-82`, `TextareaInput.vue:53-64`, `NumberInput.vue:89-108`,
  `CurrencyInput.vue:67-95`, and the trigger at `SelectInput.vue:260-276`
  use the same outlined text-control family. Password delegates to TextInput.
  Do not alter date, time, switch, radio, file, image, color, camera, rich-text,
  or picker/popover surfaces: their backgrounds communicate a selection,
  preview, or overlay state rather than a text-field fill.

### Navigation and leave behavior

`DetailView.vue:42-67` is the mandatory shell exemplar: an outlined navigation
Card with a `RouterLink`-backed icon Button, followed by a separate outlined
body Card. FormView currently has only one Card, accepts no `backTo` prop, and
its line 195 Cancel Button calls `instance?.reset()`.

```vue
<div class="is-form-view-controls ...">
  <Button type="button" ... @click="instance?.reset()">Batal</Button>
  <Button type="submit" ...>{{ instance?.submitting ? 'Menyimpan…' : submitLabel ?? 'Simpan' }}</Button>
</div>
```

FormView owns resource success navigation through `router.replace()` at lines
134-160. It must mark that internally initiated navigation as allowed, or a
dirty draft will prompt after a successful save. No component currently uses
`onBeforeRouteLeave`; FormView is the route-level shell where that guard
belongs. Browser refresh/close cannot show a custom Vue dialog; it must use a
native `beforeunload` confirmation.

### Route destinations and copy

The five FormView app routes currently supply Indonesian titles and no return
destination. `apps/web/src/route-map.d.ts:41-130` establishes exact targets:

- create routes return to `hr-overtimes` or `settings-roles` lists;
- edit routes return to `hr-overtimes-detail`, `settings-roles-detail`, or
  `settings-users-detail` with their existing identity parameter.

Translate framework-owned form strings, these five form-route title/success
strings, and the role/user/overtime resource labels rendered by these form
surfaces. Those field definitions are shared by list/detail views, so their
visible labels and overtime status labels change together. API validation
messages and unrelated application copy remain out of scope.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused framework tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/renderers/__tests__/registry.spec.ts src/components/core/__tests__/form.spec.ts src/components/views/__tests__/views.spec.ts src/components/inputs/__tests__/text-input-surface.spec.ts --environment jsdom` | all selected tests pass |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | all tests pass |
| Framework typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web build | `pnpm --filter @southneuhof/framework-web build` | exit 0 |
| Diff validation | `git diff --check` | no output |

## Scope

**In scope**:

- `packages/is-vue-framework/src/renderers/form.ts`
- `packages/is-vue-framework/src/renderers/__tests__/registry.spec.ts`
- `packages/is-vue-framework/src/components/core/Form.vue`
- `packages/is-vue-framework/src/components/core/__tests__/form.spec.ts`
- `packages/is-vue-framework/src/components/inputs/{TextInput,TextareaInput,NumberInput,CurrencyInput,SelectInput}.vue`
- `packages/is-vue-framework/src/components/inputs/__tests__/text-input-surface.spec.ts` (new)
- `packages/is-vue-framework/src/components/views/FormView.vue`
- `packages/is-vue-framework/src/components/views/__tests__/views.spec.ts`
- `packages/is-vue-framework/src/components/views/__type-tests__/form-view.type-test.ts`
- the five FormView routes named in "Route destinations and copy"
- `apps/web/src/routes/(authenticated)/settings/roles/roles.resource.ts`
- `apps/web/src/routes/(authenticated)/settings/users/users.resource.ts`
- `apps/web/src/routes/(authenticated)/hr/overtimes/overtimes.resource.ts`
- `plans/README.md` (status row only after review)

**Out of scope**:

- `components/base/Button.vue`, `Card.vue`, and `Dialog.vue`; consume their
  public APIs, do not alter shared primitives.
- All non-textual input/preview/picker background surfaces listed above.
- A global router guard, app store, or Form public `onDiscard` hook. FormView
  already owns the page shell and reads Form's exposed `dirty` state.
- Browser-specific custom refresh text; browsers intentionally control the
  `beforeunload` prompt.
- Broad i18n/localization outside the role/user/overtime resource labels used
  by these form surfaces.

## Git workflow

- Branch: `codex/026-refine-form-navigation-and-unsaved-changes`
- Preserve all existing dirty changes, especially plans 022–025.
- Conventional commit if asked: `feat(framework): protect dirty form exits`
- Do not commit, push, or open a PR unless explicitly requested.

## Steps

### Step 1: Make simple form controls transparent with a restrained secondary focus ring

In every in-scope text-like control, remove normal and disabled background
utilities. Use `bg-transparent` explicitly on the control wrapper/trigger and
keep disabled affordance through cursor and muted text/opacity, not a fill.

Standardize the control family on a one-pixel outline and a short transition of
outline color and box shadow. Normal focus uses secondary, not primary: keep
the one-pixel outline and add only a subtle one-pixel secondary ring. Error
state remains error-colored so validation stays distinguishable; it must not
be overridden by ordinary focus. Preserve minimum height, radius, ARIA wiring,
value flow, renderer adapter behavior, and `twMerge` class extension.

Apply same static Tailwind utilities to:

1. Core text renderer wrapper in `renderers/form.ts`.
2. Form fallback native input in `core/Form.vue`.
3. TextInput, its PasswordInput consumer, TextareaInput, NumberInput,
   CurrencyInput, and SelectInput's visible trigger.

Add `text-input-surface.spec.ts` using the local `createApp` mounting pattern
from `ColorInput.spec.ts`. Mount each simple input with local data/props (and
the framework plugin where SelectInput needs runtime injection); assert its
visible control has transparent background, one-pixel secondary focus utility,
transition utility, and no surface-fill utility. Extend registry/Form tests for
core renderer and fallback class changes without asserting full class strings.

**Verify**: focused framework command above → all selected tests pass.

### Step 2: Make FormView match DetailView navigation cards

Add a required `backTo: RouteLocationRaw` prop to every FormView prop branch.
Reshape FormView into the same two-card hierarchy as DetailView:

1. First outlined surface Card contains a stable RouterLink-backed icon Button
   (`aria-label="Back"`), the title/description header slot area, and controls.
2. Second outlined surface Card contains the body slot and Form body padding.
3. Keep body, header, controls, form-controls, per-field input, and footer
   slots. A header slot replaces title/description content only; it must not
   remove the navigation button.

Replace the Cancel reset action with a RouterLink-backed text Button to
`backTo`; label it `Cancel`. It must navigate to the supplied deterministic
parent, never call Form.reset, and retain native route interception. Use
`Save` / `Saving…` for the default submit control. Replace built-in Form copy
with `Loading…`, `Retry`, and `Save`; replace FormView's built-in success and
follow-up failure toast strings with English. Do not translate caller-provided
labels such as `submitLabel` or resource error payloads.

Update all FormView unit tests and the compile-time prop test so every direct
mount supplies `backTo`. Add assertions for two outlined Cards, unique Back
link href, preserved slot behavior, English default action labels, and Cancel
navigation without draft reset.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/views/__tests__/views.spec.ts --environment jsdom` → all FormView tests pass.

### Step 3: Guard dirty FormView exits with an app-level confirmation

Keep Form core contract unchanged. In FormView, read the exposed Form `dirty`,
`submitting`, and `validating` refs and implement leave orchestration locally.

- Register `onBeforeRouteLeave`. For a clean draft, allow navigation. For a
  dirty draft, return a Promise and open a controlled base `Dialog` in
  FormView. Resolve `false` for close, Escape, overlay dismissal, or `Stay`;
  resolve `true` only from `Discard changes`. This preserves browser Back's
  original history operation rather than replaying it with `router.push`.
- Render controlled dialog copy: title `Discard unsaved changes?`; message
  `You have unsaved changes. If you leave now, they will be lost.`; actions
  `Stay` (text) and `Discard changes` (error filled). Ensure every close path
  settles a pending guard Promise exactly once.
- Add a one-shot internal allow flag around FormView's successful-submit
  `router.replace()` paths, including the `navigate` callback exposed to
  `afterSubmit`. A successful save must never immediately prompt to discard.
- Add a `beforeunload` listener only while dirty. Call `preventDefault()` and
  assign `event.returnValue = ''`; remove listener on unmount. Do not attempt
  custom text because modern browsers suppress it.

Do not add `onDiscard` to FormProps: `dirty` is already exposed, and leave
policy belongs to FormView. Do not move this into `apps/web` router guards;
FormView is reusable and has route/component lifecycle context.

Extend FormView tests with a real memory-router route component harness (the
direct `mountCore` wildcard harness cannot exercise a component leave guard).
Cover clean back/cancel, dirty cancel then Stay, dirty Cancel then Discard,
arbitrary router navigation, native beforeunload behavior, dialog dismissal,
and successful resource submission bypass. Assert no reset event/value change
occurs during Cancel navigation.

**Verify**: focused framework command above → all selected tests pass.

### Step 4: Supply deterministic parent destinations and English form-route copy

Update only the five FormView route files:

- roles create → `backTo: { name: 'settings-roles' }`, title `Create Role`;
- roles edit → `backTo: { name: 'settings-roles-detail', params: { roleId } }`,
  title `Edit Role`;
- users edit → `backTo: { name: 'settings-users-detail', params: { userId } }`,
  title `Edit User`;
- overtime create → `backTo: { name: 'hr-overtimes' }`, title `Request
  Overtime`, success message `Overtime request saved as a draft.`;
- overtime edit → `backTo: { name: 'hr-overtimes-detail', params: { overtimeId } }`,
  title `Edit Overtime`.

Use existing typed `useRoute()` identity values in edit routes. Do not use
`router.back()` or infer history: a direct-link form needs a predictable route.

Translate the visible labels in `roles.resource.ts`, `users.resource.ts`, and
`overtimes.resource.ts` at the same time. Use `Role name`, `Name`, `Created`,
`Updated`, `Date`, `Start time`, `Duration (minutes)`, `Applicant`, `Status`,
`Description`, and the English overtime state labels `Awaiting verification`,
`Approved`, and `Rejected`. This removes Indonesian field/status copy from the
form screens while keeping stable field keys, renderer choices, schemas, and
resource capabilities unchanged.

**Verify**: `pnpm --filter @southneuhof/framework-web type-check` → exit 0.

### Step 5: Review the compiled form

Run all commands in the table. Inspect `/settings/roles/create` in the signed-in
browser at desktop and 375px width. Confirm transparent text field surface,
subtle secondary focus ring, two Card navigation format, Back and Cancel route
behavior, dirty-leave dialog, and native refresh warning. Confirm an untouched
form does not prompt and a successful save does not prompt during redirect.

**Verify**:

```sh
pnpm --filter @southneuhof/is-vue-framework test
pnpm --filter @southneuhof/is-vue-framework type-check
pnpm --filter @southneuhof/framework-web type-check
pnpm --filter @southneuhof/framework-web build
git diff --check
rg -n "Batal|Simpan|Menyimpan|Memuat|Coba lagi" packages/is-vue-framework/src/{components/core/Form.vue,components/views/FormView.vue}
```

Expected: all commands exit 0, diff check has no output, and final `rg` has no
matches. Also run `rg -n "Nama|Tanggal|Jam Mulai|Durasi|Keterangan|Dibuat|Diubah|Menunggu" 'apps/web/src/routes/(authenticated)/settings/roles/roles.resource.ts' 'apps/web/src/routes/(authenticated)/settings/users/users.resource.ts' 'apps/web/src/routes/(authenticated)/hr/overtimes/overtimes.resource.ts'`; it must have no matches. Report browser native refresh prompt as a manual gate because automated browser tools cannot accept it.

## Test plan

- Core text renderer and fallback input retain value, blur, id, and ARIA
  behavior while classes become transparent/secondary.
- Text, password, textarea, number, currency, and select trigger surfaces use
  transparent backgrounds and one-pixel animated secondary focus treatment.
- FormView type tests reject missing `backTo` for raw and resource props.
- FormView Card hierarchy, navigation href, English labels, slots, Cancel
  navigation, resource redirect, and submit pending behavior remain correct.
- Dirty FormView blocks route Back/Cancel/external navigation until the dialog
  settles; close/Stay retain draft; Discard leaves once; successful submit and
  clean drafts do not prompt; refresh registers native confirmation only while
  dirty.

## Done criteria

- [ ] All in-scope simple text controls are transparent in normal and disabled
  states; no primary heavy focus class remains in these control paths.
- [ ] Normal focus uses animated one-pixel secondary outline/ring; error focus
  stays error-colored.
- [ ] FormView follows DetailView's two outlined navigation-Card hierarchy.
- [ ] FormView requires `backTo`; all five app routes pass deterministic list
  or detail destinations.
- [ ] Cancel navigates without reset; all built-in affected copy is English.
- [ ] Dirty internal and browser exits are guarded; clean and post-save exits
  are not blocked.
- [ ] Focused/full framework tests, both typechecks, web build, and
  `git diff --check` pass.
- [ ] No files outside scope changed.
- [ ] `plans/README.md` row 026 is marked DONE only after implementation
  review.

## STOP conditions

Stop and report; do not improvise if:

- Any baseline fingerprint differs and its live behavior no longer matches the
  form semantics described above.
- FormView's component leave guard cannot be tested with a route-mounted
  harness, or a base Dialog close path cannot settle its guard Promise.
- The selected list/detail return destination is not a valid typed route for
  one of the five form screens.
- A custom refresh dialog or browser-specific wording is required; use only
  native `beforeunload` behavior.
- The change requires a global router guard, a Pinia store, Button/Card/Dialog
  public API changes, or a FormProps discard hook.
- A verification command fails twice after a reasonable in-scope correction.

## Maintenance notes

- New FormView screens must provide `backTo`; choose explicit list/detail
  destinations, never history guessing.
- FormView owns page-leave UX. Form continues to own draft state and only
  exposes `dirty`; keep that boundary when future discard callbacks are needed.
- Keep text control classes static for Tailwind scanning. Picker, preview, and
  overlay backgrounds are deliberately not part of this transparency rule.
