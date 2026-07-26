# Sprindle reference

Sprindle is a thin layer over [Hono](https://hono.dev) and [Drizzle](https://orm.drizzle.team):
you declare tables, schemas and route kinds; Sprindle mounts routes, applies a fixed request
pipeline, and keeps one wire contract. It does not hide Hono — every escape hatch is a Hono
handler or middleware.

Line references point at `packages/sprindle/src`.

## Vocabulary

### entity — `createEntity({ table, schemas })`

`model/domain-schema.ts:62` — pairs a Drizzle table with its `create` / `update` / `select` Zod
schemas. The entity's name is the Drizzle table name. `defineEntitySchemas` (`:76`) is an identity
helper that keeps schema literals narrowly typed.

```ts
import { createEntity } from '@southneuhof/sprindle/model'

export const product = createEntity({
  table: products,
  schemas: { create: productCreate, update: productUpdate, select: productSelect },
})
```

Boot errors: `createEntity() does not accept relations.` (`:65`) — relations belong to a domain part.

### domain part / domain schema — `defineDomainPart`, `defineDomainSchema`, `bindDomainDatabase`

`model/domain-schema.ts:80`, `:88`, and the binder used by `apps/api/src/db.ts`. A domain part groups
tables, entities and Drizzle relation parts; `defineDomainSchema` merges the parts, validates them and
derives relation metadata; `bindDomainDatabase` attaches the live database to every entity source.

Boot errors are remediation messages — read them whole. Examples: `Unknown nested object field "<field>"
on entity "<name>". Nested relation fields must use another entity's schemas.select.` (`:175`) and
missing-relation / missing-through-column errors (`:275`–`:286`).

### model — `defineModel({ path, entity, routes, ...hooks })`

`model/define-model.ts:29`. Compiles a route tree into a Hono sub-app and builds the runtime context
(`{ name, entity, pipeline }`) every route handler receives. Model-level pipeline hooks apply to every
route in the model.

### route — `defineRoute`, `defineRouteFactory`, canonical kinds

`routes/define-route.ts`. Kinds are `list | detail | create | update | delete | custom`
(`model/route-types.ts:8`). The canonical factories are `list()`, `detail()`, `create()`, `update()`,
`deleteRoute()`; each accepts pipeline hooks that merge with the factory's own.

Route-tree nesting becomes URL segments (`model/route-tree.ts:30`): a key `nested: { ping }` under a
model mounted at `/items` is served at `/items/nested/ping`. Canonical URLs:

| Kind | Method | Path |
|---|---|---|
| list | GET | `/<model>/list` |
| detail | GET | `/<model>/detail/:id` |
| create | POST | `/<model>/create` |
| update | PATCH | `/<model>/update/:id` |
| delete | DELETE | `/<model>/delete/:id` |

### source — `ModelSource`

`source/model-source.ts` — six methods: `list`, `detail`, `create`, `update`, `delete`, `materialize`.
`createDrizzleSource` (`source/drizzle-source.ts`) is the Drizzle implementation; `createMemorySource`
(`testing/memory-source.ts`) is the in-memory one used by tests. Any object satisfying the contract can
back a model.

Drizzle source guarantees:

- `create` and `update` run their write, relation writes and the post-write re-read inside one
  transaction when the database supports it (`drizzle-source.ts:46`, `:162`).
- `list` and `detail` issue one relational query (plus one `COUNT` for lists); array materialization
  batches into a single `in` query for single-column primary keys.

### pipeline

`routes/pipeline.ts:9`. Order per request:

```
before(model) → before(route)
  → authorize(model) → authorize(route)
  → validate(model) → validate(route)
  → action
  → after(route) → after(model)
  ─ on throw ─→ error(route) → error(model) → error contract → rethrow
```

`before` hooks return a patch merged into `args.state`. `authorize` returning a value answers 403;
returning a `Response` answers with it; throwing an `HttpError` answers with that error's status.
`validate` returning issues answers 400. `after` hooks may replace the response.

Handler args (`model/route-types.ts:16`): `{ c, context, route, state, identity }`.

### identity and guards

`installSprindle(app, installables, { identity })` installs one resolver answering "who is calling"
(`hono/index.ts`). `args.identity()` is lazy and memoized per request. Routes are **public unless
`authenticated()` is attached** — attach it at model level by default:

```ts
import { authenticated, list } from '@southneuhof/sprindle/routes'

defineModel({ path: '/products', entity: product, authorize: [authenticated()], routes: { list: list() } })
```

`authenticated()` throws `unauthorized()` (401) before any custom authorize hook can answer 403.

## Wire contracts

| Kind | Success | Status |
|---|---|---|
| list | `{ data: Select[], page, limit, total }` | 200 |
| detail / update | `{ data: Select }` | 200 |
| create | `{ data: Select }` | 201 |
| delete | `{ ok: true }` | 200 |

Errors use one envelope: `{ error: <code>, message?: string, issues?: [{ field?, message }] }`
(`errors.ts`, rendered in `routes/pipeline.ts:32` and `hono/index.ts` `sprindleOnError`). Constructors:
`validationError(messageOrIssues)` 400, `unauthorized()` 401, `forbidden()` 403, `notFound()` 404, or
`new HttpError(status, code, message?, issues?)`. Zod failures are rendered as `validation_error` with
field issues. Anything else becomes `{ error: 'internal_error' }` 500 — the original message is logged,
never returned.

### List query parameters

| Param | Meaning |
|---|---|
| `page`, `limit` | pagination; `limit` max 100, default 20 |
| `search` | case-insensitive substring across the table's string columns |
| `sort`, `order` | column key and `asc` (default) / `desc` |
| anything else | equality filter on that column |

Unknown filter keys and unknown sort columns fail with 400 naming the key
(`source/drizzle-source.ts:97`, `:102`).

## Request context and logging

`requestContext()` (`hono/index.ts`) assigns `x-request-id` (honoring an inbound one) and echoes it on
the response. `installSprindle`'s `logger` option accepts any `{ info, warn, error }` object
(pino-compatible); `consoleLogger` is the default. Framework 500s log
`{ requestId, method, path, err }`.

## Extending

- **Custom routes** — `defineRoute({ method, path, action })` returns a route usable inside a model's
  tree or as a top-level installable (top-level routes must declare a path).
- **Raw Hono** — `middleware: [...]` on any route definition takes ordinary Hono middleware.
- **Other backends** — implement `ModelSource` and hand it to `defineModel` through an entity.
- **OpenAPI** — `@southneuhof/sprindle/openapi` exports `generateOpenApi(installables, info)` and
  `openapiRoute(installables, info)`.
- **Tests** — `@southneuhof/sprindle/testing` exports `createMemorySource`, `createTestEntity`,
  `testApp`.

## Design rules

- **Thin over Hono.** Sprindle mounts Hono routes and never wraps the `Context`.
- **Types over codegen.** Client types come from `hc<AppType>` inference; there is no generator.
- **Fail loud at boot.** Schema and relation mistakes throw during `defineDomainSchema`, with the fix in
  the message.
- **Closed vocabulary.** Public names come from, in order: existing framework vocabulary, Vue/HTML/
  TypeScript standard vocabulary, then plain English. Coined compounds are rejected in review, and
  domain words (`role`, `parent`, `mapping`) never appear in framework APIs.
