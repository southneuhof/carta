# Plan 062: Integrate web file inputs with S3/MinIO storage

> **Implementation instructions:** Execute this plan as one end-to-end storage
> contract. Keep S3 credentials in the API. Keep upload, display URL, and file
> manager mapping in the app adapter layer. Do not send file bytes through the
> API. Do not add a database file table in this proof.
>
> **Drift check (run first):**
> `git diff --stat ebca46c..HEAD -- apps/api/src/storage/s3.ts apps/api/src/routes/files/files.ts apps/api/src/routes/index.ts apps/api/src/__tests__/files.spec.ts apps/api/README.md apps/web/src/framework/rpc.ts apps/web/src/framework/adapters/storage.ts apps/web/src/framework/adapters/upload.ts apps/web/src/framework/adapters/fileManager.ts apps/web/src/utils/services.ts apps/web/src/utils/__tests__/services.spec.ts apps/web/src/framework/adapters/__tests__/upload.spec.ts apps/web/src/framework/adapters/__tests__/fileManager.spec.ts apps/web/src/framework/adapters/__tests__/storage.spec.ts`

## Status

- **Priority:** P1
- **Effort:** L
- **Risk:** HIGH
- **Depends on:** plans/061-add-s3-presigned-upload-endpoint.md
- **Category:** migration
- **Planned at:** commit `ebca46c`, 2026-08-10
- **Implementation:** COMPLETE — scoped checks pass; full workspace type-check remains blocked by a pre-existing unrelated framework type-test error.

## Why this matters

The API now issues `PUT` URLs at `/files/presigned-url`, but the web app still
calls the retired `presigned-url` and `register-file` flow in
`apps/web/src/utils/services.ts:196-205`. File and image inputs therefore do not
use the new backend. The new upload response also has no stable display URL, so
an uploaded object cannot be safely opened after the short-lived `PUT` URL
expires. This plan makes device uploads, saved file values, image previews, and
the optional File Manager use one authenticated S3/MinIO contract.

## Current state

- `apps/api/src/storage/s3.ts:48-56` only creates a signed `PutObjectCommand`
  URL. The storage client already uses `forcePathStyle: true`, which supports
  MinIO.
- `apps/api/src/routes/files/files.ts:20-39` exposes only authenticated
  `POST /files/presigned-url` and returns `key`, `uploadUrl`, `method`, signed
  headers, and `expiresIn`.
- `apps/api/src/routes/index.ts:43-68` registers the upload route directly.
- `apps/web/src/utils/services.ts:148-194` uploads with `fetch` or XHR but does
  not send the signed `Content-Type` header. Its `fileUpload` method at
  `196-205` calls the old endpoint shape and then calls `register-file`.
- `apps/web/src/framework/adapters/upload.ts:9-28` already converts the
  service result to the canonical input asset model used by FileInput and
  ImageInput. `apps/web/src/framework/inputs/registry.ts:41-42` installs this
  adapter for both `file` and `image`.
- `apps/web/src/framework/adapters/fileManager.ts:30-68` is the app-specific
  File Manager provider, but it still uses legacy list, folder, upload, and
  delete endpoint names and uses `/storage/public` as its root.
- `apps/web/src/framework/fields/renderers.ts:35-54` renders a saved asset by
  opening its `url`. The URL must be stable and authenticated, not the signed
  `PUT` URL.
- `apps/web/src/framework/rpc.ts:3-8` already normalizes `VITE_API_URL` for the
  web app. Reuse this central configuration when constructing stable file URLs.
- Existing web tests in
  `apps/web/src/utils/__tests__/services.spec.ts:191-274` assert the retired
  three-request upload flow. Existing adapter tests in
  `apps/web/src/framework/adapters/__tests__/upload.spec.ts` and
  `apps/web/src/framework/adapters/__tests__/fileManager.spec.ts` provide the
  local test patterns.

The current app convention is to keep transport and app-specific mapping out
of framework package components. Framework inputs receive an `UploadOperation`
from `apps/web/src/framework/inputs/registry.ts`; they do not know the API
response shape. Keep that boundary. Do not change `packages/is-vue-framework`.

## Target contract

Use these API routes:

```text
POST   /files/presigned-url   authenticated JSON metadata -> signed PUT data
GET    /files                 authenticated S3 object listing under a prefix
GET    /files/object?key=...  authenticated stable redirect to a signed GET URL
DELETE /files/object          authenticated JSON `{ key }`
```

The upload response must add a stable `downloadUrl` next to the existing
`uploadUrl`. The stable URL points to the API `GET /files/object` route. It is
safe to persist in the current asset model because the API creates a new short-
lived S3 `GET` signature for each request.

The app storage adapter result is:

```ts
{ key: string, url: string, file: File }
```

`key` is the server-generated S3 object key. `url` is the stable
API download URL. The directory argument remains only because the framework
upload contract supplies a destination; the backend owns the `uploads/`
namespace in this proof.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| API focused tests | `pnpm --filter @southneuhof/api test -- src/__tests__/files.spec.ts` | all file route tests pass |
| Web focused tests | `pnpm --filter @southneuhof/framework-web test -- src/framework/adapters/__tests__/storage.spec.ts src/framework/adapters/__tests__/upload.spec.ts src/framework/adapters/__tests__/fileManager.spec.ts src/utils/__tests__/services.spec.ts` | all selected web tests pass |
| API typecheck | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Workspace typecheck | `pnpm type-check` | all selected packages pass |
| Workspace lint | `pnpm lint` | exit 0; existing web warnings may remain |
| Diff check | `git diff --check` | no output |
| S3 smoke | existing API env plus a small authenticated request, direct `PUT`, stable `GET`, and cleanup | upload and display redirect work; no secret or signed URL is printed |

## Scope

**In scope (the only files this plan may modify):**

- `apps/api/src/storage/s3.ts`
- `apps/api/src/routes/files/files.ts`
- `apps/api/src/routes/index.ts`
- `apps/api/src/__tests__/files.spec.ts`
- `apps/api/README.md`
- `apps/web/src/framework/rpc.ts`
- `apps/web/src/framework/adapters/storage.ts` (create)
- `apps/web/src/framework/adapters/upload.ts`
- `apps/web/src/framework/adapters/fileManager.ts`
- `apps/web/src/utils/services.ts`
- `apps/web/src/utils/__tests__/services.spec.ts`
- `apps/web/src/framework/adapters/__tests__/upload.spec.ts`
- `apps/web/src/framework/adapters/__tests__/fileManager.spec.ts`
- `apps/web/src/framework/adapters/__tests__/storage.spec.ts`
- `plans/README.md`

**Out of scope:**

- `packages/is-vue-framework/**`; its upload and display contracts already
  provide the required seams.
- `apps/web/src/routes/**` and frontend page components; the central input
  registry already injects the adapter into FileInput and ImageInput.
- Database tables or file metadata ownership; the API has no file metadata
  model in this proof.
- Public buckets, public object URLs, multipart upload, virus scanning, image
  transforms, thumbnails, and download authorization beyond the authenticated
  route.
- `apps/base-mobile/**`; it has a separate transport implementation.
- `.env` and `.env.example` files; do not print or alter credentials.

## Steps

### Step 1: Extend the API storage contract

Update `apps/api/src/storage/s3.ts` to add the minimum native S3 operations:

- `createPresignedDownload(key)` using `GetObjectCommand` and the existing
  15-minute expiry;
- `listObjects(prefix)` using `ListObjectsV2Command` with `Delimiter: '/'`;
- `deleteObject(key)` using `DeleteObjectCommand`.

Keep lazy environment loading, path-style addressing, and the existing endpoint
protocol validation. Do not expose the S3 client or credentials to route code.

**Verify:** `pnpm --filter @southneuhof/api type-check` → exit 0.

### Step 2: Add authenticated listing, stable display, and delete routes

Update `apps/api/src/routes/files/files.ts`:

- keep the current upload validation and server-generated `uploads/<uuid>.<ext>`
  keys;
- add `downloadUrl` to the upload response using the request origin and the
  stable object route;
- add authenticated `GET /files` with a validated `prefix` defaulting to
  `uploads/`; map common prefixes to folders and object contents to file
  records with `id`, `parentId`, `kind`, `name`, `size`, `updatedAt`, and
  `url`;
- add authenticated `GET /files/object` with a validated `key`, then redirect
  to the short-lived signed S3 `GET` URL;
- add authenticated `DELETE /files/object` with a validated JSON `key`.

Accept only keys and prefixes in the server-owned `uploads/` namespace. Do not
use a request key as a filesystem path. For list MIME data, infer common image
types from the stored extension only; add `HeadObject` metadata reads later if
exact MIME filtering becomes a product requirement.

**Verify:** `pnpm --filter @southneuhof/api test -- src/__tests__/files.spec.ts` →
authenticated upload, list, redirect, delete, validation, and hidden-error
tests pass.

### Step 3: Create the web S3 adapter and remove the retired service flow

Update `apps/web/src/framework/rpc.ts` to export the normalized `apiUrl` so
the app adapter can build stable same-origin or configured-API file URLs.

Create `apps/web/src/framework/adapters/storage.ts` as the only web file
transport module. Use the typed `rpc` client for the authenticated API control
calls. Use `fetch` or XHR only for the signed MinIO `PUT`.

The adapter must:

- send `filename`, `contentType` (fallback `application/octet-stream`), and
  `size` to `rpc.files['presigned-url'].$post`;
- read and validate the nested `data` response, including `key`, `uploadUrl`,
  `downloadUrl`, and signed headers;
- send the signed headers during the direct `PUT` in both fetch and XHR paths;
- pass the `AbortSignal` to the API request and direct fetch, and cancel XHR
  when the signal aborts;
- expose small `uploadFile`, `listFiles`, `deleteFile`, and `fileUrl` functions
  for the app adapters;
- keep API error text bounded and do not expose credentials or signed URLs in
  thrown messages.

Update `apps/web/src/framework/adapters/upload.ts` to use this adapter and
  return the same canonical `{ path, url, file }` result. Remove the retired
`fileUpload`, `upload`, and private presigned upload methods from
`apps/web/src/utils/services.ts`, and remove their old three-request tests. The
new file integration must not import or call `services`.

**Verify:** focused web adapter and service tests pass, including direct `PUT`
headers, progress, abort/error behavior, and the canonical `{ path, url }`
model.

### Step 4: Rewire the app File Manager adapter

Update `apps/web/src/framework/adapters/fileManager.ts`:

- set `root` to `uploads/`;
- list with the new `files` prefix query and map the response through
  `canonicalAsset`;
- reuse `storage.uploadFile` for direct upload;
- remove the unsupported legacy folder-create operation;
- delete with `storage.deleteFile(asset.id)`;
- use the stable API URL when `previewUrl` is absent.

Keep the canonical `ManagedAsset` shape and `values.toModel` output. Do not add
S3 vocabulary to framework package contracts. Update adapter tests for new keys,
stable URLs, listing, and delete calls.

**Verify:** focused web adapter tests pass and `pnpm --filter @southneuhof/framework-web type-check` exits 0.

### Step 5: Update docs and review the change

Update `apps/api/README.md` to document the new response `downloadUrl`, the
stable authenticated display URL, the list/delete routes, and the browser
requirements for MinIO `PUT` CORS. Keep examples free of real credentials or
signed URL values.

Update this plan's row in `plans/README.md` to `DONE` after the scoped criteria
pass. The full workspace type-check may report unrelated pre-existing user
changes; record that result and preserve those changes.

**Verify:** API/web package type-checks, focused tests, `pnpm lint`, and
`git diff --check` pass. `pnpm type-check` was also run and reports only the
pre-existing framework-package error in
`packages/is-vue-framework/src/components/views/__type-tests__/form-view.type-test.ts:26`.

## Test plan

- Extend `apps/api/src/__tests__/files.spec.ts` with mocked storage tests for:
  unauthenticated access, valid upload response with stable URL, prefix/key
  validation, list mapping, signed redirect, delete, and hidden storage errors.
- Add storage adapter tests for the two-request flow (presign, direct PUT),
  signed `Content-Type`, stable result URL, progress path, and abort/network
  failures. Update `apps/web/src/framework/adapters/__tests__/upload.spec.ts`
  to mock the storage adapter, not `services`.
- Remove the retired upload tests from
  `apps/web/src/utils/__tests__/services.spec.ts` with the deleted service
  methods. Keep unrelated service tests unchanged.
- Extend `apps/web/src/framework/adapters/__tests__/fileManager.spec.ts` to
  cover list mapping and stable value round trips. Add storage adapter tests for
  RPC control calls, signed PUT headers, progress, and stable URLs. Use mocks
  only; do not send
  web tests to MinIO.

## Done criteria

- [x] Authenticated web uploads call the RPC route for
  `POST /files/presigned-url` with the new
  camelCase metadata and upload bytes go directly to MinIO.
- [x] The signed `Content-Type` header is sent on the direct `PUT`.
- [x] File and image input models contain a stable authenticated `url` that
  still works after the 15-minute upload signature expires.
- [x] File Manager list, upload, display, and delete operations use the new
  S3-backed routes; no old `services` upload call or old
  `register-file`, `sync-file`, or `delete-file` call remains in the scoped
  web adapters.
- [x] API focused tests pass, web focused tests pass, API/web package
  typechecks pass, lint exits 0, and `git diff --check` is clean. The workspace
  type-check was run but remains blocked by the unrelated pre-existing
  framework-package error.
- [x] A real MinIO smoke uploads a temporary object, follows the stable display
  route, and removes the object without printing credentials or signed URLs.
- [x] Only files in Scope plus pre-existing user files are modified.
- [x] `plans/README.md` marks Plan 062 as `DONE`.

## Execution verification

- API file-route tests: 7 passed.
- Web focused tests: 186 passed across 37 files; the package test command runs
  the package suite under its current script.
- API and web package type-checks: passed.
- API lint, web lint, workspace lint, and `git diff --check`: passed. Web lint
  reports existing warnings only.
- Workspace type-check: blocked by the pre-existing framework type-test error
  above; no framework package files were changed for this plan.
- Real MinIO smoke: passed for upload, list, stable display, content read, and
  delete; no credentials or signed URLs were printed.

## STOP conditions

Stop and report instead of improvising if:

- the backend route contract or S3 environment differs from the current
  excerpts;
- a stable authenticated display URL cannot work because the deployed browser
  cannot send credentials to the API origin;
- adding list or delete requires a database ownership model rather than the
  current authenticated proof boundary;
- a verification command fails twice after a focused fix;
- any step requires modifying `packages/is-vue-framework/**`, frontend route
  files, environment credentials, or another out-of-scope file.

## Maintenance notes

- Keep S3 credentials and all S3 command construction in the API.
- Review the key and prefix validators when the storage namespace changes.
- The current list MIME mapping is extension-based; use S3 metadata only when
  exact type filtering is required.
- The current API authorizes any signed-in user to read/delete an upload key.
  Add ownership metadata and authorization before using this for multi-tenant
  private files.
- Do not persist the short-lived S3 `uploadUrl` or a short-lived S3 `GET` URL.
  Persist the generated key and stable API URL from the app model.
