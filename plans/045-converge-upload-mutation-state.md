# Plan 045: Drive upload controls from shared mutation state

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm expected results before continuing. Stop on
> any condition listed below. Update `plans/README.md` only after implementation
> and review.
>
> **Drift check (run first)**:
> `git diff --stat 4169fb0..HEAD -- packages/is-vue-framework/src/components/inputs/useUploadMutation.ts packages/is-vue-framework/src/components/inputs/FileInput.vue packages/is-vue-framework/src/components/inputs/ImageInput.vue packages/is-vue-framework/src/components/inputs/CameraInput.vue packages/is-vue-framework/src/components/inputs/__tests__/upload-operations.spec.ts`
>
> Plan 043 is expected to change the test file. Compare its finalized contracts
> before editing source.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/043-characterize-input-migration-contracts.md`
- **Category**: bug
- **Planned at**: commit `4169fb0`, 2026-07-29

## Why this matters

`useUploadMutation` already owns pending count, progress, normalized error, and
cancellation. File, Image, and Camera inputs still maintain separate legacy
flags and percentages, so progress UI never advances and concurrent uploads can
report idle after only one request settles. One state owner removes these
contradictions while preserving controlled `v-model`.

## Current state

- `useUploadMutation.ts:5-41` exposes `pending`, `pendingCount`, `progress`,
  `error`, `execute`, and `cancel`.
- `FileInput.vue:55-60` declares `uploadPercentage`, `loading`,
  `isUploading`; each upload independently writes `isUploading = false`.
- `ImageInput.vue:74-79` duplicates the same state.
- `CameraInput.vue:95-109` resets a local percentage and toggles a local loading
  flag instead of rendering mutation progress/error.
- `contracts/upload.ts:3-12` defines progress as `{ loaded, total? }`.
- `docs/architecture/input-data-migration.md:71-72` assigns cancellation to
  components and backend conversion to apps.

Concurrency policy: helper `pendingCount` is authoritative. `progress` is the
latest reported operation progress; do not invent aggregate byte totals in this
plan.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/inputs/__tests__/upload-operations.spec.ts --environment jsdom` | all pass |
| Package tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass |
| Typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Diff check | `git diff --check` | no output |

## Scope

**In scope**:

- `packages/is-vue-framework/src/components/inputs/useUploadMutation.ts`
- `packages/is-vue-framework/src/components/inputs/FileInput.vue`
- `packages/is-vue-framework/src/components/inputs/ImageInput.vue`
- `packages/is-vue-framework/src/components/inputs/CameraInput.vue`
- `packages/is-vue-framework/src/components/inputs/__tests__/upload-operations.spec.ts`

**Out of scope**:

- Model-value shape and backend response conversion; plan 046 owns that.
- DrawingCanvas save operation; it has no shared upload mutation today.
- Retry queues, resumable uploads, aggregate multi-file byte progress.
- File Manager plugin internals.

## Git workflow

- Branch: `codex/045-upload-mutation-state`
- Commit: `fix(framework): unify upload mutation state`
- Do not push or open a PR unless requested.

## Steps

### Step 1: Make helper state deterministic under concurrency

Retain one `AbortController` per execute call. Define these invariants in code
comments and tests:

- `pendingCount` increments before operation call and decrements in `finally`;
- `pending` remains true while any operation is unsettled;
- latest `onProgress` value is exposed;
- progress clears only when `pendingCount` reaches zero;
- error clears at start of a new execute and stores normalized rejection;
- cancel aborts active controllers but final count changes only through
  operations settling.

If a synchronous throw can bypass setup/finally, correct it without changing
the public return shape.

**Verify**: focused helper cases from plan 043 pass.

### Step 2: Replace FileInput local upload state

Delete `loading`, `isUploading`, `uploadPercentage`, and unused upload-detail
state where shared mutation state replaces them. Derive:

```ts
const isUploading = mutation.pending
const uploadPercentage = computed(() => {
  const progress = mutation.progress.value
  return progress?.total ? Math.round((progress.loaded / progress.total) * 100) : undefined
})
```

Render determinate percent only when total is known; otherwise render Spinner
and generic uploading text. Promise completion must not manually clear pending.
Use normalized `mutation.error` for user-facing error text without exposing raw
objects.

**Verify**: File progress and two-concurrent-upload tests pass.

### Step 3: Replace ImageInput and CameraInput local upload state

Apply same ownership:

- Image disables new device/drop operations while `mutation.pending`;
- first of two concurrent completions cannot re-enable UI;
- progress display follows latest known total;
- Camera keeps separate camera-permission/capture loading only if semantically
  distinct; upload loading comes from mutation;
- upload failure renders/toasts normalized message consistently;
- unmount cancellation remains helper-owned.

Do not alter capture, drag/reorder, or controlled model semantics.

**Verify**: focused component tests pass; all plan-043 expected failures for
progress/concurrency become normal tests.

### Step 4: Remove dead state and run gates

Run:

```sh
rg -n "uploadDetail|uploadPercentage = ref|isUploading = ref" \
  packages/is-vue-framework/src/components/inputs/{FileInput,ImageInput,CameraInput}.vue
```

Expected: no matches, unless a retained variable has a documented,
non-mutation purpose approved by tests. Then run full package tests/typecheck
and diff check.

## Test plan

Extend plan 043 tests:

- known-total and unknown-total progress;
- two concurrent File uploads finishing out of order;
- Image rejection and subsequent successful retry state reset;
- Camera upload failure distinct from permission failure;
- unmount abort;
- no model update on failure.

## Done criteria

- [ ] Shared helper is sole upload pending/progress/error owner.
- [ ] Progress UI advances for known totals.
- [ ] Unknown total shows indeterminate state.
- [ ] Concurrent upload UI stays busy until every operation settles.
- [ ] Raw rejection values are not rendered.
- [ ] Controlled model behavior remains unchanged.
- [ ] Focused/full tests, typecheck, and diff check pass.
- [ ] `plans/README.md` marks plan 045 DONE.

## STOP conditions

- Plan 043 characterizes a public `update:uploadState` shape that shared state
  cannot preserve without an API decision.
- Backend progress reports incompatible units across concurrent operations.
- Fix requires changing upload result/model shapes.
- Camera capture and upload loading cannot be separated without UI redesign.

## Maintenance notes

Latest-operation progress is deliberate. If aggregate progress is later needed,
track progress per controller/upload ID in `useUploadMutation`; never recreate
per-component mutation state.
