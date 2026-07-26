# Plan 015: Add request ids and a logger seam

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 694c905..HEAD -- packages/sprindle/src apps/api/src`
> Changes attributable to plans marked DONE in `plans/README.md` (esp. 013,
> 014) are expected. Any other change: compare "Current state" excerpts
> against live code; on mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/013-error-contract.md (and 014 if done — it changes `installSprindle` options; compose, don't conflict)
- **Category**: dx
- **Planned at**: commit `694c905`, 2026-07-26

## Why this matters

The framework has zero logging: no logger, no request ids, no correlation. Framework-thrown errors that plan 013's `sprindleOnError` converts to a 500 envelope would vanish without a trace unless logged. The reference production app logged swallowed exceptions at debug level to an unstructured file — undiagnosable in production. Sprindle stays thin: it does not ship a logging framework; it ships a **seam** — a request id per request and an injectable logger the framework's own error path uses. Apps bring pino/console/whatever.

## Current state

- No logger anywhere: `grep -rn "console\.\|logger" packages/sprindle/src` → no matches (after plan 013 there is exactly one `console.error` seam in `sprindleOnError`, marked `// plan 015 replaces this`).
- `installSprindle` — `packages/sprindle/src/hono/index.ts:116-133`; after plan 014 it accepts `options` with `identity`. This plan adds `logger` to the same options object (or introduces the object if 014 hasn't run — the two plans touch the same signature; whichever runs second merges).
- Global error handler (plan 013): `sprindleOnError` in `packages/sprindle/src/hono/index.ts` — currently logs via `console.error`.
- App entry: `apps/api/src/app.ts` builds the Hono app; `apps/api/src/server.ts` starts it.
- Hono provides per-request state via `c.set(key, value)` / `c.get(key)` — idiomatic place for the request id.

## Design (decided — implement as specified)

- Logger contract (structural, minimal): `type Logger = { info(obj: object, msg?: string): void; error(obj: object, msg?: string): void; warn(obj: object, msg?: string): void }` — pino-compatible call shape. Default: a thin console adapter.
- `installSprindle(app, installables, { logger?, identity? })` — logger stored where `sprindleOnError` and route handlers can reach it.
- Exported middleware `requestContext()` from `./hono`: sets `c.set('requestId', crypto.randomUUID())` (honoring an incoming `x-request-id` header if present), sets the response header `x-request-id`. No automatic per-request access log this round (thin; apps can add one from the same middleware in userland) — but `sprindleOnError` logs `{ requestId, method, path, err }` at error level.
- Vocabulary: `logger`, `requestId` — standard terms, zero coinage.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Framework tests | `pnpm --filter @southneuhof/sprindle test` | all pass |
| Framework types | `pnpm --filter @southneuhof/sprindle type-check` | exit 0 |
| API tests | `pnpm --filter @southneuhof/api test` | all pass |

## Scope

**In scope**:
- `packages/sprindle/src/hono/index.ts` (options, `requestContext`, `sprindleOnError` logging)
- `packages/sprindle/src/index.ts` (export `Logger` type)
- `apps/api/src/app.ts` (use `requestContext()`, pass a logger)
- Tests in both packages

**Out of scope**:
- A logging library dependency (none — the default is console).
- Automatic request/access logging, metrics, tracing, OpenTelemetry — deferred.
- Threading `logger` into `RouteHandlerArgs` — apps that want it in handlers read it from their own module; revisit on demand.

## Git workflow

- Branch: `codex/plan-015-request-id-and-logger-seam`
- Commit: `feat(sprindle): add request ids and an injectable logger`

## Steps

### Step 1: `Logger` type + install option + default console adapter

Per Design. `sprindleOnError` switches from bare `console.error` to the injected logger with `{ requestId: c.get('requestId'), method: c.req.method, path: c.req.path, err: String(error) }`.

**Verify**: `pnpm --filter @southneuhof/sprindle type-check` → exit 0.

### Step 2: `requestContext()` middleware

Per Design: honor inbound `x-request-id`, generate `crypto.randomUUID()` otherwise, set context var + response header. Export from `./hono`.

**Verify**: unit test — app with `requestContext()`: response carries `x-request-id`; inbound `x-request-id: abc` is echoed; two requests get distinct ids.

### Step 3: Wire the app + error-log test

`apps/api/src/app.ts`: `.use('*', requestContext())` first in the chain; pass `{ logger }` (console default is fine — pass explicitly to prove the seam). Framework test: route action throws plain `Error` → injected fake logger received one `error` call containing the `requestId` that matches the response header.

**Verify**: full command table green.

## Test plan

Step 2 + Step 3 tests; the regression case is "500s are logged with the same requestId the client saw".

## Done criteria

- [ ] `grep -n "console.error" packages/sprindle/src/hono/index.ts` → only inside the default console adapter
- [ ] Response header `x-request-id` present on api responses (integration test)
- [ ] Fake-logger test proves error logs carry the response's request id
- [ ] All commands green; no out-of-scope files; `plans/README.md` updated

## STOP conditions

- Plan 013 not DONE (no `sprindleOnError` to hook).
- `crypto.randomUUID` unavailable in the supported Node range (it is available in Node ≥19; the engines field says `^20.19 || >=22.12` — if type-check disagrees, report).
- Plan 014 landed with a conflicting options shape — merge into ONE options object; if the shapes genuinely conflict, report.

## Maintenance notes

- Deferred with rationale: access logging (one-liner in userland once this seam exists), metrics/tracing (needs a real operational consumer first).
- Plan 019 documents the seam; plan 017's OpenAPI route should sit after `requestContext()` in examples.
- Reviewer: confirm the middleware is first in the app chain so auth failures also carry request ids.
