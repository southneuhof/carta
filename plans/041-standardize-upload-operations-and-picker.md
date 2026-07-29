# Plan 041: Standardize upload operations and optional File Manager picking

> **Implementation instructions:** Uploads are mutations, not loaders. Introduce
> one explicit mutation contract, migrate File/Image/Camera/DrawingCanvas, then
> connect File/Image to optional File Manager provider without eager imports.
> Preserve each input's model shape through explicit normalization/value hooks.
>
> **Drift check (run first):**
> `git diff --stat 7700799..HEAD -- packages/is-vue-framework/src/components/inputs/FileInput.vue packages/is-vue-framework/src/components/inputs/ImageInput.vue packages/is-vue-framework/src/components/inputs/CameraInput.vue packages/is-vue-framework/src/components/inputs/DrawingCanvas.vue packages/is-vue-framework/src/components/inputs/assetValue.ts packages/is-vue-framework/src/runtimeDefaults.ts packages/is-vue-framework/src/file-manager apps/web/src/framework/adapters/upload.ts apps/web/src/framework/adapters/fileManager.ts`

## Status

- **Priority:** P1
- **Effort:** L
- **Risk:** HIGH
- **Depends on:** 039, 040
- **Category:** migration
- **Planned at:** commit `7700799`, 2026-07-29

## Why this matters

Four inputs upload through different runtime capability names, response
assumptions, progress state, and error handling. File/Image also eagerly import
File Manager, making an optional subsystem impossible. Shared operation and
mutation-state conventions remove backend coupling and produce consistent form
validation behavior.

## Target upload contract

Define backend-neutral operation:

```ts
export interface UploadProgress {
  loaded: number
  total?: number
}

export interface UploadContext {
  destination?: string
  signal?: AbortSignal
  onProgress?: (progress: UploadProgress) => void
}

export type UploadOperation<TResult = unknown> =
  (file: Blob, context: UploadContext) => MaybePromise<TResult>
```

File/Image may narrow first argument to `File` through overload/generic if
needed. Response-to-model conversion is explicit:

```ts
toModel(result: TResult): MaybePromise<TModel>
```

Do not make framework understand `{data}`, `{path}`, `{url}`, snake_case, or
presigned upload responses.

## Current state

- `FileInput.vue:3,18,45-46` resolves `fileUpload` through FrameworkRuntime.
- `FileInput.vue:14-15` eagerly imports FileManager/Dialog.
- `FileInput.vue:80-106` manually manages progress/pending and normalizes legacy
  upload response.
- `ImageInput.vue:3,17,65-67` does same plus runtime image URL resolver.
- `CameraInput.vue:4,16,92-107` calls `runtime.upload.fileUpload`, assumes
  `res.data`, and swallows catch.
- `DrawingCanvas.vue:4,27-33` calls `runtime.upload.fileUploadNoAuth`.
- `runtimeDefaults.ts:55-70` chooses between File Manager, FileInput,
  ImageInput, and image URL runtime capabilities.
- `assetValue.spec.ts` documents existing backend-shape normalization.
- Plan 039 provides `useOptionalFileManager`; plan 040 provides canonical picker
  assets and app value adapter.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Upload tests | `pnpm --filter @southneuhof/is-vue-framework test -- src/components/inputs/__tests__/upload-operations.spec.ts src/components/inputs/__tests__/assetValue.spec.ts` | all pass |
| Framework typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass |
| Framework browser tests | `pnpm --filter @southneuhof/is-vue-framework test:browser` | all pass |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | all pass |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Runtime audit | `rg -n "useFrameworkRuntime|missingRuntimeCapability|defaultFileInputUpload|defaultImageInputUpload|runtime\\.upload|runtime\\.fileManager|runtime\\.fileInput|runtime\\.imageInput" packages/is-vue-framework/src/components/inputs/{FileInput,ImageInput,CameraInput,DrawingCanvas}.vue` | no matches |
| Eager import audit | `rg -n "^import .*FileManager" packages/is-vue-framework/src/components/inputs/{FileInput,ImageInput}.vue` | no matches |

## Scope

**In scope**

- Upload contracts under `packages/is-vue-framework/src/contracts/`.
- Optional internal `useUploadMutation.ts`.
- `FileInput.vue`, `ImageInput.vue`, `CameraInput.vue`, `DrawingCanvas.vue`.
- `assetValue.ts` and tests, only to move backend normalization out of framework.
- Component unit/browser tests.
- File Manager optional picker component/helper under `src/file-manager`.
- Web upload/File Manager adapter modules and operation wiring.
- Runtime default helper cleanup for migrated consumers.

**Out of scope**

- Rich-text editor uploads.
- Backend/presigned-upload protocol changes in `services` beyond signal/progress
  plumbing required by explicit operations.
- File Manager UI redesign.
- Automatic deletion of replaced assets.
- Global upload queue/retry service.
- Runtime type deletion until plan 042.

## Git workflow

- Branch: `codex/041-upload-operations`
- Suggested commits:
  1. `feat(framework): standardize upload operations`
  2. `feat(framework): enable optional asset picking`
  3. `refactor(web): wire upload adapters`

## Steps

### Step 1: Add mutation contract and state helper

Create explicit upload types and an internal helper managing:

- pending count or boolean;
- latest/aggregate progress policy documented for multi-file uploads;
- normalized error;
- `AbortController` per upload;
- cleanup on unmount;
- `finally` reset;
- optional cancellation API.

Do not use `useLoader` or query cache for mutations. If upload result changes
File Manager listing, app/picker integration calls provider invalidation after
success.

**Verify:** helper tests cover success, rejection, cancellation, progress with
known/unknown total, concurrent multi-file completion, and unmount.

### Step 2: Characterize existing File/Image model behavior

Lock scalar/multi output, ordering, replacement, deletion, transform,
validation, accept/max-size, image limit, image URL display, and
`validation:touch`/`update:uploadState` emissions. Decide exact public
`uploadState` values from existing behavior tests before refactor.

Move backend-specific response normalization into web `toModel` closures.
Framework fallback may accept already-canonical model only; do not keep broad
snake_case guessing under a new name.

**Verify:** characterization tests pass.

### Step 3: Migrate FileInput

Require explicit `upload` when device upload is enabled. Accept `toModel`.
Replace promise chains with mutation helper. Validate before starting. For
multi-file input, define whether files upload concurrently; preserve current
concurrency unless tests show unsafe state. Touch only after successful model
commit or explicit delete.

Detect optional File Manager provider. Source menu rules:

- no provider: device action only; no File Manager text/dialog/import;
- provider: render lazy picker action;
- no upload operation but provider exists: picker-only input allowed;
- neither upload nor provider: disabled/error configuration state, not hidden
  broken button.

**Verify:** tests cover all four configurations and zero eager manager import.

### Step 4: Migrate ImageInput

Use same upload helper and optional picker. Replace runtime image URL resolver
with explicit display resolver or canonical model fields. Preserve multi order,
drag reorder, replace, max size, limit, and image-only validation. File Manager
selection must reject folders/non-images by canonical `kind/mimeType`, then use
plugin `values.toModel`.

**Verify:** tests cover device upload, picker selection, replace, reorder,
limit, invalid type/size, conversion error, and touch/upload-state emissions.

### Step 5: Migrate CameraInput

Accept explicit upload + converter. Upload captured `File` through shared helper;
do not assume `res.data`. Add camera permission/getUserMedia rejection handling
and safe stream cleanup when refs are absent or component unmounts.

**Verify:** tests cover capture success, upload rejection, camera permission
failure, progress, cancellation, and track stop.

### Step 6: Migrate DrawingCanvas

Keep caller-provided `onSave` if it is already the explicit save operation, but
remove runtime fallback. Prefer a clearly named `save` prop accepting Blob/data
URL according to characterized public behavior. If operation absent, keep
drawing usable but disable Save with an actionable development warning/UI state.

**Verify:** tests cover explicit save success/failure, model commit, pending
state, and no runtime dependency.

### Step 7: Wire web upload/value adapters

Web adapter owns service calls and maps responses to each model shape. Thread
signal/progress through existing service APIs. Reuse File Manager upload
operation where destinations/values truly match, but do not couple ordinary
uploads to File Manager plugin installation.

Update input catalog with local non-network operations. Device/picker controls
must be demonstrable without production writes.

**Verify:** adapter tests assert progress/signal forwarding and response
conversion; full gates pass.

## Test plan

- Shared mutation helper unit tests.
- Mounted tests for four components.
- Optional-provider permutations for File/Image.
- Browser tests for source menus, dialogs, progress, delete/reorder.
- Fake Blob/File and deferred promises; no network/media device.
- Web adapter tests retain existing presigned upload service coverage.

## Done criteria

- [ ] Four inputs have no runtime upload dependency.
- [ ] Mutations do not use `useLoader`.
- [ ] Pending/progress/error/cancel behavior consistent and tested.
- [ ] Backend response mapping lives in web adapter.
- [ ] File/Image picker appears only with plugin.
- [ ] No eager File Manager imports from ordinary inputs/root entry.
- [ ] Model semantics and validation touch preserved.
- [ ] All package/web gates pass.

## STOP conditions

- Existing public model shape cannot be determined from tests/callers.
- File Manager `toModel` output differs from ordinary upload output for same
  field and no field-level adapter is available.
- Cancellation requires changing backend protocol rather than client request
  options.
- Camera/canvas migration requires unrelated media redesign.

## Maintenance notes

Reviewer should inspect every `finally`, multi-upload race, and model conversion.
Future retries belong in mutation helper only after idempotency is known.
FileManagerPlugin is an optional source, never the default upload backend.

