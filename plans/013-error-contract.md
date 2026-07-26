# Plan 013: Establish a single error contract (HttpError, one envelope, global handlers)

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 694c905..HEAD -- packages/sprindle/src apps/api/src`
> Changes attributable to plans marked DONE in `plans/README.md` (esp. 011,
> 012) are expected. Any other change: compare "Current state" excerpts
> against live code; on mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW–MED (error responses change shape only where they were previously Hono's default 500)
- **Depends on**: plans/010-backend-verification-baseline.md
- **Category**: tech-debt
- **Planned at**: commit `694c905`, 2026-07-26

## Why this matters

Sprindle has no error type and no global handler. Errors are signaled by ad-hoc `{status: 400, code: 'validation_error'}` tags on plain `Error`s, detected by an `isValidationError` helper **duplicated verbatim in two route files**, and anything unhandled falls through to Hono's default plain-text 500. Clients cannot rely on one error shape. The reference production app this framework replaces ended up with **three** incompatible error formats precisely because no contract existed from the start — this plan is the vaccination.

## Current state

- Error tagging: `packages/sprindle/src/source/drizzle-source.ts:277-279`:
  ```ts
  function validationError(message: string): ValidationError {
    return Object.assign(new Error(message), { status: 400 as const, code: 'validation_error' as const })
  }
  ```
  (~15 call sites in that file), and `type ValidationError = Error & { status: 400; code: 'validation_error' }` at `:43`.
- Duplicated detection: `packages/sprindle/src/routes/create.ts:20-22` and `update.ts:25-27`, identical:
  ```ts
  function isValidationError(error: unknown): error is Error & { status: 400 } {
    return Boolean(error && typeof error === 'object' && (error as { status?: unknown }).status === 400)
  }
  ```
  Both used as `if (isValidationError(error)) return c.json({ error: error.message }, error.status)` — note this envelope (`{error: <message text>}`) differs from the pipeline's (`{error: <code>, issues}`).
- Pipeline envelopes: `packages/sprindle/src/routes/pipeline.ts:59` → `c.json({ error: 'forbidden', issues }, 403)`; `:67` → `c.json({ error: 'validation_error', issues }, 400)`; unhandled errors rethrow at `:31`.
- 404s: `detail.ts:15`, `update.ts:16`, `delete.ts:15` → `c.json({ error: 'not_found' }, 404)`.
- No `app.onError` / `app.notFound` anywhere: `grep -rn "onError\|notFound" packages/sprindle/src apps/api/src` → no matches.
- The RPC error type already anticipates the target shape — `packages/sprindle/src/hono/index.ts:85`:
  ```ts
  type RpcError = { error: string; message?: string; issues?: Array<{ field?: string; message: string }> }
  ```
- Framework exports: `packages/sprindle/package.json` `exports` map — `.`, `./hono`, `./model`, `./routes`, `./source`, `./validation`. Root `.` is `src/index.ts`.

## Design (decided — implement as specified)

**One envelope** (already the RPC type): `{ error: <machine code>, message?: <human text>, issues?: [{ field?, message }] }`.

**One class**, exported from the root entry:

```ts
export class HttpError extends Error {
  readonly status: number          // e.g. 400, 401, 403, 404, 409, 422
  readonly code: string            // machine code: 'validation_error', 'not_found', ...
  readonly issues?: Array<{ field?: string; message: string }>
  constructor(status, code, message?, issues?)
}
export function isHttpError(value: unknown): value is HttpError
```

Plus tiny constructors (plain-English names, no new nouns): `validationError(messageOrIssues)` → 400, `unauthorized(message?)` → 401, `forbidden(message?)` → 403, `notFound(message?)` → 404. These live in `packages/sprindle/src/errors.ts`, re-exported from `src/index.ts`.

**Rendering** happens in exactly two places:
1. The pipeline catch (`pipeline.ts:28-32`): after user `error` hooks decline, if `isHttpError(error)` → return the envelope with `error.status`; else rethrow (reaches Hono).
2. A global handler exported from `./hono`: `sprindleOnError(error, c)` for `app.onError` (logs, returns `{ error: 'internal_error' }` 500 — never leaks `error.message` for non-HttpErrors) and `sprindleNotFound(c)` for `app.notFound` (`{ error: 'not_found' }` 404).

Backward-compat note: old `{status: 400}`-tagged errors disappear in the same change (all call sites are in-repo); no compat shim — "clean break, no external consumers" is the house rule (`plans/README.md`).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Framework tests | `pnpm --filter @southneuhof/sprindle test` | all pass |
| Framework types | `pnpm --filter @southneuhof/sprindle type-check` | exit 0 |
| API tests | `pnpm --filter @southneuhof/api test` | all pass |
| Lint | `pnpm --filter @southneuhof/sprindle lint` | exit 0 |

## Scope

**In scope**:
- `packages/sprindle/src/errors.ts` (create), `src/index.ts` (re-export)
- `packages/sprindle/src/routes/pipeline.ts`, `create.ts`, `update.ts`
- `packages/sprindle/src/source/drizzle-source.ts` (swap `validationError` internals to `HttpError`)
- `packages/sprindle/src/hono/index.ts` (add `sprindleOnError`/`sprindleNotFound` exports; RpcError stays)
- `apps/api/src/app.ts` (wire `.onError(...)`/`.notFound(...)`)
- Tests in both packages

**Out of scope**:
- Logger integration beyond `console.error` in `sprindleOnError` — plan 015 injects the real logger; leave a `// plan 015 replaces this` seam.
- Changing the pipeline's authorize/validate hook signatures (they already produce issues; keep mapping them to the envelope as today).
- 401 semantics for identity (plan 014 uses `unauthorized()` from here).

## Git workflow

- Branch: `codex/plan-013-error-contract`
- Commits: `feat(sprindle): add HttpError and error envelope`, `refactor(sprindle): route errors through the contract`, `feat(api): install global error handlers`.

## Steps

### Step 1: Create `errors.ts` and export it

Implement the Design section exactly. `validationError` accepts either a message string or an issues array (it replaces the drizzle-source helper, whose call sites all pass a message).

**Verify**: `pnpm --filter @southneuhof/sprindle type-check` → exit 0.

### Step 2: Swap drizzle-source to `HttpError`

Replace the local `validationError` helper and `ValidationError` type in `drizzle-source.ts` with the imported constructor. No call-site changes needed if the signature matches.

**Verify**: `pnpm --filter @southneuhof/sprindle test` → pass.

### Step 3: Render in the pipeline; delete duplicated helpers

In `pipeline.ts` catch block: after `runError` hooks decline, `if (isHttpError(error)) return args.c.json({ error: error.code, message: error.message || undefined, issues: error.issues }, error.status)`; else rethrow. Then delete `isValidationError` + try/catch from `create.ts` and `update.ts` — thrown `HttpError`s now surface via the pipeline with the standard envelope. Keep the explicit `not_found` early-returns in `detail`/`update`/`delete` (they're responses, not errors) but align their envelope: `{ error: 'not_found' }` already matches.

**Verify**: `pnpm --filter @southneuhof/sprindle test` → pass; `pnpm --filter @southneuhof/api test` → pass. Note: create/update validation failures change from `{ error: '<message text>' }` to `{ error: 'validation_error', message: '<text>' }` — fix test expectations accordingly (this is the point of the plan).

### Step 4: Global handlers + app wiring

Add `sprindleOnError`/`sprindleNotFound` to `packages/sprindle/src/hono/index.ts` per Design. In `apps/api/src/app.ts`, chain `.onError(sprindleOnError).notFound(sprindleNotFound)` on the Hono instance inside `installSprindle(...)`'s first argument.

**Verify**: `pnpm --filter @southneuhof/api test` → pass.

### Step 5: Tests

- Framework (`packages/sprindle/src/model/__tests__/define-model.spec.ts` has the route-through-model test style — add alongside): action throws `notFound()` → 404 envelope; action throws plain `Error` → rethrown (and with a Hono app + `sprindleOnError` → 500 `{ error: 'internal_error' }`, no message leak); `error` hook still wins over contract rendering.
- API (`products.spec.ts`): request an unknown path → 404 envelope; create with duplicate/invalid relation → `validation_error` envelope with `message`.

**Verify**: full command table green.

## Test plan

As Step 5. Regression the plan exists for: non-HttpError must NOT leak its message in the 500 body.

## Done criteria

- [ ] `grep -rn "isValidationError" packages/sprindle/src` → no matches
- [ ] `grep -rn "Object.assign(new Error" packages/sprindle/src` → no matches
- [ ] Unknown route on the api app returns `{ "error": "not_found" }` with 404 (integration test)
- [ ] Plain thrown Error returns `{ "error": "internal_error" }` 500 without the original message (test)
- [ ] All commands green; no out-of-scope files; `plans/README.md` updated

## STOP conditions

- Baseline red before changes.
- The pipeline-rendering change breaks the RPC type inference in `install-sprindle.spec.ts` (`expectTypeOf` assertions) in a way that needs `hono/index.ts` type surgery beyond adding the two handler exports — report with the failing assertion.
- You find external consumers depending on the old `{ error: '<message>' }` create/update shape outside this monorepo (there should be none — "clean break" rule).

## Maintenance notes

- Plan 014 (authz) and plan 015 (logger) build directly on `unauthorized()`/`forbidden()` and `sprindleOnError` respectively.
- Reviewer: hunt for any remaining `c.json({ error: ... }, <status>)` in framework code whose shape deviates from the envelope.
- Deferred: problem+json media type; error-code registry/enum (revisit when codes multiply).
