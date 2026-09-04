---
name: api-conventions
description: Follow the Carta apps/api backend conventions (Hono + Sprindle + Drizzle). Use when adding, changing, or reviewing anything in apps/api — entities, models, routes, services, permission catalog entries, migrations, seeds, or module tests. Do not use for apps/web UI work or for packages/sprindle changes.
---

# API conventions

Conventions for `apps/api`. Use the named exemplar for the selected pattern;
do not copy an arbitrary module. When older docs or routes disagree with this
skill and its exemplar, this skill and the exemplar win.

Framework vocabulary: read `packages/sprindle/docs/reference.md` before naming
anything new. Human-readable charter:
`docs/architecture/api-conventions.md`.

## Pick one pattern

| Module class | Pattern | Exemplar |
|---|---|---|
| Standard CRUD master data | Factory routes (`list()`, `detail()`, `create()`, `update()`, `deleteRoute()`) inside `defineModel`; declarative options first (`query:` policy), then hooks | `apps/api/src/routes/users/` |
| Domain surface | Canonical factories with constructor `run` callbacks for special queries, transactions, structural rules, or child writes; true custom HTTP actions stay on `defineRoute` and carry a one-line `// CUSTOM SURFACE — <reason>` header | `apps/api/src/routes/users/` (guarded writes), `apps/api/src/routes/roles/` (service split) |
| Workflow domain (state machine, child rows, cross-module writes) | Thin `<name>.routes.ts` handlers delegating to `<name>.service.ts`; transitions use sprindle's `lockRow` | `apps/api/src/routes/roles/` |

Hand-rolled routes are drift when they re-implement filtering, pagination,
envelope, or write logic that the factories plus declarative options can
express. Do not copy such files; migrate them when touched.

`defineRoute` describes only a true custom HTTP contract: method, path, typed
input/output, state, and action. It has no resource `kind` or `operation`.
Never use it to claim the canonical list/detail/create/update/delete RPC or
OpenAPI contract. Use the matching constructor and its narrow `run` seam.
Resource constructors are valid only inside `defineModel`; a top-level
installable route must be a true custom route with its own path. Route handlers
receive `c`, `context`, `state`, and `identity`, not private route metadata.

For detailed recipes, read:
- [references/standard-crud.md](references/standard-crud.md) — entity, model,
  policy/hooks, permissions, registration, migration, tests for a CRUD module.
- [references/workflow-service.md](references/workflow-service.md) — route →
  service split, `lockRow` transitions, `logFor` activity logs.

## Use what exists — do not reimplement

Before backend edits:

1. Read the selected exemplar and the applicable reference above.
2. Record direct contract evidence for fields, relations, list search and
   filters, default sort, write validation, delete behavior, and permissions.
3. Search Sprindle exports and `apps/api/src` for the needed behavior.
4. Reuse the first matching factory, option, helper, or test fixture. Do not
   add a local copy with a new name.

Search `@southneuhof/sprindle` subpaths and these app kernels first:
`identity.ts`, `guards.ts`, `request-body.ts`, `schema.ts`, `scopes.ts`,
`soft-delete.ts`, `list-query.ts`, `workflow-support.ts`, and `testing/`.

Stored application file keys use `uploadKey` from `src/schema.ts`; external
URLs need an explicit domain schema.

| Need | Use | Do not |
|---|---|---|
| Default sort / enum filter validation | `list({ query: { defaultSort, enumFilters } })` | a `before` hook that sets `query.sort ??=` |
| Boolean query values (`active=true`) | nothing — source filter coercion owns it | `before`-hook boolean coercion for column filters |
| Decorate list rows after read | `list({ enrich })` | an `after` hook re-parsing `args.response.json()` |
| Decorate one detail/create/update record | factory `enrich(record, args)` | an `after` hook re-parsing `args.response.json()` or a custom route that only rebuilds `{ data }` |
| Scope list/detail/update/deleteRoute to a parent, realm, or identity | route `before` returning server-owned `{ where: (table) => predicate }` | a separate access read followed by an unscoped write, or custom SQL that repeats the factory |
| Keep a canonical route with special query/write logic | matching factory with `run` | `defineRoute({ kind: ... })`, a custom envelope, or a callback that returns `Response` |
| Parse a true custom list contract | `normalizeListQuery` plus `reservedQueryKeys`, `equalityFilters`, `searchCondition`, and `orderClause` from `src/list-query.ts` as needed | copied query plumbing, or a custom list when `list()` fits |
| Custom action returning data | plain `return { data }` (200) or `created(args.c, data)` (201) | `return args.c.json({ data })` |
| Parse JSON body in a custom action | `readJsonBody(c)` from `src/request-body.ts` | bare `await c.req.json()` with ad-hoc fallbacks |
| Lock + liveness + state guard in a transition | `lockRow(tx, table, id, { require, failMessage })` from `@southneuhof/sprindle/source` | hand-written `.for('update')` select + notFound + status checks |
| Path parameters | `requirePathParam(args, name)` from `src/identity.ts` | local path guards or wrappers |
| Nullable text input | `optionalText(max?)` from `src/schema.ts` | local blank-to-null transforms |
| Activity log per module | `logFor(moduleName, referenceTable)` from `src/workflow-support.ts` | repeated `moduleName` / `referenceTable` input bags |
| Reject delete when referenced | `deleteGuard([{ table, fkColumn }])` from `src/guards.ts` | per-dispatcher `isReferenced(...)` branches |
| Soft delete | `softDeleteRoute` / `softDeleteValues` (`src/soft-delete.ts`), `notDeleted` (`src/scopes.ts`) | hand-rolled deletedAt stamps or boolean flags |
| Test sessions | `createSystemSession` (auto-cleaned at pool close); `seedProject`/`cleanupSeededProjects` (`src/testing/`) | manual user/role/permission insert blocks |

If no existing option fits, keep the minimum code route-local and record the
gap. A Sprindle change needs explicit owner approval.

## Hard rules

1. **Routes are public unless guarded.** Attach `authorize:` to every route;
   only `/health` and `/api/auth/*` may be unguarded. `requirePermission(...)`
   (also `requireProjectPermission`, `requireScopedLookupPermission`) already
   answers 401 for anonymous callers — never pair it with `authenticated()`.
   Bare `authenticated()` is only for session-without-permission routes.
2. **Permission codes live in** `src/authorization/catalog.ts`. Use the
   approved module permission matrix for exact codes and realms. Read
   [standard-crud.md](references/standard-crud.md) for the six standard verbs
   and custom URL-action permissions.
3. **Register once.** Add one `defineModule({ domain, models })` entry to the
   single ordered `modules` literal in `src/routes/index.ts` (order = mount
   order). A bundle missing its `domain` fails at boot with an unbound-model
   error. There is no separate flat-routes export anymore.
4. **One wire contract.** Canonical factories produce it automatically:
   list → `{ data, page, limit, total }`; detail/update → `{ data }`;
   create → 201 `{ data }`; delete → `{ ok: true }`. Custom actions return
   plain objects (`{ data }` at 200) or `created(args.c, data)` at 201.
   Errors use sprindle's single envelope; never build another shape.
   Exceptions that keep explicit `c.json`: customs declaring a `TypedResponse`
   output type, and an `after` hook that replaces the response. Use `after`
   only when headers, status, streaming, or the complete envelope is the real
   extension surface; a replacement must be a `Response`.
   When the default source call is insufficient, keep the factory and use its
   `run` callback: list returns `{ data, total }`, create/update return one
   record, and delete returns `void` (throw `notFound()` when no row exists).
   The factory still owns method, path, parsing, enrichment, status, envelope,
   and canonical 404 behavior. `run` never returns a `Response`, envelope,
   status, or method/path override. There is no speculative detail `run` seam.
   `run` owns custom persistence: create/update applies `args.state.values`
   after client input, and scoped list/update/delete applies `args.state.where`
   when used. Update returns `undefined` for not found; delete throws
   `notFound()` when no valid row is affected. Sprindle cannot enforce these
   source rules for arbitrary SQL; focused domain tests must prove them.
5. **The source owns list queries.** Declarative first: `read.searchColumns`,
   `read.pinnedOrder` (static read policy) and the `list({ query })` policy
   slot (defaultSort fills only when the client sent none; enumFilters answer
   400 naming the key). Every list ends with primary-key order terms, so tie
   order is stable — never assert arbitrary tie order in specs; select rows by
   a business key instead. Unknown non-empty query keys fail 400; `limit`
   caps at 100. Hooks remain for identity scope and dynamic filters only.
6. **Relations are one backend contract.** Keep scalar IDs/codes in create and
   update schemas. Define Drizzle relations in the domain part, put the nested
   relation object in the select schema, and return it from list, detail,
   create, and update. Do not add a label-only endpoint or lookup map.
7. **Record enrichment happens before the envelope.** Use `list({ enrich })`
   for rows. Use `detail/create/update({ enrich })` for one record. The record
   hook receives the parsed source record and route args, and returns a
   replacement record or `void`. Query only the extra domain data; do not read
   the base row again. Never parse `args.response.json()` to decorate data.
8. **Single-row scope is server-owned and atomic.** A `before` hook can return
   `{ where }` for detail, update, and deleteRoute. Prefer an alias-safe predicate
   factory: `{ where: (table) => ... }`. Request input cannot fill this field.
   Update/delete combine it with the primary key in the source statement, and
   a scoped-away row returns the canonical 404. Do not authorize with a read
   followed by an unscoped write. Parent existence checks can stay when the
   domain contract requires a distinct parent error.
9. **Audit columns use the constructor-owned data-write seam.** `app.ts`
   passes `dataWrite: auditStamp()` to `installSprindle`. One typed callback
   receives `operation` (`create` or `update`) and only canonical constructors
   can invoke it. `dataWrite.operation` is a narrow write-stage value, not route
   metadata. Do not dispatch audit behavior through `RouteBefore`, route
   metadata, method/path, private resource metadata, or state-property checks.
   A custom `defineRoute` state named `values` must stay inert. In a canonical
   `run`, apply `args.state.values` after client input so server values win.
   Services writing child rows or true custom writes inside their own
   transactions stamp those rows explicitly. Keep the `auditFields` block as
   a local copy per entity file; do not unify it (copies differ in nullability).
10. **Soft delete = nullable `deletedAt`** (+ optional `deletedByUserId`,
   `deletedReason`) through the shared helpers. No boolean `deleted`.
11. **Migrations**: `db:generate`, review the SQL in `drizzle/`, commit it with
   the entity change, then `db:migrate` + `db:seed` against dev `.env`.
   Never edit an applied migration. `test:focused` migrates `.env.test` only
   and does not make anything visible in the app.
12. **Route ownership is explicit.** Route-specific policy goes on the route
    factory. Never dispatch policy on route kind, method, path, or private
    resource metadata. The only operation dispatch is the typed `create` or
    `update` value inside the installed `dataWrite` callback. Owner-list
    `permission` handling stays in the owner-list route hooks.
13. **Boot errors are remediations.** Read `defineDomainSchema` errors whole
    and fix the named field; do not loosen schemas to silence them.

## Verify

```sh
pnpm --filter @southneuhof/api type-check
pnpm --filter @southneuhof/api lint
pnpm --filter @southneuhof/api test:focused -- src/routes/<name>/<name>.routes.spec.ts
```

Tests hit real Postgres and run serially against one database. Session
fixtures auto-clean when the pool closes; business-row deletes stay the spec's
job (FK order first). Run the full suite only when a change crosses modules or
a focused failure shows cross-module risk.
