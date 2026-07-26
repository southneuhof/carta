# Plan 014: Add the authorization seam — identity resolution, 401 vs 403, authenticated-by-default guidance

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 694c905..HEAD -- packages/sprindle/src apps/api/src`
> Changes attributable to plans marked DONE in `plans/README.md` (esp. 013)
> are expected. Any other change: compare "Current state" excerpts against
> live code; on mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (auth gating moves from a path-allowlist middleware to per-installable declarations; a mistake opens or closes endpoints)
- **Depends on**: plans/013-error-contract.md
- **Category**: security
- **Planned at**: commit `694c905`, 2026-07-26

## Why this matters

The framework has an `authorize` hook slot but **no identity concept and no 401**. Any truthy authorize result maps to 403; there is no way to distinguish "who are you" from "you may not". The example app gates sessions with a hand-written middleware holding a hardcoded path allowlist — the exact pattern that rotted in the reference production app into four inconsistent enforcement points. Scope discipline: the framework ships the **seam** (identity in the pipeline, 401/403 semantics, an `authenticated` guard); RBAC, roles, and permission storage remain app-level — decided in the advisor session and consistent with the house rule "Backend authorization remains authoritative" (`plans/README.md`, Deferred work).

## Current state

- Authorize mapping (403 only): `packages/sprindle/src/routes/pipeline.ts:55-62`:
  ```ts
  async function runAuthorize(...) {
    for (const hook of list(pipeline?.authorize)) {
      const result = await hook(args)
      if (result instanceof Response) return result
      if (result) return args.c.json({ error: 'forbidden', issues: normalizeIssues(result) }, 403)
    }
    return undefined
  }
  ```
- Handler args carry no identity — `packages/sprindle/src/model/route-types.ts:16-27`: `{ c, context, route, state }`.
- App-side allowlist middleware — `apps/api/src/app.ts:27-32`:
  ```ts
  .use('*', async (c, next) => {
    if (c.req.path === '/health' || c.req.path.startsWith('/api/auth/')) return next()
    const session = await getAuth().api.getSession({ headers: c.req.raw.headers })
    if (!session) return c.json({ error: 'unauthorized' }, 401)
    await next()
  })
  ```
- Ad-hoc authorize example — `apps/api/src/routes/products/products.model.ts:9`: `authorize: [({ c }) => (c.req.header('x-product-access') === 'denied' ? 'Product access denied.' : undefined)]`.
- `installSprindle(app, installables)` — `packages/sprindle/src/hono/index.ts:116-133`; takes no options today. Models mount via `app.route(installable.path, installable.route)`; top-level routes bind with a minimal context `{ name: installable.path }`.
- `defineModel` builds the per-model context at `packages/sprindle/src/model/define-model.ts:44`: `{ name, entity, pipeline }`.
- `defineRoute` constructs `args` at `packages/sprindle/src/routes/define-route.ts:96-110`.
- Plan 013 provides `unauthorized()` / `forbidden()` HttpError constructors and the envelope.
- App auth: better-auth; `getAuth().api.getSession({ headers })` returns a session-or-null (`apps/api/src/routes/auth/auth.ts`). Public routes today: `/health`, `/api/auth/*`.

## Design (decided — implement as specified)

- `installSprindle(app, installables, options?)` gains `options.identity?: (c: Context) => TIdentity | null | Promise<TIdentity | null>` — the app's one hook for "who is calling". Threaded into every bound context.
- `RouteHandlerArgs` gains `identity: () => Promise<TIdentity | null>` — a **lazy memoized resolver** (per-request), so unauthenticated public routes never pay session lookup and the resolver runs at most once per request. Vocabulary: `identity` — plain English, no new coinage.
- New exported guard from `./routes`: `authenticated()` — an authorize hook `async (args) => { if (!(await args.identity())) throw unauthorized() }`. Apps attach it at model level (`authorize: [authenticated()]`) or route level; its absence = public route. Explicit-per-model beats path allowlists: greppable, colocated, type-checked.
- Pipeline: a thrown `HttpError` from an authorize hook already renders via plan 013's catch — no pipeline change needed beyond confirming hook exceptions reach it (they do: hooks run inside the `try` at `pipeline.ts:14-27`).
- The app deletes the allowlist middleware, sets `identity: (c) => getAuth().api.getSession({ headers: c.req.raw.headers })`, and adds `authenticated()` to every model/route except `/health` and the auth routes.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Framework tests | `pnpm --filter @southneuhof/sprindle test` | all pass |
| Framework types | `pnpm --filter @southneuhof/sprindle type-check` | exit 0 |
| API tests | `pnpm --filter @southneuhof/api test` | all pass |
| API types | `pnpm --filter @southneuhof/api type-check` | exit 0 |

## Scope

**In scope**:
- `packages/sprindle/src/hono/index.ts` (install options, context threading)
- `packages/sprindle/src/model/route-types.ts`, `define-model.ts`, `model-context.ts`, `src/source/model-source.ts` (wherever `ModelRuntimeContext` needs the identity resolver plumbed — follow the existing context flow)
- `packages/sprindle/src/routes/define-route.ts` (args construction), new guard in `src/routes/` (e.g. `authenticated.ts`) + `routes/index.ts` export
- `apps/api/src/app.ts`, `apps/api/src/routes/**` (attach guards)
- Tests in both packages

**Out of scope**:
- Roles, permissions, RBAC helpers, ownership checks — app-level, permanently (recorded decision).
- better-auth configuration.
- Typing `TIdentity` end-to-end through the RPC schema — `identity()` may return `unknown` at the framework layer this round; apps narrow it. Full generic threading is deferred (see Maintenance notes).

## Git workflow

- Branch: `codex/plan-014-authz-seam`
- Commits: `feat(sprindle): add identity resolution and 401 semantics`, `refactor(api): replace path-allowlist auth with authenticated() guards`.

## Steps

### Step 1: Thread identity through install → context → args

Add the `options` parameter to `installSprindle` per Design. Store the resolver on the bound context (extend `ModelRuntimeContext` with an optional internal field; models receive it when mounted — note models are compiled in `defineModel` BEFORE install, so the resolver must be injectable post-hoc: attach it to the context object `installSprindle` already holds via `installable.context`, mutating like `bindDomainDatabase` does for sources — see `apps/api/src/db.ts:21` precedent). In `define-route.ts` args construction, add `identity: memoized resolver bound to c` (resolver absent → resolves `null`).

**Verify**: `pnpm --filter @southneuhof/sprindle type-check` → exit 0; existing tests pass.

### Step 2: Ship `authenticated()`

New file `packages/sprindle/src/routes/authenticated.ts` per Design (throws `unauthorized()` from plan 013). Export from `routes/index.ts`.

**Verify**: unit test — model with `authorize: [authenticated()]`, no identity option → 401 envelope; with identity resolving an object → 200. Model WITHOUT the guard → 200 with no identity configured. Resolver called at most once per request (spy) and zero times on guardless routes.

### Step 3: Migrate the app

In `apps/api/src/app.ts`: delete the allowlist middleware (lines 27-32 excerpt above); pass `{ identity: (c) => getAuth().api.getSession({ headers: c.req.raw.headers }) }` to `installSprindle`. Add `authenticated()` to the model-level `authorize` of `productModel`, `roleModel`, `userModel`, and to the standalone role-permission routes (`apps/api/src/routes/roles/role-permissions.routes.ts`); leave `healthRoute` and `authRoutes.*` unguarded. Keep the existing custom authorize hooks alongside (arrays compose — `mergeHooks` in `define-route.ts:138-142`).

**Verify**: `pnpm --filter @southneuhof/api test` → pass. The products spec already exercises authenticated flows; add: unauthenticated request to `/products/list` → 401 `{ error: 'unauthorized' }`; `/health` without session → 200.

## Test plan

Step 2 unit tests (framework) + Step 3 integration tests (app). The security-critical case list: guardless route stays public; guarded route 401s without identity; guard + custom authorize both run (401 wins before 403 check); resolver memoization.

## Done criteria

- [ ] `grep -n "startsWith('/api/auth/')" apps/api/src/app.ts` → no matches (allowlist gone)
- [ ] Every model in `apps/api/src/routes/**` except health/auth carries `authenticated()` (manual grep: `grep -rn "authenticated()" apps/api/src/routes` ≥ 4 sites)
- [ ] 401 vs 403 distinguished in tests (unauthenticated → 401; `x-product-access: denied` with session → 403)
- [ ] All commands green; no out-of-scope files; `plans/README.md` updated

## STOP conditions

- Plan 013 not yet DONE (this plan throws `unauthorized()` from it).
- Mutating `installable.context` post-compile does not reach bound handlers (i.e. handlers captured a copy, not the reference) — verify with a failing-first test; if contexts are copied anywhere, report rather than restructuring the binding flow.
- Any app route's public/guarded status is ambiguous (not obviously health/auth vs data) — list them and ask, don't guess.

## Maintenance notes

- Future work, explicitly deferred: generic `TIdentity` threading into `RouteHandlerArgs` typing; a `defineModel`-level `public: true` marker if guard-per-model proves noisy; app-level RBAC helpers as a separate optional package.
- Reviewer: diff the set of unguarded endpoints before/after — it must be exactly `{/health, /api/auth/*}`.
- Plan 019 (docs) must document: "routes are public unless `authenticated()` is attached — attach it at model level by default."
