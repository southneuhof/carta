# Plan 017: Emit OpenAPI from installed models (optional subpath)

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 694c905..HEAD -- packages/sprindle/src apps/api/src`
> Changes attributable to plans marked DONE in `plans/README.md` (esp. 012,
> 013 — envelope and query shapes this plan serializes) are expected. Any
> other change: compare "Current state" excerpts against live code; on
> mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW (purely additive subpath + one app route)
- **Depends on**: plans/012-working-list-queries.md, plans/013-error-contract.md
- **Category**: dx
- **Planned at**: commit `694c905`, 2026-07-26

## Why this matters

Sprindle's client contract is type-inference-only (`hc<AppType>`): perfect for first-party TypeScript clients, invisible to everything else — third-party consumers, API tooling, and non-TS agents get nothing. The entire stack is already Zod, so an OpenAPI document is derivable at runtime from the same metadata the RPC types use: route trees carry `method`/`path`/`kind`, entities carry `create`/`update`/`select` schemas, and envelopes are fixed per kind. This stays optional — a subpath the app may mount; core route definitions do not change (deliberately NOT `@hono/zod-openapi`, which would force rewriting every route).

## Current state

- Runtime metadata available for walking:
  - `DefinedModel` = `{ name, path, route, routes, context }` — `packages/sprindle/src/model/define-model.ts:17-27`; `routes` is the nested `RouteTree` whose leaves are `ModelRoute`s with runtime `method`/`path`/`kind` fields (`route-types.ts:51-64`).
  - Path assembly rule (must be replicated exactly): nested keys become segments — `path = /${[...segments, key].join('/')}${route.path}` (`packages/sprindle/src/model/route-tree.ts:30-31`); models mount under `installable.path` (`hono/index.ts:122`).
  - Entity schemas: `entity.schemas.{create,update,select}` (`model/domain-schema.ts:10-14`); entities are reachable from `model.context.entity`.
- Envelope shapes to serialize (fixed per kind, post-012/013):
  - list → `{ data: Select[], page: number, limit: number, total: number }`; query params `page`, `limit`, `search`, `sort`, `order`, plus free-form equality filter params.
  - detail/create/update → `{ data: Select }`; create body = Create schema, update body = Update schema, `:id` path param.
  - delete → `{ ok: true }`.
  - error → `{ error: string, message?: string, issues?: [{ field?, message }] }` (mirrors `RpcError`, `hono/index.ts:85`) with per-kind statuses (see `ErrorStatus`, `hono/index.ts:87`).
- Zod→JSON Schema: the repo's zod (`^3.25`) ships the `zod/v4` subpath, which provides `z.toJSONSchema(schema)`. App entities already import `zod/v4`; framework schemas in `validation/common-schemas.ts` import `zod` (v3 classic) — those are NOT serialized by this plan (query params are hand-declared), so the split does not block this. Verify `z.toJSONSchema` exists in the installed version before starting.
- Custom routes (`kind: 'custom'`) have no declared output schema — emit them with the path/method and an empty (`{}`) response schema plus a `description` noting "response shape not declared".

## Design (decided — implement as specified)

New subpath `@southneuhof/sprindle/openapi` → `src/openapi/index.ts` exporting:

```ts
generateOpenApi(installables: readonly SprindleInstallable[], info: { title: string; version: string }): OpenApiDocument  // plain object, OpenAPI 3.1
openapiRoute(installables, info): ModelRoute   // GET route returning the document as JSON, built with defineRoute
```

- Walk `installables`: `DefinedModel`s recurse their `routes` tree replicating the route-tree path rule; top-level `ModelRoute`s use their own `path`.
- Canonical kinds get full request/response/error entries per the envelope table above; component schemas per entity from `z.toJSONSchema(entity.schemas.select)` etc., named `<EntityName>`, `<EntityName>Create`, `<EntityName>Update`.
- No new runtime dependency: the document is assembled as plain objects; `z.toJSONSchema` comes from zod already present.
- The app mounts it as a normal top-level route: `openapiRoute(routes, { title: 'API', version: '0.0.0' })` added to the `routes` array in `apps/api/src/routes/index.ts` at path `/openapi.json` — guarded or not per app choice (leave it behind `authenticated()` if plan 014 landed; note in code comment).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Framework tests | `pnpm --filter @southneuhof/sprindle test` | all pass |
| Framework types | `pnpm --filter @southneuhof/sprindle type-check` | exit 0 |
| API tests | `pnpm --filter @southneuhof/api test` | all pass |
| Document validity | `npx --yes @seriousme/openapi-schema-validator <emitted file>` | valid |

## Scope

**In scope**:
- `packages/sprindle/src/openapi/` (create), `package.json` `exports` entry `./openapi`
- `packages/sprindle/src/openapi/__tests__/openapi.spec.ts` (create)
- `apps/api/src/routes/index.ts` (mount the route)
- `apps/api/src/__tests__/` — one integration assertion

**Out of scope**:
- Changing `defineRoute`/`defineModel` signatures (no per-route summary/description metadata this round — deferred).
- Swagger UI serving.
- Declared output schemas for custom routes.

## Git workflow

- Branch: `codex/plan-017-openapi-emission`
- Commit: `feat(sprindle): add openapi generation subpath`

## Steps

### Step 1: Precheck `z.toJSONSchema`

`node -e "import('zod/v4').then(z => console.log(typeof z.z.toJSONSchema))"` from `packages/sprindle` → `function`. If not: STOP.

### Step 2: Implement the walker + document assembly

Per Design. Reuse `isModelRoute` (`model/route-types.ts:66-68`) for leaf detection and mirror `compileRouteTree`'s traversal (`model/route-tree.ts:27-44`) — read that function first; path joining must produce byte-identical paths to what Hono actually serves (convert `:id` → `{id}` for OpenAPI).

**Verify**: unit spec — build the same `items` model used in `install-sprindle.spec.ts` (via plan 016's `createTestEntity` if available), generate, assert: paths `/items/list`, `/items/detail/{id}`, `/items/create`, `/items/update/{id}`, `/items/delete/{id}` present with correct methods; list declares the five reserved query params; create's requestBody references `ItemsCreate`; error responses carry the envelope schema; nested/custom routes appear.

### Step 3: `openapiRoute` + app mount + validity gate

Wrap generation in a `defineRoute` (`method: 'get'`, `path: '/openapi.json'` — top-level routes need a path, enforced at `hono/index.ts:126`). Mount in `apps/api/src/routes/index.ts`. Integration test: request it, 200, `openapi` field starts `3.1`. Write the emitted document to a temp file and run the validator command from the table.

**Verify**: full command table green; validator reports valid.

## Test plan

Step 2 unit spec + Step 3 integration + external validator. Regression case: a route-tree nesting (`gamer/version1`-style, see `apps/api/src/routes/products/products.model.ts:18-23`) appears at the same path Hono serves.

## Done criteria

- [ ] `GET /openapi.json` on the api app → 200, valid OpenAPI 3.1 (validator exit 0)
- [ ] Every canonical route of every installed model appears; spot-check against `app.routes` (Hono's runtime route list) in a test: emitted path set ⊆ served path set
- [ ] No changes to `defineRoute`/`defineModel` public signatures
- [ ] All commands green; no out-of-scope files; `plans/README.md` updated

## STOP conditions

- `z.toJSONSchema` absent from the installed zod (Step 1).
- Entity schemas fail `z.toJSONSchema` conversion (e.g. transforms/lazy cycles) — report which entity/schema; do not hand-write replacement schemas.
- Plans 012/013 not DONE (their shapes are what gets documented; emitting the old lying shapes would be worse than nothing).

## Maintenance notes

- When plan 012's deferred operator filters land, the free-form filter param documentation here must be revisited.
- Deferred: per-route `summary`/`description` metadata on `defineRoute` (one optional field, add when someone needs readable docs); Swagger UI.
- Reviewer: confirm the emitted-⊆-served test exists — it is the drift alarm between generator and router.
