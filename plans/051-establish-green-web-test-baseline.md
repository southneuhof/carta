# Plan 051: Establish a green web-test baseline

> Implementation instructions for an engineer or coding agent. This plan is
> intentionally small: make the existing test deterministic, then verify the
> current application without changing production behavior.

## Status

- Priority: P1
- Effort: S
- Risk: LOW
- Depends on: none
- Category: tests / developer experience
- Planned at: commit `52e002c`, 2026-08-15

## Why this matters

The web unit suite is not green at the audited commit. One test expects an API
URL at `https://api.test`, but the test does not configure `VITE_API_URL`.
`apps/web/src/framework/rpc.ts` therefore exposes an empty API base. In the
jsdom test, `fileUrl()` falls back to `window.location.origin`, which is
`http://localhost:3000`.

This is a test setup defect, not evidence that the storage URL fallback is
wrong. A green baseline is required before adding browser characterization and
before changing the UI primitive dependency.

## Current state

The failing path is:

```text
apps/web/src/framework/inputs/registry.spec.ts
  -> appInputProps.resolve('image')
  -> resolveImagePreviewURLs()
  -> apps/web/src/framework/adapters/storage.ts:fileUrl()
  -> apps/web/src/framework/rpc.ts:apiUrl
```

Relevant code:

- `apps/web/src/framework/rpc.ts:3-6` reads `import.meta.env.VITE_API_URL`.
- `apps/web/src/framework/adapters/storage.ts:157-162` uses the browser
  origin when the API base is empty.
- `apps/web/src/framework/inputs/registry.spec.ts:34-39` expects
  `https://api.test/files/object?...`.
- `apps/web/src/utils/__tests__/services.spec.ts:3-5` already uses the local
  convention `vi.hoisted(() => vi.stubEnv('VITE_API_URL', ...))` before the
  module import.

The audited baseline was:

- web type-check: passed
- web lint: passed with existing warnings
- web build: passed
- framework unit tests: passed
- framework browser tests: passed
- web tests: 58 files passed, 1 file failed; 230 tests passed, 1 failed

## Scope

Modify only:

- `apps/web/src/framework/inputs/registry.spec.ts`

Do not modify `apps/web/src/framework/rpc.ts` or
`apps/web/src/framework/adapters/storage.ts` unless the test setup cannot
override the Vite environment before import. If that happens, stop and report
the reason before changing production fallback behavior.

## Implementation steps

### 1. Set the test API base before the registry import

In `registry.spec.ts`:

1. Import `vi` from `vitest` with the existing test helpers.
2. Add a hoisted environment stub before the static `registry` import:

   ```ts
   vi.hoisted(() => {
     vi.stubEnv('VITE_API_URL', 'https://api.test/')
   })
   ```

3. Keep the existing expected URL unchanged. The test should prove that the
   registry uses the configured API base and URL encoding.

### 2. Run the targeted test

Run:

```sh
pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src/ framework/inputs/registry.spec.ts
```

Expected result: the registry test file passes, including the image preview
URL assertion.

### 3. Run the web verification set

Run:

```sh
pnpm --filter @southneuhof/framework-web type-check
pnpm --filter @southneuhof/framework-web test
pnpm --filter @southneuhof/framework-web lint
pnpm --filter @southneuhof/framework-web build
```

Expected result: every command exits with status 0. Existing lint warnings
may remain; do not clean unrelated warnings in this plan.

## Test plan

The existing registry test is the required regression test. It must verify the
same encoded path and query string as before, with the API base supplied by the
test environment.

No production test or new helper is needed. The existing `vi.hoisted` pattern
is sufficient.

## Done criteria

- `registry.spec.ts` configures `VITE_API_URL` before importing the registry.
- The targeted registry test passes.
- The full web test command passes.
- Web type-check, lint, and build pass.
- No production source file changes are required.

## Stop conditions

Stop before changing production code if:

- the hoisted environment stub does not affect `import.meta.env` during the
  registry module import;
- the failure changes to a URL parsing or storage behavior failure; or
- the fix requires changing the browser-origin fallback.

Report the failing command and observed value, then reassess the test
configuration as a separate plan.

## Maintenance notes

Tests that import modules which read Vite environment values at module load
must set those values with `vi.hoisted` before the import. Do not hard-code a
production fallback only to satisfy a test.
