# Plan 005: Register files only after confirmed presigned upload completion

> **Executor instructions**: Follow each step and run its verification. Preserve the public adapter signatures. Stop if the storage provider contract cannot be determined from current behavior; do not guess signed headers. Update the plan index when complete unless a reviewer owns it.
>
> **Drift check (run first)**: `git diff --stat b5402b7..HEAD -- apps/web/src/utils/services.ts apps/web/src/utils/__tests__/services.spec.ts apps/web/src/framework/adapters/upload.ts apps/web/src/framework/adapters/fileManager.ts`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/002-characterize-auth-mutation-boundaries.md`
- **Category**: bug
- **Planned at**: commit `b5402b7`, 2026-07-12

## Why this matters

The current presigned upload flow ignores the object-store response and registers the file regardless of whether its bytes were accepted. That can create successful-looking records pointing to absent objects. The method also accepts a progress callback but deliberately discards it, so consumers cannot represent real upload progress.

## Current state

```ts
// apps/web/src/utils/services.ts:147-152
async fileUpload(file: File, directory: string = '', _onUploadProgress?: (progress: { loaded: number; total: number }) => void, options?: ServiceRequestOptions) {
  const presignResponse = await this.post('presigned-url', { dir: directory, filename: file.name, content_type: file.type }, options)
  const { upload_url, file_path } = presignResponse
  await fetch(upload_url, { method: 'PUT', body: file })
  const register = await this.post('register-file', { path: file_path, size: file.size }, options)
  return { success: true, path: file_path, data: file_path, url: register.url }
}
```

- `apps/web/src/framework/adapters/upload.ts:3-8` and `framework/adapters/fileManager.ts:9-10` pass the optional progress callback through. Preserve those signatures.
- The service's normal `request` helper checks `response.ok`, parses an error, and throws. The presigned PUT bypasses that helper because it targets an object-store URL.
- No code evidence specifies additional signed headers. Do not add `Content-Type` or authorization headers unless the presign response explicitly supplies and documents them.
- Plan 002 creates `apps/web/src/utils/__tests__/services.spec.ts` with fetch and browser-global mocks.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Service tests | `pnpm --filter @southneuhof/framework-web test -- utils/__tests__/services.spec.ts` | all upload cases pass |
| Full tests | `pnpm --filter @southneuhof/framework-web test` | exit 0 |
| Type-check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |

## Scope

**In scope**:

- `apps/web/src/utils/services.ts`
- `apps/web/src/utils/__tests__/services.spec.ts`
- `apps/web/src/framework/adapters/upload.ts` only if a type adjustment is necessary without changing its API
- `apps/web/src/framework/adapters/fileManager.ts` only if a type adjustment is necessary without changing its API

**Out of scope**:

- API presign/register implementations
- Storage bucket policies or CORS configuration
- Multipart/resumable upload support
- No-auth upload behavior, except ensuring it remains unchanged
- New dependencies

## Git workflow

- Suggested branch: `codex/plan-005-checked-presigned-upload`
- Suggested commit, if requested: `fix: verify presigned uploads before registration`
- Do not push or open a pull request unless instructed.

## Steps

### Step 1: Add upload transaction regression tests

Extend `services.spec.ts` with deterministic cases:

1. successful presign, PUT, and registration returns the existing result shape;
2. a non-2xx PUT rejects and never calls `register-file`;
3. a network-level PUT failure rejects and never registers;
4. a registration failure propagates after a successful PUT;
5. when a progress callback is supplied, it receives upload progress with `loaded` and `total` and completes at the file size;
6. when no progress callback is supplied, the existing fetch-compatible path remains usable;
7. `fileUploadNoAuth` remains unchanged.

If using an XMLHttpRequest path for progress, install a small fake XHR in the test rather than adding a library.

**Verify**: service tests -> the non-2xx/progress cases fail against current code for the expected reasons.

### Step 2: Isolate and check the object-store PUT

Add a private helper in `AppServices` for the presigned PUT. For the no-progress path, `fetch` is acceptable but must check `response.ok` and throw a controlled `Error` containing status information without including signed URL query parameters. Never log or surface the full presigned URL.

For a provided progress callback, use `XMLHttpRequest` so `upload` progress events can be observed. Resolve only for a 2xx status; reject on non-2xx, `error`, `abort`, and `timeout`. Do not set additional headers unless a future presign response explicitly returns a signed-header map.

**Verify**: service tests -> PUT success, non-2xx, network failure, and progress cases pass.

### Step 3: Make registration contingent on upload success

Refactor `fileUpload` to await the helper before calling `register-file`. Validate that `upload_url` and `file_path` are nonempty strings before starting the PUT; throw a controlled configuration error otherwise. Preserve the existing success result shape and argument order.

**Verify**: service tests -> registration is never observed after any PUT failure.

### Step 4: Run full verification

**Verify**:

- `pnpm --filter @southneuhof/framework-web test` -> exit 0.
- `pnpm --filter @southneuhof/framework-web type-check` -> exit 0.

## Test plan

Use `File` objects available in jsdom. Assert endpoint bodies for presign and registration, invocation order, error propagation, absence of registration after failed PUT, and progress payloads. Restore `fetch` and `XMLHttpRequest` after every test. Do not include a real presigned URL or credential in fixtures; use inert local example URLs.

## Done criteria

- [ ] Non-2xx and network PUT failures reject.
- [ ] `register-file` is called only after a successful PUT.
- [ ] Progress callbacks receive real XHR upload progress when supplied.
- [ ] No full presigned URL is logged or placed in user-facing errors.
- [ ] Existing adapter signatures and success result shape are unchanged.
- [ ] Focused tests, full tests, and type-check exit 0.
- [ ] No API, bucket configuration, or dependency file is modified.

## STOP conditions

Stop and report if:

- The deployed storage provider requires signed headers not represented by the current presign response.
- Bucket CORS permits fetch PUT but blocks XMLHttpRequest progress uploads.
- Progress support requires a new dependency or API contract change.
- Existing callers rely on registration occurring after a failed object-store PUT.
- A verification command fails twice after a reasonable correction.

## Maintenance notes

Presigned URLs are sensitive bearer-like capabilities even when short-lived; never log them. If multipart uploads are introduced later, replace this helper as one transaction rather than layering multipart behavior onto it. Reviewers should verify that every rejection path prevents registration.

