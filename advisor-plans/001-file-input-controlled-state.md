# Plan 001: Preserve FileInput rows after controlled path updates

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command. Update `advisor-plans/README.md` after the review.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW — the change only affects synchronization of already persisted
  file rows.
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `78ecc99`, 2026-08-20
- **Result**: APPROVE — the controlled path update keeps the completed row.

## Why this matters

The file upload request can finish, but the uploaded file disappears from the
form. The form field writer stores the uploaded asset as its path string. The
`FileInput` watcher treats that valid controlled value as invalid and clears
its local persisted row. The fix must keep the existing asset metadata when the
controlled value contains the same path.

## Current state

- `packages/is-vue-framework/src/components/inputs/FileInput.vue:113-129` —
  controlled model synchronization accepts only canonical asset objects through
  `toInputAssetValue`; it drops path strings and rebuilds rows from the empty
  result.
- `packages/is-vue-framework/src/components/inputs/FileInput.vue:141-150` —
  upload completion replaces the pending row with a canonical asset and emits
  it through `v-model`.
- `packages/is-vue-framework/src/renderers/form.ts:46-74` — the standard
  adapter passes the input value to the form `setValue` callback.
- `packages/is-vue-framework/src/components/core/Form.vue:164-171` — the form
  field writer can convert the asset object to an application write value.
- `apps/web/src/routes/(authenticated)/master-data/incident-statement-document-configs/incident-statement-document-configs.resource.ts:17-20` —
  the file field writes `{ path }` as a path string. This is the concrete
  production path that clears `FileInput` rows.
- `packages/is-vue-framework/src/components/inputs/ImageInput.vue:185-192,207-219` —
  the working image input normalizes string paths before synchronizing its local
  state. Match its state-preserving intent without changing the shared asset
  validator, which deliberately rejects legacy strings.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Framework unit test | `pnpm --filter @southneuhof/is-vue-framework test -- src/components/inputs/__tests__/FileInput.spec.ts` | all FileInput tests pass |
| Framework browser test | `pnpm --filter @southneuhof/is-vue-framework test:browser -- src/components/inputs/__tests__/FileInput.browser.spec.ts` | Chromium browser test passes |
| Framework type check | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0, no errors |

## Scope

**In scope**:

- `packages/is-vue-framework/src/components/inputs/FileInput.vue`
- `packages/is-vue-framework/src/components/inputs/__tests__/FileInput.spec.ts`
- `packages/is-vue-framework/src/components/inputs/__tests__/FileInput.browser.spec.ts`
- `packages/is-vue-framework/vitest.browser.config.ts`
- `advisor-plans/README.md`

**Out of scope**:

- `packages/is-vue-framework/src/components/inputs/assetValue.ts` — keep its
  strict canonical-value contract.
- `packages/is-vue-framework/src/components/inputs/ImageInput.vue` — this is
  the working comparison implementation.
- `apps/web` routes, API upload code, database code, and unrelated worktree
  changes.

## Steps

### Step 1: Add the regression check

Add one focused test for a controlled `FileInput` inside `Form`. Configure the
field writer to store the asset path string, resolve an upload to a canonical
asset, select one file, settle the upload, and assert both conditions:

1. the form model contains the stored path string; and
2. the uploaded file row still renders with its file name.

Use the existing `FileInput.spec.ts` helpers for the unit case. Add one
Chromium browser case in `FileInput.browser.spec.ts` with the same observable
assertions. Add that file to the existing `vitest.browser.config.ts` include
list. Do not test private component state.

**Verify**: the focused unit and browser commands above fail before the fix
because the file row disappears.

### Step 2: Preserve matching asset metadata during synchronization

In `FileInput.vue`, keep the existing persisted asset when a controlled model
item is a string equal to that asset's `path`. Use this fallback only in the
component synchronization path. Keep `toInputAssetValue` for canonical object
validation and keep all pending rows during synchronization.

**Verify**: the focused unit test and focused browser test pass, including the
file name assertion.

### Step 3: Review the focused diff

Read the full diff. Confirm that no API, shared asset contract, or unrelated
worktree file changed. Run the type check and update this plan status to DONE
only if all checks pass.

**Verify**: `git diff --check` exits 0 and `git status --short` shows only the
listed in-scope changes plus the user's pre-existing worktree changes.

## Test plan

- Controlled single-file upload through the form renderer.
- Upload completion emits the path write value without losing the displayed
  file row.
- Existing direct `FileInput` upload tests continue to pass.
- Browser execution uses Chromium and real Vue rendering.

## Done criteria

- [x] The controlled path update does not remove the completed file row.
- [x] `pnpm --filter @southneuhof/is-vue-framework test -- src/components/inputs/__tests__/FileInput.spec.ts` passes.
- [x] `pnpm --filter @southneuhof/is-vue-framework test:browser -- src/components/inputs/__tests__/FileInput.browser.spec.ts` passes.
- [x] `pnpm --filter @southneuhof/is-vue-framework type-check` passes.
- [x] `git diff --check` passes.
- [x] No backend or unrelated worktree files changed.

## STOP conditions

- The form writer does not return a path string in the live reproduction.
- The browser runner cannot start Chromium after one retry.
- The fix needs changes outside the in-scope list.
- Any focused check fails twice after a reasonable focused correction.

## Maintenance notes

The form write contract may return either canonical asset objects or stored path
values. Any future input with local upload rows must preserve display metadata
when a parent form writes a scalar storage value. Do not weaken the shared
`toInputAssetValue` validator unless the whole asset contract changes.
