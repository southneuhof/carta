# Plan 061: Add an authenticated S3/MinIO presigned upload endpoint

> **Implementation instructions:** Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` after the implementation and review pass.
>
> **Drift check (run first):** `git diff --stat e9a6c3e..HEAD -- apps/api/package.json apps/api/src/storage/s3.ts apps/api/src/routes/files/files.ts apps/api/src/routes/index.ts apps/api/src/__tests__/files.spec.ts apps/api/README.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority:** P1
- **Effort:** M
- **Risk:** MED
- **Depends on:** none
- **Category:** security
- **Planned at:** commit `e9a6c3e`, 2026-08-10

## Why this matters

The API has MinIO/S3 connection settings but no route that issues a direct
upload URL. The backend must authenticate the request, validate the upload
metadata, create a server-owned object key, and sign a short-lived `PUT` URL.
The client can then send file bytes to MinIO without using API bandwidth. This
plan does not persist file metadata or change the web client.

## Current state

- `apps/api/.env.example:6-9` already names `S3_ENDPOINT`, `S3_BUCKET`,
  `S3_ACCESS_KEY`, and `S3_SECRET_KEY`. Do not copy or print their values.
  Keep credentials outside committed example files and rotate any credential
  that was committed with a real value.
- `apps/api/package.json:25-35` has no S3 client or presigner dependency.
- `apps/api/src/routes/index.ts:42-66` registers all top-level routes in one
  `installedRoutes` array. A storage route has no database domain part.
- `apps/api/src/app.ts:11-34` installs that route list and resolves Better Auth
  sessions through `c.req.raw.headers`.
- `apps/api/src/routes/notifications/notifications.routes.ts:27-40` is the
  custom-route exemplar: it uses `defineRoute`, declares `path` and `method`,
  attaches `authenticated()`, and returns `args.c.json(...)`.
- `apps/api/src/routes/notifications/notifications.routes.ts:54-60` shows the
  request-body convention: parse JSON with a Zod schema and let the route
  pipeline return the standard validation error.
- `apps/api/src/__tests__/products.spec.ts:41-48` shows the authenticated app
  request wrapper that forwards a session cookie. Its setup at `:50-212`
  creates the Better Auth tables and signs in a fixture user. Follow this
  pattern for the endpoint integration test; do not contact MinIO in tests.
- `apps/api/package.json:7-11` defines the exact API verification commands:
  `type-check`, `lint`, and the Vitest `test` script. The current baseline
  passed API type-check and lint at the planned commit.
- `apps/api/README.md:5-9` documents that all routes except health and auth
  require a Better Auth session. Add the new endpoint to the environment/API
  notes without changing that security rule.

Relevant current code shapes:

```ts
// apps/api/src/routes/index.ts:42-66
const installedRoutes = [
  healthRoute,
  // auth and model routes...
] as const
```

```ts
// apps/api/src/routes/notifications/notifications.routes.ts:42-50
export const unreadCount = defineRoute({
  path: '/notifications/unread-count',
  method: 'get',
  authorize: [authenticated()],
  action: async (args) => args.c.json({ data: { total: rows.length } }),
})
```

```ts
// apps/api/src/routes/notifications/notifications.routes.ts:54-60
const body = markSeenSchema.parse(await args.c.req.json().catch(() => ({})))
if (body.ids.length === 0) return args.c.json({ data: { updated: 0 } })
```

### Endpoint contract

Add an authenticated route:

```http
POST /files/presigned-url
Content-Type: application/json

{
  "filename": "report.txt",
  "contentType": "text/plain",
  "size": 12
}
```

For valid input, return HTTP 200:

```json
{
  "data": {
    "key": "uploads/<server-generated-uuid>.txt",
    "uploadUrl": "<short-lived S3/MinIO PUT URL>",
    "method": "PUT",
    "headers": { "Content-Type": "text/plain" },
    "expiresIn": 900
  }
}
```

The URL signs only the generated object key and the declared content type.
The route accepts a declared size and rejects values above the fixed 25 MiB
proof limit before signing. Exact object metadata persistence, download URLs,
virus scanning, multipart uploads, and server-side post-upload verification are
future work.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install dependencies | `pnpm install` | exit 0 and the lockfile contains the two AWS SDK packages |
| Focused test | `node --env-file-if-exists=.env ./node_modules/vitest/vitest.mjs run src/__tests__/files.spec.ts --config vitest.config.ts --pool=threads --no-file-parallelism` (from `apps/api`) | all file-route tests pass without a MinIO request |
| API typecheck | `pnpm --filter @southneuhof/api type-check` | exit 0, no TypeScript errors |
| API lint | `pnpm --filter @southneuhof/api lint` | exit 0, no ESLint errors |
| API full tests | `pnpm --filter @southneuhof/api test` | all API tests pass |
| Workspace typecheck | `pnpm type-check` | exit 0 |
| Workspace lint | `pnpm lint` | exit 0 |
| Diff check | `git diff --check` | no output and exit 0 |

## Suggested implementation toolkit

- Use `@aws-sdk/client-s3` with `@aws-sdk/s3-request-presigner`.
  The AWS SDK v3 S3 client supports MinIO through a custom endpoint, and its
  SigV4 presigner avoids hand-written signing code.
- Use `node:crypto` `randomUUID()` for object names. Do not use the submitted
  filename as a path; keep only a safe lower-case extension for convenience.
- Use `forcePathStyle: true` and region `us-east-1` for MinIO. The configured
  `S3_ENDPOINT` must be reachable by the browser that performs the direct PUT.

## Scope

**In scope**

- `apps/api/package.json`
- `pnpm-lock.yaml`
- New `apps/api/src/storage/s3.ts`
- New `apps/api/src/routes/files/files.ts`
- `apps/api/src/routes/index.ts`
- New `apps/api/src/__tests__/files.spec.ts`
- `apps/api/README.md`
- The status row for plan 061 in `plans/README.md`

**Out of scope**

- `apps/web/**` — the user requested a backend-only proof.
- `apps/api/.env.example` — the required variable names already exist, and
  current local edits must not be overwritten.
- Any database entity or migration — this proof does not persist metadata.
- Any change to `packages/sprindle/**` — storage policy belongs to the app,
  as documented in `packages/sprindle/docs/recipes.md:6-15`.
- File downloads, object deletion, multipart uploads, upload completion
  callbacks, virus scanning, quotas, and permission-code changes.
- MinIO server configuration outside this repository.

## Git workflow

- Keep the current user edits untouched. Inspect `git status` before and after
  the work.
- Branch and commit are not required by this plan. Do not push, merge, or
  commit unless the operator separately asks for it.

## Steps

### Step 1: Add the AWS SDK dependencies

Add `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` to the API
runtime dependencies with the package manager. Let pnpm update
`apps/api/package.json` and `pnpm-lock.yaml`; do not hand-edit the lockfile.

**Verify:** `pnpm install` → exit 0; both packages appear under the API
importer in `pnpm-lock.yaml`.

### Step 2: Add lazy S3/MinIO configuration and presigning

Create `apps/api/src/storage/s3.ts` with one small app-owned storage module.

- Read the four existing `S3_*` variables only when the first presign request
  needs them. Throw a clear `<name> is required.` error for a missing value;
  never log values.
- Validate `S3_ENDPOINT` as an absolute URL and configure `S3Client` with that
  endpoint, `forcePathStyle: true`, region `us-east-1`, and the access/secret
  key pair.
- Cache the client after configuration so one API process does not create a
  new client for every request.
- Export one function such as `createPresignedUpload({ key, contentType })`
  that creates a `PutObjectCommand` for the configured bucket and returns a
  15-minute URL from `getSignedUrl`.
- Keep the bucket, client, credentials, and SDK command private to this module.
  The route must receive only the URL and fixed expiry value.

Use a fixed 15-minute TTL and a fixed 25 MiB request ceiling for this proof.
If a comment is needed for the fixed policy, use:
`// ponytail: fixed proof limits; make configurable when product limits vary.`

**Verify:** `pnpm --filter @southneuhof/api type-check` → exit 0, no errors.

### Step 3: Add the authenticated presign route

Create `apps/api/src/routes/files/files.ts` and register its exported route in
`apps/api/src/routes/index.ts`.

- Define a Zod request schema with required `filename`, `contentType`, and
  positive integer `size`; cap the filename at 255 characters, the content
  type at 127 characters, and the size at 25 MiB.
- Reject malformed content types that do not have one non-empty type and one
  non-empty subtype separated by `/`.
- Generate the object key in the route as
  `uploads/<randomUUID>[.<safe-extension>]`. Never concatenate a submitted
  filename or directory into the key. A safe extension is at most 16 ASCII
  alphanumeric characters, lower-cased; omit it when absent.
- Attach `authenticated()` before the action. Do not add a new permission
  because the current requirement is a proof endpoint and no upload permission
  exists in the seeded permission contract.
- Parse the JSON body with the existing `await args.c.req.json().catch(() => ({}))`
  pattern. Let the existing Sprindle error pipeline produce the standard 400
  validation response.
- Call the storage module with the generated key and validated content type.
  Return the exact `data` response in the contract above, including
  `Content-Type` for the direct `PUT` request.
- Do not call MinIO during route registration or API module import. Missing S3
  configuration should fail when the endpoint is used, with a server error;
  it must not make `/health` or test module import fail.

Register the route as a top-level installable only. Do not add a domain part or
database binding.

**Verify:** `pnpm --filter @southneuhof/api type-check` and
`pnpm --filter @southneuhof/api lint` → both exit 0 with no errors.

### Step 4: Add focused route tests

Create `apps/api/src/__tests__/files.spec.ts` using the authenticated request
wrapper and Better Auth fixture setup from `apps/api/src/__tests__/products.spec.ts`.
Mock the storage module's presign function so the tests never need network
access or real S3 credentials.

Cover only the contract risks:

1. An unauthenticated `POST /files/presigned-url` returns 401 and does not call
   the signer.
2. A signed-in user with valid JSON receives the 200 response shape, the
   15-minute expiry, the requested content type, and a key beginning with
   `uploads/`. Assert that the generated key does not contain the submitted
   filename path text.
3. Invalid JSON, missing fields, invalid content type, zero/negative size, and
   a size above 25 MiB return 400 and do not call the signer.
4. A signer failure becomes the existing API 500 path and does not expose
   credentials or SDK internals in the response.

Keep the test setup serial and database-safe, matching the API runbook. Do not
add a second generic auth helper or a fake S3 server for this one route.

**Verify:** `pnpm --filter @southneuhof/api test -- src/__tests__/files.spec.ts` →
all new tests pass.

### Step 5: Document the manual MinIO proof

Add a short section to `apps/api/README.md` that documents:

- the four S3 environment variable names without any secret values;
- `POST /files/presigned-url` request and response fields;
- the direct `PUT` step using the returned `uploadUrl` and returned
  `Content-Type` header;
- that `S3_ENDPOINT` must be reachable by the browser and the MinIO bucket
  CORS policy must allow the API app origin to send `PUT` requests;
- that this proof does not store file metadata or issue download URLs.

Include a `curl` example that signs in with the existing seeded development
user, requests a URL, and uploads a small local file. Use placeholders for the
API URL and file path. Never place credentials or signed URL output in docs.

**Verify:** `git diff --check` → no output and exit 0; the README contains no
literal secret values.

### Step 6: Run the full review gates

Run the focused test, API typecheck, API lint, API full test suite, workspace
typecheck, workspace lint, and diff check from the command table. Review the
diff and confirm every changed file is in Scope. Keep unrelated dirty files
unchanged.

**Verify:** all commands exit 0; only planned files plus the user’s existing
dirty files appear in `git status --short`.

## Test plan

- Follow `apps/api/src/__tests__/products.spec.ts:41-48` for the request wrapper
  and `:50-212` for the authenticated Better Auth fixture.
- Mock only the storage presigner boundary. Do not mock Hono, Better Auth, or
  Zod; the endpoint test must prove route registration and authentication.
- Cover unauthenticated access, valid presigning, all input boundary classes,
  generated-key safety, and signer failure.
- The manual curl proof is the only check that uses the configured MinIO
  server. It verifies that the returned URL can accept a direct `PUT`.

## Done criteria

- [ ] `POST /files/presigned-url` requires a Better Auth session.
- [ ] Valid requests return a 15-minute direct `PUT` URL for the configured
  S3/MinIO bucket.
- [ ] Object keys are server-generated under `uploads/` and do not accept path
  traversal or user-controlled directories.
- [ ] Invalid metadata is rejected before the signer is called; size is capped
  at 25 MiB for this proof.
- [ ] The route does not stream file bytes through the API and does not write
  database rows.
- [ ] Focused API tests, API full tests, API typecheck, API lint, workspace
  typecheck, workspace lint, and `git diff --check` pass.
- [ ] `apps/api/README.md` includes a secret-free manual MinIO proof.
- [ ] `plans/README.md` marks plan 061 DONE only after implementation and diff
  review.

## STOP conditions

Stop and report back if:

- The current route registration or auth contract differs from the excerpts in
  this plan.
- The four existing S3 variables are not sufficient to construct a MinIO S3
  client, or `S3_ENDPOINT` is not browser-reachable and no separate public
  endpoint is available.
- Presigning requires changing `packages/sprindle/**` or the database schema.
- The SDK cannot produce a MinIO-compatible presigned `PUT` without adding
  unrelated dependencies or changing the endpoint contract.
- The existing test database cannot be reset safely without touching tests
  outside this plan.
- A verification command fails twice after a reasonable fix attempt.
- Any file outside Scope must be changed, or a real secret would be written to
  a tracked file.

## Maintenance notes

- Reviewers should check that the client signs the same `Content-Type` header it
  sends to MinIO and that credentials never enter logs or JSON responses.
- The fixed size ceiling is a proof policy, not a complete object-integrity
  control. If uploads become user-facing, add server-side completion/metadata
  persistence and a stronger size/checksum policy before adding retries or
  multipart uploads.
- If the browser cannot reach the same endpoint used by the API signer, add a
  separate public presign endpoint configuration in a later plan; do not expose
  internal MinIO hostnames in a returned URL.
- Keep frontend adapter changes separate. The existing web service has a legacy
  `presigned-url`/`register-file` flow; this plan intentionally does not change
  or preserve that older protocol.
