# Plan 052: Move form-level errors to toasts and make required validation explicit

> **Implementation instructions**: Follow each step in order. Run every
> verification command before continuing. If a STOP condition occurs, report it;
> do not improvise. When implementation and review pass, update this plan's row
> in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat a52ea98..HEAD -- packages/is-vue-framework/src/components/core/Form.vue packages/is-vue-framework/src/renderers/form.ts packages/is-vue-framework/src/components/inputs/BaseInput.vue packages/is-vue-framework/src/validation/zod.ts packages/is-vue-framework/src/components/core/__tests__/form.spec.ts packages/is-vue-framework/src/components/inputs/__tests__/base-input.spec.ts packages/is-vue-framework/src/validation/__tests__/validation.spec.ts`
> If an in-scope file changed, compare live code with Current state. Mismatch is
> a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED — changes validation presentation across every core form
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `a52ea98`, 2026-07-29

## Why this matters

Core `Form` currently mounts submission failures and root validation issues
inside form layout. This shifts fields and duplicates application toast UX.
Schema-required fields also lack consistent label metadata, and an omitted
required string exposes Zod's implementation message:
`Invalid input: expected string, received undefined`. After this plan,
form-level failures use `vue-sonner`, required labels show a red `*`, omitted
required values say `Required`, and field-specific errors remain inline.

## Current state

- `packages/is-vue-framework/src/components/core/Form.vue:71-72` owns both
  `issues` and `submitError`.
- `Form.vue:139-143` separates root issues from field issues.
- `Form.vue:208-217` falls back to focusing `#form-errors`.
- `Form.vue:238-256` focuses invalid fields and stores normalized submit errors.
- `Form.vue:285-288` renders `submitError` and `rootIssues` as attached blocks.
- `Form.vue:297` renders plain field labels with no required marker.
- `packages/is-vue-framework/src/validation/zod.ts:39-42` copies Zod messages
  unchanged.
- `zod.ts:57-68` already computes top-level schema-required keys.
- `zod.ts:129-146` infers renderer metadata but deliberately omits requiredness.
- `packages/is-vue-framework/src/components/inputs/BaseInput.vue:46-56` already
  uses `text-error` for an explicit input's required marker and inline error.
  Preserve this convention for standalone input use.
- `packages/is-vue-framework/src/renderers/form.ts:45-73` is the controlled
  `v-model` adapter. It forwards resolved field props to input components.
- `packages/is-vue-framework/src/components/core/__tests__/form.spec.ts:420-436`
  expects a root issue inside `#form-errors`; this is the main behavior test to
  replace.

Requiredness definition: a top-level key returned by `requiredSchemaKeys`.
Only an issue caused by that key's value being `undefined` gets `Required`.
Do not replace custom messages for empty strings, wrong non-undefined types,
refinements, nested paths, or optional fields.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused tests | `pnpm --filter @southneuhof/is-vue-framework test -- src/validation/__tests__/validation.spec.ts src/components/inputs/__tests__/base-input.spec.ts src/components/core/__tests__/form.spec.ts` | exit 0; all selected tests pass |
| Typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0; no errors |
| Package tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0; all package tests pass |

## Scope

**In scope**:

- `packages/is-vue-framework/src/components/core/Form.vue`
- `packages/is-vue-framework/src/renderers/form.ts` only if needed to prevent a
  duplicate marker while retaining native/ARIA required state
- `packages/is-vue-framework/src/components/inputs/BaseInput.vue`
- `packages/is-vue-framework/src/validation/zod.ts`
- `packages/is-vue-framework/src/components/core/__tests__/form.spec.ts`
- `packages/is-vue-framework/src/components/inputs/__tests__/base-input.spec.ts`
- `packages/is-vue-framework/src/validation/__tests__/validation.spec.ts`
- `plans/README.md`

**Out of scope**:

- Loader errors; keep retry UI attached because it is actionable loading state.
- Field-path validation errors; keep them beside fields with existing ARIA links.
- Schema definitions in apps/API.
- Success notifications and route navigation.
- Changing `SubmitError`, `ValidationIssue`, or public field contracts unless
  existing types cannot express the verified implementation.

## Git workflow

- Suggested branch: `codex/052-form-validation-toasts`
- Match current terse commit style; one logical commit.
- Do not push or open a PR unless requested.

## Steps

### Step 1: Normalize omitted required fields at the Zod bridge

In `validation/zod.ts`, retain enough issue metadata to distinguish
undefined/missing input in both supported Zod dialects. During `fromZod`
validation, use the source input plus `requiredSchemaKeys(schema)` to replace
only top-level required-key issues whose submitted value is `undefined` with
`Required`. Preserve paths, issue order, and all other messages.

Add classic Zod and `zod/v4` tests for:

- `{}` against `{ name: z.string() }` gives `[{ path: ['name'], message:
  'Required' }]`;
- optional omitted string produces no issue;
- wrong defined type retains Zod's message;
- custom `.min(1, ...)` message for `''` remains unchanged;
- nested required message remains unchanged unless nested support is explicitly
  added with equivalent tests and no ambiguity.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework test -- src/validation/__tests__/validation.spec.ts`
→ exit 0.

### Step 2: Infer required presentation without overriding explicit props

In `inferFieldLayers`, add `required: true` to the inferred form props for each
non-optional top-level schema key. Optional fields must not receive it.
Preserve merge precedence: project/field/component `props.required` can still
override inferred schema props through existing shallow layer merging.

Update inference tests for classic Zod and `zod/v4`. Existing expected objects
must now include `props: { required: true }` for required fields and omit it for
optional fields.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework test -- src/validation/__tests__/validation.spec.ts`
→ exit 0.

### Step 3: Render one accessible required marker on core labels

In `Form.vue`, derive required state from final resolved/behavior field props,
not directly from raw schema, so override precedence remains authoritative.
Append `<span class="text-error" aria-hidden="true">*</span>` beside required
label text and set `aria-required="true"` on the rendered control/fallback
input. Ensure adapted `BaseInput` components do not render a second marker-only
label when core `Form` already owns the visible label. Preserve standalone
`BaseInput label="..." required` behavior.

Add tests proving:

- required core label has one red `*`;
- optional core label has none;
- control has `aria-required="true"`;
- standalone `BaseInput` keeps its marker;
- required input without its own label does not create an orphan marker.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework test -- src/components/inputs/__tests__/base-input.spec.ts src/components/core/__tests__/form.spec.ts`
→ exit 0.

### Step 4: Replace attached form-level blocks with toast errors

Import `toast` from `vue-sonner` in `Form.vue`.

- On submit validation failure, toast each displayed root-path issue once for
  that submit attempt.
- Keep field-path issues inline and focus the first invalid visible field.
- If no field-path issue exists, do not focus a removed `#form-errors`; retain
  current focus.
- On caught submission failure, toast normalized `SubmitError.message`.
- If normalized submission failure also contains field-path issues, keep those
  inline. Root-path normalized issues must not create attached markup or
  duplicate the normalized message toast.
- Remove `submitError`/`rootIssues` template blocks and dead state/computeds.
- Do not toast on blur validation; only submit attempts and caught submissions.

Mock `vue-sonner` in `form.spec.ts`. Replace the `#form-errors` assertion with
toast assertions. Add regression coverage for field errors remaining inline,
root issues absent from form DOM, and submission failures toasted exactly once.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework test -- src/components/core/__tests__/form.spec.ts`
→ exit 0.

### Step 5: Run package gates

Run typecheck and full package tests. Inspect `git diff --check` and scope.

**Verify**:

- `pnpm --filter @southneuhof/is-vue-framework type-check` → exit 0.
- `pnpm --filter @southneuhof/is-vue-framework test` → exit 0.
- `git diff --check` → no output.

## Test plan

Use existing structural patterns in:

- `validation/__tests__/validation.spec.ts` for both Zod dialects;
- `components/core/__tests__/form.spec.ts` with `mountCore` and `flush`;
- `components/inputs/__tests__/base-input.spec.ts` for standalone labels.

Minimum new regression cases: two dialect required-message tests, one message
preservation test, one required/optional label test, one root-validation toast
test, one submit-error toast test, one field-inline-error test.

## Done criteria

- [ ] No `#form-errors` or inline `submitError` block remains in `Form.vue`.
- [ ] Root submit validation and submit exceptions call `toast.error`.
- [ ] Field-path issues remain inline and ARIA-associated.
- [ ] Required resolved labels show exactly one red `*`.
- [ ] Omitted top-level required strings report `Required` in both Zod dialects.
- [ ] Defined invalid values and custom messages remain unchanged.
- [ ] Focused tests, package typecheck, and package tests exit 0.
- [ ] `git diff --check` has no output.
- [ ] Only in-scope files plus `plans/README.md` changed.

## STOP conditions

- Toast ownership is injected elsewhere and direct `vue-sonner` use would
  bypass a framework adapter.
- Requiredness cannot be derived from final resolved props without changing a
  public field contract.
- Zod dialect metadata cannot reliably identify undefined input; stop rather
  than matching the English error string.
- Existing consumers intentionally require attached root issue slots not
  represented in current tests/contracts.
- Any verification fails twice after a reasonable correction.

## Maintenance notes

Review toast deduplication and accessibility carefully. Future schema dialects
must extend required-message tests before bridge normalization changes. Keep
schema as requiredness source; do not duplicate app field-name maps.

## Execution result

- **Status**: COMPLETE — reviewed and approved
- **Verification**: focused form/validation/input suite passed; included in
  combined 70/70 regression run; framework typecheck passed.
- **Deviation**: full package suite has one pre-existing, out-of-scope Table
  empty-state class failure at `table.spec.ts:390`.
