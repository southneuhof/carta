# Plan 043: Establish behavioral coverage for migrated input contracts

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update this plan's status in
> `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 4169fb0..HEAD -- packages/is-vue-framework/src/components/inputs packages/is-vue-framework/src/query/__tests__/harness.ts`
>
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against live code. Stop on a semantic mismatch.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `4169fb0`, 2026-07-29

## Why this matters

Framework 2.0 replaced wired runtime endpoints with explicit option loaders and
upload operations. Current migration tests prove only that forbidden source
tokens are absent; they do not prove value preservation, cancellation,
progress, error, or controlled `v-model` behavior. This plan creates the
characterization baseline required before plans 044–047 change implementation.

## Current state

- `components/inputs/__tests__/option-source.spec.ts:7-12` reads three source
  files and rejects `getAPI`, `defaultSelectGetData`, and
  `useFrameworkRuntime`; it mounts no component.
- `components/inputs/__tests__/upload-operations.spec.ts:5-9` similarly rejects
  old upload-runtime names without executing an upload.
- `query/__tests__/harness.ts:11-41` provides `withApp`, `flush`, and `deferred`
  helpers with `FrameworkPlugin`; reuse this pattern for injection-dependent
  composables.
- `query/loader.ts:43-45` is the canonical `data XOR load` guard.
- `docs/architecture/input-data-migration.md:29-31` requires option loaders to
  receive `{ searchParameters, signal }`.
- `docs/architecture/input-data-migration.md:65-72` requires upload operations
  to receive destination, signal, and progress; components own cancellation
  and normalized failure state.

Repository conventions:

- Tests use Vitest with jsdom and Vue `createApp`; no network or real media
  devices.
- Controlled inputs expose `modelValue` and `update:modelValue`; tests must
  preserve this deliberate public contract.
- Use deferred promises for loading/concurrency. Do not use arbitrary sleeps.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/inputs/__tests__/option-source.spec.ts src/components/inputs/__tests__/upload-operations.spec.ts --environment jsdom` | all selected tests pass |
| Package tests | `pnpm --filter @southneuhof/is-vue-framework test` | all tests pass |
| Typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0, no errors |
| Diff check | `git diff --check` | no output |

## Scope

**In scope**:

- `packages/is-vue-framework/src/components/inputs/__tests__/harness.ts` (create)
- `packages/is-vue-framework/src/components/inputs/__tests__/option-source.spec.ts`
- `packages/is-vue-framework/src/components/inputs/__tests__/upload-operations.spec.ts`

**Out of scope**:

- Component and composable source files; this plan characterizes only.
- Composite inputs outside `components/inputs`.
- Real HTTP, File Manager backend, camera hardware, and TinyMCE.
- Snapshot tests; assert observable state and operation arguments.

## Git workflow

- Branch: `codex/043-input-characterization`
- Commit: `test(framework): characterize migrated inputs`
- Do not push or open a PR unless explicitly requested.

## Steps

### Step 1: Add one reusable mounted-input harness

Create `components/inputs/__tests__/harness.ts` using Vue `createApp`,
`defineComponent`, `h`, `nextTick`, and `FrameworkPlugin`. It must:

- mount a supplied component with a parent-owned `ref` bound through
  `modelValue`/`onUpdate:modelValue`;
- accept initial model, component props, optional framework adapters, and slots;
- return host, model, app, `setProps`, `flush`, and `cleanup`;
- install a fresh query client or framework plugin state per mount;
- remove DOM and unmount after each test.

Do not copy application configuration or use the legacy composite Form.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/inputs/__tests__/option-source.spec.ts --environment jsdom`
→ existing option-source test still passes and harness compiles.

### Step 2: Replace option source-token checks with behavioral coverage

Keep one boundary assertion for removed wired-runtime names, then add mounted
tests:

- `SelectInput`: static data, scalar pick, `asWhole`, multi selection,
  clear, `defaultToFirst`, external model update, `onSelect`, and
  `validation:touch`.
- `RadioGroupInput`: static data, existing model preservation, default value,
  user selection, loading, empty, error, and retry.
- `CheckboxGroupInput`: existing multi-value model, add, remove, external model
  replacement, and `uniqueIDAs` behavior. Characterize current behavior without
  blessing data loss: mark the preloaded-value interaction case with
  `it.fails` and an exact expected model so plan 044 can turn it green.
- Loader helper through one mounted component: supplying both `data` and
  `load` throws; reactive search parameters reload; old signal aborts; explicit
  namespace dedupes equal calls; unnamed instances remain isolated.

Use records `{ id, name }`. Assert operation arguments and parent model values,
not internal refs.

**Verify**:
focused option test command → all ordinary cases pass and exactly the documented
checkbox regression is represented as an expected failure.

### Step 3: Add upload helper behavior tests

Exercise `useUploadMutation` inside the mounted harness:

- success returns operation result;
- operation receives `Blob`, destination, `AbortSignal`, and progress callback;
- progress updates from `{ loaded, total }`;
- rejection stores normalized error and rethrows original reason;
- two concurrent operations keep `pending` true until both settle;
- `cancel()` aborts every active signal;
- unmount aborts active operations.

Use fake `Blob`, deferred promises, and test adapters. Never call network APIs.

**Verify**:
focused upload test command → helper cases pass.

### Step 4: Characterize four upload components

Add mounted tests for:

- `FileInput`: scalar and multi model commit, `toModel`, destination forwarding,
  validation touch, rejection, delete, and concurrent completion.
- `ImageInput`: scalar/multi commit, limit, replace, reorder, resolver, rejection,
  and validation touch.
- `CameraInput`: stub `navigator.mediaDevices.getUserMedia`, canvas
  `toDataURL`, and tracks; cover success, permission rejection, upload
  rejection, initial value, and unmount cleanup.
- `DrawingCanvas`: stub canvas context; cover explicit `onSave` success/failure,
  model commit, and absent-operation disabled state.

Tests must record current upload-state/progress behavior. Cases exposing missing
progress or early busy-state clearing should use `it.fails` with desired
observable behavior for plan 045.

**Verify**:
focused upload test command → normal cases pass and only explicitly documented
plan-045 regressions are expected failures.

### Step 5: Run full verification

Run package tests, package typecheck, and `git diff --check`. Confirm only three
in-scope test files changed.

## Test plan

This plan is itself the test baseline. Minimum new coverage:

- 12 option-control cases;
- 7 upload-helper cases;
- 4 File, 5 Image, 4 Camera, and 3 DrawingCanvas cases.

Assertions must cover parent-controlled model values and public callbacks/events.

## Done criteria

- [ ] Option and upload tests execute components/composables, not only source regex.
- [ ] Checkbox preloaded-value regression has one exact expected-failure case.
- [ ] Upload progress/concurrency regressions have exact expected-failure cases.
- [ ] No real network, timer sleeps, camera, or filesystem writes occur.
- [ ] Package tests and typecheck pass.
- [ ] `git diff --check` returns no output.
- [ ] No production source files changed.
- [ ] `plans/README.md` marks plan 043 DONE after implementation review.

## STOP conditions

- Existing model semantics cannot be determined from component code plus current
  callers.
- A test requires production source changes to mount a component.
- File Manager behavior cannot be isolated without installing the optional
  plugin; leave that permutation to plan 046 and report.
- More regressions appear than the checkbox/progress/concurrency cases named
  above; record evidence and stop before normalizing expectations.

## Maintenance notes

Keep this suite contract-focused. Internal ref names and markup classes are not
public behavior. Any future option/upload migration must update these tests
before changing model shapes or concurrency policy.
