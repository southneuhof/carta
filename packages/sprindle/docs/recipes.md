# Recipes — things Sprindle deliberately leaves to your app

Sprindle ships request-lifecycle and source-contract correctness plus seams. Policies and formats stay
app-level. Each recipe below is something an app writes once, in plain Hono or plain TypeScript.

## File upload and storage

Why not in core: storage backends, size limits and virus scanning are deployment policy, and every app
needs a different one.

Parse with Hono's `c.req.parseBody()` in a custom route, push the bytes at your storage SDK, and store
the returned key with your entity.

## Background jobs

Why not in core: a job runner is a process-model decision (in-process queue, external worker, cloud
scheduler) that a request framework should not make.

Return from the route first, then hand work to your runner. If a job needs the same write semantics,
call the entity's `source` methods directly — they are plain async functions.

## Caching

Why not in core: cache keys and invalidation are domain knowledge.

Wrap a route with Hono's cache middleware, or memoize inside a `ModelSource` implementation. Invalidate
from an `after` hook on the write routes.

## Rate limiting

Why not in core: limits belong to the edge or gateway in most deployments.

Ordinary Hono middleware on the app, or per route through the `middleware` array.

## Health checks

Why not in core: what "healthy" means is app-specific (DB reachable? queue drained?).

A `defineRoute({ path: '/health', method: 'get', action })` with no `authenticated()` guard — see
`apps/api/src/routes/health/health.ts`.

## CORS and security headers

Why not in core: origins and CSP are deployment configuration.

`hono/cors` and `hono/secure-headers` on the app before `installSprindle` — see
`apps/api/src/app.ts`.

## Audit logging

Why not in core: audit shape is a compliance artifact, not a framework contract.

Use model-level `after` hooks: they see `args` (including `identity()`) and the outgoing response, so a
single hook per model records who changed what.

```ts
defineModel({
  path: '/products',
  entity: product,
  after: [async ({ route, identity, response }) => {
    if (route.kind !== 'list') await recordAudit({ kind: route.kind, actor: await identity() })
    return undefined
  }],
  routes: { /* ... */ },
})
```

## Seeds

Why not in core: a seed is just a script, and its content is your data.

Convention (see `apps/api/scripts/seed.ts`): one idempotent `scripts/seed.ts` using
`on conflict do nothing`, run through `pnpm run db:seed`, safe to re-run.

## Exports (Excel/PDF)

Why not in core: layouts and formats are domain decisions; every export ends up special.

Reuse the list query (`source.list({ query, context })`) for the rows, then format in your own route.
