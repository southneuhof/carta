# Plan 055: Add a core-native DialogForm composite

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report; do not improvise. After implementation and review, update this plan's
> status row in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat a52ea98..HEAD -- packages/is-vue-framework/src/contracts/components.ts packages/is-vue-framework/src/components/base/Dialog.vue packages/is-vue-framework/src/components/core/Form.vue packages/is-vue-framework/src/components/composites/form-inputs/TableInput.vue packages/is-vue-framework/src/components/composites/__tests__/TableInput.spec.ts packages/is-vue-framework/src/index.ts packages/is-vue-framework/src/__tests__/public-api.spec.ts packages/is-vue-framework/README.md apps/web/src/framework/__tests__/legacy-boundary.spec.ts docs/architecture/web-application-architecture.md`
>
> `Form.vue`, its tests, and `plans/README.md` had unrelated uncommitted work
> when this plan was written. Do not reset, restore, or overwrite it. Compare
> live contracts against "Current state" before implementation.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED — component coordinates two state machines and a public generic
  prop/event surface
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `a52ea98`, 2026-07-29

## Why this matters

Information-system screens repeatedly put create, edit, and workflow forms in
dialogs. Direct `Dialog` + `Form` composition repeats open-state wiring, standard
actions, pending-state rules, close-after-submit behavior, and dirty-close
policy. A core-native `DialogForm` makes that lifecycle one tested public
contract without reviving legacy model-config or CRUD orchestration.

This is a new Framework 2.0 composite that reuses the deleted name. It must wrap
`components/core/Form.vue`, accept canonical `FormProps`, and remain ignorant of
resources, create/update modes, routing, and backend payload shapes.

## Current state

### Canonical contracts

- `packages/is-vue-framework/src/contracts/components.ts:71-114` defines
  `FormProps` as submit-bound or model-bound operation. `fields` is required;
  `submit`, `initialData`, `load`, schema/validators, context, namespace, and
  `disabled` remain Form-owned.
- `packages/is-vue-framework/src/components/core/Form.vue:25-45` selects
  model-bound operation by **binding presence**, including an explicitly
  undefined model. A wrapper must not accidentally pass `modelValue: undefined`
  or an update listener when caller did not bind a draft model.
- `Form.vue:230-258` emits `submitted` only after validation succeeds and
  `submit` resolves. Rejected submissions emit `error`; validation failures emit
  neither. `DialogForm` must close from `submitted`, never from button click or
  submit invocation.
- `Form.vue:262` exposes `draft`, `reset`, `submit`, `refresh`, `dirty`,
  `submitting`, and `validating`.
- `Form.vue:265-354` owns native `<form>` semantics, loading/load-error states,
  dynamic `input:<field>` slots, and the `actions` slot. `DialogForm` must not
  duplicate field rendering or validation.
- `packages/is-vue-framework/src/components/base/Dialog.vue:13-21` owns its
  default `v-model`, `setOpen`, and `open`/`close` events.
- `Dialog.vue:25-54` owns trigger bindings, Radix focus/dismiss behavior,
  title/description semantics, scrollable content, and optional footer.

### Repetition proving the composite

`packages/is-vue-framework/src/components/composites/form-inputs/TableInput.vue`
contains two copies:

- lines 89-113: create-row `Dialog` + `Form`, manual cancel, pending Save, and
  manual `setOpen(false)` inside the submit handler;
- lines 127-152: same lifecycle for edit-row replacement.

`packages/is-vue-framework/src/components/composites/__tests__/TableInput.spec.ts:114`
currently locks direct core Form/base Dialog composition and explicitly rejects
`DialogForm`. That assertion represented the legacy migration boundary, not a
permanent rejection of a new core-native composite.

### Legacy name collision

The deleted component at commit `a52ea98^` imported
`components/composites/Form.vue` and model-config `InputConfig`; accepted
`fieldsAlias`, `getInitialData`, `beforeSubmit`, and `extraData`; emitted
`success`; and supplied Indonesian button policy. None of that API returns.

Three guards currently treat the file name itself as legacy:

- `packages/is-vue-framework/src/__tests__/public-api.spec.ts:74-87` asserts
  `components/composites/DialogForm.vue` does not exist.
- `apps/web/src/framework/__tests__/legacy-boundary.spec.ts:13-32` forbids the
  import path alongside truly retired identifiers.
- `packages/is-vue-framework/README.md:29-32` and
  `docs/architecture/web-application-architecture.md:837-848` say the
  config-driven component was removed.

Update these narrowly: preserve rejection of legacy props/identifiers while
allowing and documenting the new component.

### Export conventions

- `packages/is-vue-framework/src/components/core/index.ts` and
  `components/views/index.ts` provide local barrels.
- `packages/is-vue-framework/src/index.ts:1-7` exports contracts, core
  components, and views from package root.
- `packages/is-vue-framework/package.json` maps `./components/*` to source, but
  a high-frequency framework pattern should also have a named root export.
- `packages/is-vue-framework/src/__tests__/public-api.spec.ts:40-68` locks root
  exports.

### Verified baseline

At planning time:

```text
Test Files  3 passed (3)
Tests       41 passed (41)
```

Command:

```sh
pnpm --filter @southneuhof/is-vue-framework exec vitest run \
  src/components/composites/__tests__/TableInput.spec.ts \
  src/components/core/__tests__/form.spec.ts \
  src/__tests__/public-api.spec.ts \
  --environment jsdom
```

Framework `type-check` also exited 0.

Full framework baseline is not green because of one pre-existing, out-of-scope
Table presentation assertion:

```text
Test Files  1 failed | 45 passed (46)
Tests       1 failed | 322 passed (323)
Failure     src/components/core/__tests__/table.spec.ts:390
```

Plan 055 must produce no additional failures. Do not change core Table or its
test to make the full command green.

## Target contract

Add these public types beside `FormProps` in
`packages/is-vue-framework/src/contracts/components.ts`:

```ts
export type DialogFormCloseReason = 'cancel' | 'dismiss'

export interface DialogFormCloseContext {
  reason: DialogFormCloseReason
  dirty: boolean
  submitting: boolean
  validating: boolean
}

export type DialogFormProps<
  TInput extends object = Record<string, unknown>,
  TResult = unknown,
> = FormProps<TInput, TResult> & {
  title?: string
  description?: string
  closeOnSubmitted?: boolean
  beforeClose?: (context: DialogFormCloseContext) => MaybePromise<boolean>
  cancelLabel?: string
  submitLabel?: string
  submittingLabel?: string
}
```

Required component behavior:

- Use named `v-model:open` for dialog visibility. Keep default `v-model`
  available for Form draft data; these are separate models.
- Accept flat canonical `FormProps`, not a nested legacy config or resource.
- Default `closeOnSubmitted` to `true`; close only after core Form emits
  `submitted`.
- Forward `submitted`, `error`, `reset`, draft `update:modelValue`, and Dialog
  `open`/`close` events.
- Default labels: `Cancel`, `Save`, `Saving…`. Props and `actions` slot may
  override them.
- Treat canonical `disabled` as shared surface state: pass it to both Dialog and
  Form so disabled callers cannot open or submit.
- Disable standard actions while Form submits/validates or a `beforeClose`
  Promise is pending. Ignore UI dismissal while submitting/validating.
- Route Cancel and Dialog-originated close requests through `beforeClose`.
  Callback receives reason plus current exposed Form state. Close only when it
  is absent or resolves `true`; remain open on `false` or rejection. Emit
  submission errors through Form's existing `error` event; do not toast twice.
- Programmatic parent writes to `v-model:open` remain authoritative. Guard only
  user-originated Cancel/dismiss requests; document this distinction.
- Forward `trigger`, `title`, and `description` to Dialog. String props provide
  title/description fallback; slots win. Preserve Radix trigger bindings, but
  wrap any slot `setOpen(false)` request through `requestClose`; never leak an
  unguarded UI-close callback.
- Forward Form `loading`, `load-error`, and every `input:<field>` slot unchanged.
- Provide `header` immediately before Form and `footer` immediately after Form
  inside Dialog content.
- Provide an `actions` slot with Form action scope plus `validating` and
  `requestClose`. Default actions stay inside Form so native submit semantics
  remain valid.
- Expose Form's public instance/state plus `requestClose`; do not create a
  second draft, validation, or submission state machine.
- Let base Dialog retain focus trap, Escape/outside-dismiss signaling, and focus
  return. Let core Form retain focus-first-invalid behavior.

Implementation must explicitly solve model-binding presence. Always omit
`modelValue` from the ordinary forwarded prop object, independently detect
whether caller supplied `modelValue` and `onUpdate:modelValue` on `DialogForm`'s
VNode, then forward exactly the bindings present. Do not attach a draft update
listener unconditionally: that would make every submit form appear model-bound.
Forwarding a malformed half-binding lets core Form retain its existing
development warning.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused behavior tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/composites/__tests__/DialogForm.spec.ts src/components/composites/__tests__/TableInput.spec.ts --environment jsdom` | all selected tests pass |
| Public API tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/__tests__/public-api.spec.ts --environment jsdom` | all tests pass |
| Web boundary test | `pnpm --filter @southneuhof/framework-web exec vitest run src/framework/__tests__/legacy-boundary.spec.ts --environment jsdom` | all tests pass |
| Framework typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0, no errors |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | no failures except pre-existing `core/__tests__/table.spec.ts:390` |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0, no errors |
| Web build | `pnpm --filter @southneuhof/framework-web build` | exit 0 |
| Diff validation | `git diff --check` | no output |

Dependencies are already installed. Do not run `pnpm install` or change the
lockfile for this plan.

## Scope

**In scope**:

- `packages/is-vue-framework/src/contracts/components.ts`
- `packages/is-vue-framework/src/components/composites/DialogForm.vue` (create)
- `packages/is-vue-framework/src/components/composites/index.ts` (create)
- `packages/is-vue-framework/src/components/composites/__tests__/DialogForm.spec.ts`
  (create)
- `packages/is-vue-framework/src/components/composites/__type-tests__/dialog-form.type-test.ts`
  (create)
- `packages/is-vue-framework/src/components/composites/form-inputs/TableInput.vue`
- `packages/is-vue-framework/src/components/composites/__tests__/TableInput.spec.ts`
- `packages/is-vue-framework/src/index.ts`
- `packages/is-vue-framework/src/__tests__/public-api.spec.ts`
- `apps/web/src/framework/__tests__/legacy-boundary.spec.ts`
- `packages/is-vue-framework/README.md`
- `docs/architecture/web-application-architecture.md`
- `plans/README.md` status row after implementation

**Out of scope**:

- Legacy `components/composites/Form.vue`, model-config, runtime defaults,
  compatibility props, converters, aliases, or `success` event.
- `components/core/Form.vue`: consume its current public props, events, slots,
  and exposed state without changing Form ownership.
- `components/base/Dialog.vue` or Radix primitives. Triggerless/programmatic-only
  Dialog support is a separate base-component decision.
- Resource-aware create/update inference, mutation invalidation, routing, or
  success toasts. Callers still supply Form props and submission behavior.
- Built-in confirmation UI or nested `ConfirmationDialog`. `beforeClose`
  provides policy hook; caller owns confirmation UX.
- Migrating every existing Dialog/Form occurrence. This plan migrates
  `TableInput` as first contract consumer only.
- Localization framework. Label props provide local override.
- FormView route-leave behavior from plan 026; page navigation and dialog
  dismissal are separate lifecycles.

## Git workflow

- Suggested branch: `codex/055-core-dialog-form`
- Preserve all pre-existing dirty files and unrelated plan 052-054 work.
- One logical commit if requested:
  `feat(framework): add core dialog form composite`
- Do not commit, push, or open a PR unless explicitly requested.

## Steps

### Step 1: Define public generic contract

Add `DialogFormCloseReason`, `DialogFormCloseContext`, and generic
`DialogFormProps` to `contracts/components.ts` using the Target contract above.
Reuse existing `MaybePromise`; do not duplicate async utility types.

Add `components/composites/__type-tests__/dialog-form.type-test.ts`. Follow
`components/composites/__type-tests__/table-input.type-test.ts`:

1. accept submit-bound fields/submit;
2. accept named `open` plus default draft `modelValue` binding together;
3. accept generic submit result and typed `beforeClose`;
4. reject missing `fields`;
5. reject legacy `inputConfig`, `fieldsAlias`, and `success` API assumptions.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework type-check`
→ exit 0 with all `@ts-expect-error` assertions consumed.

### Step 2: Implement DialogForm as orchestration only

Create `components/composites/DialogForm.vue`. Use relative imports for core
Form, base Dialog/Button, and contracts; do not self-import through package
aliases.

Implementation shape:

1. `defineOptions({ inheritAttrs: false })`; send `class` to Dialog panel.
2. Declare `DialogFormProps`, named `defineModel<boolean>('open')`, typed events,
   and Form template ref.
3. Build a Form-only props object that omits DialogForm-only props and always
   omits draft `modelValue`.
4. Detect caller draft model/listener presence from VNode props. Forward each
   binding only when that exact binding was present, and relay model updates
   through DialogForm's typed event. Preserve Form's development warning for
   half-bound models; do not hide or replace it.
5. Handle `submitted` by emitting first, then setting `open = false` only when
   `closeOnSubmitted` is true.
6. Implement serialized async `requestClose(reason)`. Reject UI close while
   submitting, validating, or already checking `beforeClose`; otherwise await
   hook and close only on `true`. Treat hook rejection as refusal and keep dialog
   open; do not emit Form `error` for close-policy failures.
7. Intercept base Dialog's false model updates as `dismiss`; pass true updates
   through. Forward base `open`/`close` events.
8. Render title/description prop fallbacks, reserved DialogForm slots, dynamic
   Form slots, and default Cancel/Save actions per Target contract.
9. Expose Form instance/state and close method without copying state.

Avoid broad `$attrs` forwarding into Form: undeclared DOM/listener attrs could
change the root `<form>` or accidentally create model-binding presence.

**Verify**:
`rg -n "InputConfig|fieldsAlias|beforeSubmit|extraData|components/composites/Form|@success" packages/is-vue-framework/src/components/composites/DialogForm.vue`
→ no matches.

### Step 3: Lock lifecycle, forwarding, and model separation

Create `components/composites/__tests__/DialogForm.spec.ts`. Use real core Form
through `mountCore`; mock only base Dialog with a small controlled component,
following `LookupInput.spec.ts:5-18`. Mock must expose trigger, content,
title/description, and a dismiss action that emits `update:modelValue: false`.

Cover:

1. trigger/title/description/header/footer and `input:<field>` forwarding;
2. default Cancel/Save labels and custom label props;
3. successful validated submit emits `submitted` and closes once;
4. validation failure and rejected submit keep dialog open; rejection emits one
   normalized `error`;
5. `closeOnSubmitted=false` preserves open state after success;
6. Cancel and dismiss both call `beforeClose` with correct reason and current
   dirty/pending state; false/rejection keeps open, true closes;
7. repeated close requests while hook is pending call hook once;
8. submit/validate pending state disables actions and refuses dismissal;
9. submit-bound usage remains submit-bound when no draft `v-model` exists;
10. explicit undefined draft `v-model` remains model-bound while named
    `v-model:open` remains independent;
11. custom `actions` receives submit/reset/dirty/submitting/validating and
    guarded `requestClose`;
12. exposed submit/reset/dirty state is live and delegates to core Form.

Assert events and observable state, not internal function names or full Tailwind
class strings.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/composites/__tests__/DialogForm.spec.ts --environment jsdom`
→ all new cases pass.

### Step 4: Publish new composite without reopening legacy API

Create `components/composites/index.ts` exporting only new `DialogForm` initially.
Export it from package root `src/index.ts`; `DialogFormProps` and close types
already flow through `export type * from './contracts'`.

Update `src/__tests__/public-api.spec.ts`:

- add `DialogForm` to current root exports;
- remove new path from deleted-path assertion;
- add a source-boundary assertion that new file imports core Form/base Dialog
  and contains none of the legacy identifiers from Step 2.

Update app `legacy-boundary.spec.ts`:

- remove only `components/composites/DialogForm.vue` from forbidden imports;
- retain `components/composites/Form.vue`, model-config paths, `inputConfig`,
  `fieldsAlias`, and all other retired identifiers.

This makes future app use legal without weakening clean-break protection.

**Verify**: public API and web boundary commands from Commands table
→ all pass.

### Step 5: Migrate TableInput's create and edit dialogs

Replace direct Form/Dialog imports and both duplicated template blocks with
`DialogForm`.

- Keep `fields`, `form`, initial row cloning, create/replace operations,
  `validation:touch`, disabled behavior, custom create trigger, and all Table
  behavior unchanged.
- Supply `cancelLabel="Batal"` and `submitLabel="Simpan"` to preserve current
  TableInput copy until localization policy changes.
- Let `DialogForm` close after `createRow`/`replaceRow` returns. Remove manual
  `setOpen(false)` and duplicated pending action markup.
- Do not route row deletion through DialogForm; `ConfirmationDialog` remains
  correct for destructive actions.

Update `TableInput.spec.ts` migration-boundary assertions:

- require core Table plus new DialogForm;
- reject direct core Form/base Dialog composition inside TableInput;
- require both create/replace submit handlers;
- reject `setOpen(false)` and legacy identifiers;
- retain existing row-state, slot, disabled, reorder, and validation assertions.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/composites/__tests__/DialogForm.spec.ts src/components/composites/__tests__/TableInput.spec.ts --environment jsdom`
→ both suites pass.

### Step 6: Document name reuse and migration boundary

Update package README with a compact canonical example:

```vue
<DialogForm
  v-model:open="open"
  :fields="fields"
  :submit="resource.capabilities.create"
  title="Create record"
  @submitted="handleSubmitted"
>
  <template #trigger="{ setOpen }">...</template>
</DialogForm>
```

Also show or state that default `v-model` is Form draft data while
`v-model:open` controls Dialog. Document `closeOnSubmitted`, `beforeClose`,
default actions, slots, and programmatic-close authority.

Change existing clean-break prose in package README and architecture doc to:
legacy **config-driven** DialogForm was removed; Framework 2.0 now has a
core-native, resource-agnostic composite with no compatibility API. Do not imply
legacy Form/Table/Detail/Tree returned.

**Verify**:
`rg -n "DialogForm" packages/is-vue-framework/README.md docs/architecture/web-application-architecture.md`
→ both documents distinguish deleted legacy API from new composite.

### Step 7: Run gates and refresh graph

Run focused tests first, then framework tests/typecheck and web boundary,
typecheck, and build. Full framework tests may retain only the documented
pre-existing `table.spec.ts:390` failure. Review package output manually with
one create and one edit TableInput dialog:

- trigger receives focus back after Cancel and successful Save;
- invalid Save stays open and focuses first invalid field;
- pending Save cannot double-submit or dismiss;
- successful create/edit closes once and updates rows once;
- Cancel does not mutate row data.

**Verify**:

```sh
pnpm --filter @southneuhof/is-vue-framework test
pnpm --filter @southneuhof/is-vue-framework type-check
pnpm --filter @southneuhof/framework-web exec vitest run src/framework/__tests__/legacy-boundary.spec.ts --environment jsdom
pnpm --filter @southneuhof/framework-web type-check
pnpm --filter @southneuhof/framework-web build
git diff --check
```

Expected: every command except full framework tests exits 0; full framework
tests have no failure besides documented `table.spec.ts:390`; diff check has no
output; graph update completes.

## Test plan

- New DialogForm behavior suite proves canonical Form validation/submission
  controls closure, not button timing.
- Model-separation tests prevent named open model from corrupting Form's
  binding-presence mode switch.
- Close-policy tests cover Cancel, dismiss, dirty state, async approval,
  rejection, concurrency, and pending submission.
- Slot/event/expose tests lock composition without duplicating Form internals.
- Type test locks generic FormProps compatibility and legacy API rejection.
- TableInput tests prove first consumer removes duplicated lifecycle while
  preserving row mutations, slots, disabled mode, and reorder rules.
- Public API and app boundary tests distinguish new component from retired
  model-config component.
- Manual Radix check covers focus trap/return and actual overlay dismissal,
  which mocked jsdom tests cannot prove.

## Done criteria

- [ ] `DialogForm` wraps only base Dialog and core Form.
- [ ] Named `v-model:open` and optional default draft `v-model` work together.
- [ ] Successful submit closes by default; invalid/rejected submit stays open.
- [ ] Cancel/dismiss use serialized optional `beforeClose`; pending form cannot
  dismiss.
- [ ] Standard actions, labels, slots, events, and exposed Form state work.
- [ ] No legacy prop, event, model-config, CRUD, or compatibility API returns.
- [ ] DialogForm and its public types export from package root.
- [ ] TableInput uses DialogForm for create/edit with no manual close wiring.
- [ ] Public/API legacy guards and docs distinguish new and old components.
- [ ] Focused tests, framework/web typechecks, web boundary test, web build, and
  `git diff --check` pass; full framework tests add no failure beyond documented
  `table.spec.ts:390`.
- [ ] Manual create/edit Dialog checks pass.
- [ ] No files outside Scope changed except pre-existing dirty files.
- [ ] `plans/README.md` row 055 marked DONE only after implementation review.

## STOP conditions

- Live core Form no longer emits `submitted` only after resolved submission.
- Forwarding flat props cannot preserve submit-bound versus model-bound
  detection without changing core Form's public contract.
- Correct dismiss interception requires changing base Dialog or Radix
  primitives. Report required base API separately.
- Triggerless/programmatic-only dialogs become a hard first-consumer
  requirement; base Dialog currently always renders DialogTrigger.
- `beforeClose` needs built-in confirmation UI or app/router ownership to serve
  TableInput; do not silently add policy or nested dialogs.
- TableInput migration changes row payload, validation timing, or disabled
  behavior rather than only composition.
- Existing uncommitted Form/plan work conflicts with any planned edit.
- Any focused verification fails twice after a reasonable in-scope fix, or full
  framework tests add a failure beyond documented `table.spec.ts:390`.

## Maintenance notes

- Reviewer should scrutinize binding-presence forwarding first. An always-bound
  update listener silently changes every submit Form into model-bound operation.
- Close-after-submit must stay attached to Form's `submitted` event. Never move
  it to click, native submit, or start of async handler.
- Parent writes to `v-model:open` are authoritative and bypass `beforeClose`;
  UI Cancel/dismiss requests are guarded. Keep docs explicit.
- Future Form slot/event additions require deliberate forwarding tests here.
- Future triggerless Dialog support belongs in base Dialog, then DialogForm can
  consume it without embedding an invisible trigger.
- Add resource-aware convenience only in a separate view/shell. DialogForm
  remains canonical Form props plus dialog lifecycle.

## Execution result

Status: COMPLETE — reviewed and approved.

- Added the core-native, resource-agnostic `DialogForm`, public contracts, root
  exports, behavior tests, and type-level contract coverage.
- Migrated TableInput create/edit flows to DialogForm. Real Radix testing found
  that Vue proxy rows can reject `structuredClone`; cloning now falls back to
  JSON serialization without changing row payload behavior.
- Updated public API, legacy-boundary, package, and architecture documentation.
- Verified framework type-check, 26 focused component/API tests, 3 web boundary
  tests, and `git diff --check`.
- Manually verified create, edit, cancel, successful submit, accessible dialog
  naming, and trigger focus return in the real web app.
- Full framework tests add no regression: 332 pass and only the documented,
  pre-existing `src/components/core/__tests__/table.spec.ts:390` assertion
  fails.
- Web type-check/build remain blocked by the pre-existing
  `src/configs/defaults.spec.ts:10` reference to missing `status.table`; this
  change does not touch that configuration.
- Type coverage uses the exported generic `DialogFormProps` contract directly
  because Vue's generated `InstanceType` does not retain imported generic SFC
  props precisely enough for this assertion.
