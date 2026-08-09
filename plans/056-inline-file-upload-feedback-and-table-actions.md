# Plan 056: Show uploads inline and align TableInput row actions

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If a
> STOP condition occurs, stop and report; do not improvise. Update this plan's
> status row in `plans/README.md` only after implementation and review.
>
> **Drift check (run first)**:
> `git diff --stat 81366a4..HEAD -- packages/is-vue-framework/src/components/inputs/FileInput.vue packages/is-vue-framework/src/components/inputs/useUploadMutation.ts packages/is-vue-framework/src/components/inputs/__tests__/FileInput.spec.ts packages/is-vue-framework/src/components/inputs/__tests__/upload-operations.spec.ts packages/is-vue-framework/src/components/composites/form-inputs/TableInput.vue packages/is-vue-framework/src/components/composites/__tests__/TableInput.spec.ts`
>
> If any in-scope file changed, compare the current code with the excerpts in
> this plan. A materially different upload-state API or row-action contract is
> a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `81366a4`, 2026-07-30

## Why this matters

`FileInput` currently replaces its entire interactive surface with one global
spinner while any upload is pending. A dropped file therefore has no immediate
visible representation, and the one mutation-level progress value cannot
describe several concurrent files. Each accepted file must instead appear at
once in its final position with its own progress fill; only successful uploads
enter the controlled persisted model.

`TableInput` is a core-Table consumer, but its Edit/Delete controls use tonal
warning/error styling and a wider gap. `ListView` is the current framework
standard for row actions: compact, right-aligned icon buttons using the
`standard` variant, with error color reserved for deletion. Matching that
surface makes embedded editable tables visually consistent with list views.

## Current state

- `packages/is-vue-framework/src/components/inputs/FileInput.vue` — controlled
  file input; validates device/drop files, uploads them, converts responses with
  `toModel`, and renders saved values through `FileComponent`.
- `packages/is-vue-framework/src/components/inputs/useUploadMutation.ts` — owns
  abort controllers, aggregate pending count, normalized errors, and only the
  *latest* operation's progress.
- `packages/is-vue-framework/src/components/composites/form-inputs/TableInput.vue`
  — editable table wrapper around core `Table` and `DialogForm`.
- `packages/is-vue-framework/src/components/views/ListView.vue` — canonical row
  action styling to reproduce exactly, not reinterpret.

`FileInput.vue:55-60, 81-103, 173-262` currently derives one
`uploadPercentage` from `mutation.progress`, waits to append a saved item until
the upload resolves, and uses `v-if="!isUploading"` to swap the whole input for
a `Spinner`. This is the loader to remove. `FileComponent.vue:50-85` establishes
the saved-file card shape, but needs a persisted URL for its download/preview
links; do not insert an unpersisted `File` into `items` or `v-model`.

`useUploadMutation.ts:12-32` already invokes the app-provided
`UploadOperation` with `{ destination, signal, onProgress }`. Its existing
`progress` field remains useful for other inputs, but is insufficient for
per-file cards because concurrent progress reports overwrite it.

`TableInput.vue:121-150` currently renders a `gap-2` action group, a
`warning`/`tonal` edit button, and an `error`/`tonal` delete button. The target
pattern is `ListView.vue:445-518`: `flex items-center justify-end gap-1`, icon
buttons with `variant="standard"`, standard edit color, and `color="error"`
only on delete.

Framework conventions to preserve:

- Upload boundary: `docs/architecture/input-data-migration.md:73-105` keeps
  cancellation in components/helpers and backend-response conversion in the
  app's `toModel` callback. Persisted values must remain the strict
  `InputAssetValue` shape from `assetValue.ts:1-24`.
- Button tokens: `components/base/Button.vue:10-14, 143-169` owns variants and
  icon selection; use its props rather than bespoke action CSS.
- Tests use Vitest/jsdom. `components/inputs/__tests__/harness.ts:5-38` mounts a
  controlled input with framework adapters; `components/composites/__tests__/TableInput.spec.ts:62-146`
  mounts the real core table and asserts stable action accessibility labels.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused input tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/inputs/__tests__/FileInput.spec.ts src/components/inputs/__tests__/upload-operations.spec.ts --environment jsdom` | all pass |
| Focused table test | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/composites/__tests__/TableInput.spec.ts --environment jsdom` | all pass |
| Package tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass |
| Typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Diff check | `git diff --check` | no output |

## Scope

**In scope**:

- `packages/is-vue-framework/src/components/inputs/useUploadMutation.ts`
- `packages/is-vue-framework/src/components/inputs/FileInput.vue`
- `packages/is-vue-framework/src/components/inputs/__tests__/FileInput.spec.ts` (create)
- `packages/is-vue-framework/src/components/inputs/__tests__/upload-operations.spec.ts`
- `packages/is-vue-framework/src/components/composites/form-inputs/TableInput.vue`
- `packages/is-vue-framework/src/components/composites/__tests__/TableInput.spec.ts`
- `plans/README.md`

**Out of scope**:

- `ImageInput.vue`, `CameraInput.vue`, and their upload UI. They retain current
  behavior; do not turn this focused FileInput repair into the broader blocked
  plan 045 refactor.
- Persisted asset/model shapes, File Manager selection, retries, resumable
  uploads, and aggregate byte progress.
- Core `Table`, `ListView`, `Button`, and `FileComponent` APIs. This plan only
  consumes their established contracts.
- Any change to when `validation:touch` fires: it still fires only after a
  valid upload produces a persisted model value, or after an explicit delete.

## Git workflow

- Branch: `codex/056-inline-file-upload-feedback`
- Commit: `fix(framework): show file upload progress inline`
- Do not push or open a PR unless requested.

## Steps

### Step 1: Add per-execution progress observation to the shared helper

Extend `useUploadMutation.execute` with an internal optional callback (or
equivalent typed per-call observer) that receives the exact `UploadProgress`
given by that operation's `onProgress`. Preserve all existing behavior:

- create and cancel one `AbortController` per execute call;
- retain aggregate `pending`, `pendingCount`, normalized `error`, and latest
  global `progress` for existing consumers;
- invoke the per-call observer from the same `onProgress` callback that updates
  global progress, so FileInput never owns request transport;
- do not expose a new framework event or alter `UploadOperation`'s public
  `(file, context)` contract.

Update `upload-operations.spec.ts` with two deferred concurrent calls that
report different progress values, proving each caller's observer receives only
its own values while aggregate `pending` remains true until both settle.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/inputs/__tests__/upload-operations.spec.ts --environment jsdom` → all pass.

### Step 2: Represent each accepted FileInput upload as a transient row

In `FileInput.vue`, define a local pending-row type containing a stable local
ID, original `File`, and that file's latest `UploadProgress` (initially absent).
After `validateFileLike` succeeds, add this row synchronously *before* calling
`mutation.execute`. Keep persisted `items` separate: pending rows must not be
emitted through `v-model`, passed to `toInputAssetValue`, or offered download /
preview / delete behavior.

Call the Step 1 observer to update only the matching pending row. On success,
await `toModel`, validate its result with `toInputAssetValue`, then replace the
matching pending row in its visual position with the normalized persisted value
and call the existing `emitChanges` plus `validation:touch`. On failure, remove
only that row and retain the current normalized upload toast behavior. Guard
every completion path against a row already removed by a model synchronization
or unmount; never let an out-of-order completion add a stale value.

For `multi: false`, treat a pending row as occupying the one allowed slot, so a
second selection cannot race in while the first request is unresolved. For
`multi: true`, accept and display all valid dropped files concurrently, keeping
input order stable even when server responses resolve out of order. Existing
external `v-model` watching continues to synchronize persisted `items` only;
it must not erase pending rows.

**Verify**: focused `FileInput.spec.ts` covers immediate pending insertion,
out-of-order multi-file completion, rejected upload removal with no model
update, and single-file admission while pending.

### Step 3: Replace global FileInput loader with inline, tokenized progress cards

Delete `uploadPercentage`, the global pre-list percentage bar, `Spinner`
import/use, and the template branch that hides all file cards and the drop zone
while `isUploading` is true. Keep saved `FileComponent` cards unchanged.

Render pending rows alongside saved files as non-interactive, `relative`,
`overflow-hidden` surface cards. The card's base uses `bg-surface-container`;
its absolutely positioned left-to-right fill uses
`bg-surface-container-high` and a transition on width. For a known positive
`total`, clamp the computed percentage to 0–100 and bind that width. For an
unknown total, render a clearly indeterminate surface fill without claiming a
percentage. Place filename and a compact loading/status label above the fill
with `role="status"` / `aria-live="polite"`; give each row a stable
`data-testid` and local-ID attribute for DOM assertions. Do not restore a
whole-input spinner or a global percentage bar.

Keep device picker/drop zone visible whenever FileInput's cardinality permits
another file: always for multi; for single only when neither persisted nor
pending rows exist. Keep existing drag-highlight, accept, max-size, source
picker, and File Manager behavior unchanged.

**Verify**: new FileInput DOM tests observe a filename and progress card before
the upload promise resolves; invoke `onProgress({ loaded: 25, total: 100 })`
and assert its fill reaches 25%; resolve the upload and assert the transient
card disappears, the persisted file card appears, and the model updates once.

### Step 4: Match TableInput actions to ListView

In `TableInput.vue` row-actions slot:

- replace `flex flex-row items-center gap-2` with ListView's
  `flex items-center justify-end gap-1` and `aria-label="Row actions"`;
- change Edit to `kind="icon" variant="standard"` with no `warning` color;
- change Delete to `kind="icon" color="error" variant="standard"`;
- retain `type="button"`, existing accessible labels, icons, DialogForm and
  ConfirmationDialog ownership, disabled suppression, and core Table slot
  payload exactly as they are.

Update the existing TableInput surface/source assertions to check the shared
container class/label and standard variants, while retaining the tests proving
validation-backed edit/create and disabled behavior.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/composites/__tests__/TableInput.spec.ts --environment jsdom` → all pass.

### Step 5: Run package gates and refresh planning index

Run both focused suites, package tests, typecheck, and `git diff --check`.
Confirm no global loader branch remains with:

```sh
rg -n 'uploadPercentage|<Spinner|v-if="!isUploading"' \
  packages/is-vue-framework/src/components/inputs/FileInput.vue
```

Expected: no matches. Update plan 056 to `DONE` in `plans/README.md` only after
all gates pass. Change plan 045's index row to `REJECTED (FileInput portion
superseded by 056; broad Image/Camera refactor not scheduled)` so it is not
mistakenly executed after this focused behavior supersedes its FileInput step.

**Verify**: all commands in "Commands you will need" pass; `git status --short`
lists only files in this plan's scope.

## Test plan

- New `FileInput.spec.ts`, modeled on `components/inputs/__tests__/harness.ts`:
  - accepted single file appears synchronously as one pending status card;
  - known per-file progress fills left-to-right and is clamped;
  - an unresolved single upload blocks a second single-file selection;
  - two multi-file rows keep their own progress and visual order when promises
    complete out of order;
  - failure removes only its pending row and leaves the controlled model
    unchanged;
  - resolution replaces exactly that row with a persisted `FileComponent` card
    and updates the model exactly once.
- Extend `upload-operations.spec.ts` to prove concurrent per-call observer
  isolation without breaking existing cancellation/normalization tests.
- Extend `TableInput.spec.ts` to prove ListView-equivalent action container and
  Button variants without weakening existing accessibility/disabled assertions.

## Done criteria

- [ ] Dropped/selected valid FileInput files appear before upload completion.
- [ ] Each pending file has only its own progressive surface fill; no global
  loader, spinner, or percentage bar remains.
- [ ] Multi-file uploads preserve visual order, isolated progress, and correct
  persisted model updates despite out-of-order completion.
- [ ] Failed uploads disappear without changing `v-model`; successful values
  retain strict `InputAssetValue` validation and existing touch behavior.
- [ ] Single-file mode cannot start a competing upload while its slot is pending.
- [ ] TableInput Edit/Delete use ListView's `standard` action style and compact
  right-aligned action group.
- [ ] Focused tests, package tests, typecheck, and `git diff --check` pass.
- [ ] No files outside the in-scope list are modified.

## STOP conditions

- `useUploadMutation` already has an incompatible per-execution progress API,
  or adding an internal observer would require changing `UploadOperation`'s
  public contract.
- The desired pending visual must be a reusable `FileComponent` API change,
  rather than a FileInput-local transient card.
- Parent `v-model` synchronization destroys a pending row even after persisted
  and transient state are separated; report the observed ownership flow before
  changing external model semantics.
- TableInput requires a core Table/ListView/Button API change to match the
  existing ListView markup.
- The package suite still fails due to an unrelated pre-existing failure;
  record its exact test and proceed only with focused gates after approval.

## Maintenance notes

- Per-file pending state is presentation-only. Keep upload transport,
  cancellation, and normalized errors in `useUploadMutation`; do not create
  FileInput-specific network logic.
- If product later needs cancel/retry per row or aggregate transfer progress,
  extend the helper with stable operation IDs and explicit APIs. Do not infer
  aggregate bytes from the latest progress callback.
- Keep ListView as the row-action reference. Any future shared action component
  should first migrate both consumers together with visual regression coverage.
