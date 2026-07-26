# Plan 012: Implement list queries — pagination, filtering, sorting, search, and single-query reads

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 694c905..HEAD -- packages/sprindle/src apps/api/src`
> Changes attributable to plans marked DONE in `plans/README.md` (esp. 011)
> are expected. Any other change: compare "Current state" excerpts against
> live code; on mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED (changes the list response contract: `total` becomes required; RPC types updated in lockstep)
- **Depends on**: plans/010-backend-verification-baseline.md, plans/011-atomic-source-writes.md
- **Category**: bug
- **Planned at**: commit `694c905`, 2026-07-26

## Why this matters

Sprindle's list endpoint **parses `page`/`limit`/`search` and then ignores them**. The Drizzle source fetches the entire table, and the route echoes the requested `page`/`limit` back over that full result — the response is actively misleading. `total` is never computed. No sort or filter vocabulary exists. On top of that, every list is N+1 by construction: rows are fetched with `select().from(table)`, then `materialize` re-reads **each row individually** via `findFirst` to attach relations. This plan makes the declared query vocabulary real and makes list/detail single-query.

## Current state

- `packages/sprindle/src/source/drizzle-source.ts:96-100` — the bug:
  ```ts
  async list() {
    const rows = await database.select().from(table)
    if (!rows) throw new Error(`Drizzle relational query not found for table "${tableKey}".`)
    return { data: (await materialize(rows)) as TRecord[] }
  },
  ```
  Note `list()` takes no arguments despite the `ModelSource` contract passing `{ query, context }`.
- N+1: `materialize`/`materializeOne` (`drizzle-source.ts:83-93`) — for arrays, `Promise.all(input.map((row) => materializeOne(row)))`, each doing `database.query[tableKey].findFirst({ where: wherePrimaryKeyObject(id), with: withRelations })`.
- `detail` (`:101-104`) — `select().from(table).where(...).limit(1)` then a second `findFirst` via materialize: two queries where one suffices.
- Relational query API in use is object-where style (RQB v2): `findFirst({ where: wherePrimaryKeyObject(id), with: withRelations })` at `:90`. `withRelations` is `{ [field]: true }` built at `:73`.
- `packages/sprindle/src/routes/list.ts` (entire file, 19 lines):
  ```ts
  export const list = defineRouteFactory({
    method: 'get',
    kind: 'list',
    middleware: [zValidator('query', listQuerySchema)],
    state: ({ c }) => ({ query: listQuerySchema.parse(c.req.query()) }),   // double parse
    action: async ({ c, context, state }) => {
      const query = state.query
      const result = await context.entity.source.list({ query, context })
      const data = Array.isArray(result) ? result : result.data
      const total = Array.isArray(result) ? undefined : result.total
      return c.json({ data, page: query.page, limit: query.limit, ...(total === undefined ? {} : { total }) })
    },
  })
  ```
- `packages/sprindle/src/validation/common-schemas.ts:3-7`:
  ```ts
  export const listQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
  })
  ```
- `packages/sprindle/src/source/model-source.ts:12-18` — `SourceListResult<TRecord> = { data: TRecord[]; total?: number }`; `list` may also return a bare array.
- RPC types: `packages/sprindle/src/hono/index.ts:5-9` (`ListQuery = { page?, limit?, search? }`) and `:78-79` (`KindOutput` list = `{ data: ...[]; page: number; limit: number; total?: number }`).
- Vocabulary rule (from `plans/README.md`, applies house-wide): public names come from (a) existing framework vocabulary, (b) platform-standard vocabulary, (c) plain English; no coined compounds.
- Frontend consumer expectation: the legacy Vue framework uses `searchParameters` as its query-input name, but the wire format here is Sprindle's own; existing SDK consumers type against `hono/index.ts` inference, so wire + type change together atomically.

## Design (decided — implement as specified)

Query vocabulary, all flat query params (reserved keys):

| Param | Meaning | Validation |
|---|---|---|
| `page`, `limit` | as today | as today |
| `search` | case-insensitive substring across the entity's string columns | string |
| `sort` | column key to order by | must be a table column key, else 400 |
| `order` | `asc` (default) \| `desc` | enum |

**Filters**: every OTHER query key must exactly match a table column key and becomes an equality predicate (`?status=active&categoryId=3`). Unknown keys → 400 `validation_error` naming the key. This keeps zero new nouns (no `filter[...]` syntax) while staying strict — loud failure is the house style (compare the boot-time errors in `domain-schema.ts:147-241`).

**Search columns**: all columns whose Drizzle `column.dataType === 'string'`, derived from `getTableColumns` — no per-entity config in this plan.

**Response**: `{ data, page, limit, total }` — `total` becomes **required** (count query always runs). `SourceListResult.total` becomes required; the bare-array return stays legal for hand-rolled sources (route then computes `total = data.length`).

**Single-query reads**: `list` and `detail` switch from `select().from(table)` + per-row `findFirst` to ONE relational query — `database.query[tableKey].findMany({ where, orderBy, limit, offset, with: withRelations })` / `findFirst({ where, with })` — plus one `COUNT` for list. Entities without relations (no `tableKey`/`withRelations`) keep the plain select path but still gain where/order/limit/offset. `materialize` stays for write paths (post-write re-read, per plan 011) — batch it: single-column PK arrays use one `findMany({ where: { [pk]: { in: ids } } })` re-ordered to input order; composite-PK arrays keep the per-row loop (rare; document in a comment).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Framework tests | `pnpm --filter @southneuhof/sprindle test` | all pass |
| Framework types | `pnpm --filter @southneuhof/sprindle type-check` | exit 0 |
| API tests | `pnpm --filter @southneuhof/api test` | all pass |
| API types | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| Lint | `pnpm --filter @southneuhof/sprindle lint` | exit 0 |

## Scope

**In scope**:
- `packages/sprindle/src/source/drizzle-source.ts`, `model-source.ts`
- `packages/sprindle/src/routes/list.ts`
- `packages/sprindle/src/validation/common-schemas.ts`
- `packages/sprindle/src/hono/index.ts` (ListQuery + KindOutput types only)
- Tests: `packages/sprindle/src/source/__tests__/drizzle-source.spec.ts`, `packages/sprindle/src/hono/__tests__/install-sprindle.spec.ts`, `apps/api/src/__tests__/products.spec.ts`
- `packages/contracts` ONLY if the parity test (`apps/api/src/__tests__/schema-parity.spec.ts`) fails from the schema change

**Out of scope**:
- Operator filters (`gt`, `between`, `in`), per-entity searchable/sortable allowlists, cursor pagination — all deferred; see Maintenance notes.
- `create`/`update`/`delete` routes; pipeline; error shapes (plan 013 owns errors — keep emitting today's `{ error: 'validation_error', issues }` shape for bad query params, via a thrown error the route catches like `create.ts:14` does, or a direct `c.json(..., 400)`).

## Git workflow

- Branch: `codex/plan-012-working-list-queries`
- Commits per step: `feat(sprindle): apply pagination and sorting in drizzle source`, `feat(sprindle): add filter and search to list queries`, `perf(sprindle): single-query list and detail reads`.

## Steps

### Step 1: Extend `listQuerySchema` and kill the double parse

Add `sort: z.string().optional()`, `order: z.enum(['asc', 'desc']).default('asc')` to `listQuerySchema`. Allow unknown keys through the schema (`.catchall(z.string())` or `.passthrough()` — pick whichever the installed zod/v4 supports; unknown-key validation happens in the source where columns are known). In `list.ts`, keep the `zValidator` middleware and change `state` to `({ c }) => ({ query: listQuerySchema.parse(c.req.query()) })` → replace with reading the already-validated value: `c.req.valid('query')` is not typed on the raw Context — instead DROP the middleware and keep the single `state` parse (one parse total; the middleware's only job was validation the parse already does). Update `hono/index.ts` `ListQuery` to add `sort?: string; order?: string` and the extra-filter-keys possibility (`& Record<string, string | undefined>`).

**Verify**: `pnpm --filter @southneuhof/sprindle type-check` → exit 0; `pnpm --filter @southneuhof/sprindle test` → pass.

### Step 2: Implement query application in `drizzle-source.list`

Give `list({ query })` a real implementation per the Design section:
- Partition `query`: reserved keys (`page`,`limit`,`search`,`sort`,`order`) vs filter keys. Filter key not in `tableColumns` → throw `validationError(...)` (the existing helper at `drizzle-source.ts:277-279`) naming the key; same for `sort` not in `tableColumns`.
- Relational path (when `tableKey && withRelations`): build `findMany({ where, orderBy, limit, offset, with: withRelations })` and `findFirst` for detail. RQB v2 object-where: equality filters as `{ [key]: value }`; search as an OR across string columns using the RQB v2 `ilike`/`OR` syntax — **verify the exact operator spelling against the installed `drizzle-orm@1.0.0-rc.4` before writing it** (see STOP conditions); coerce filter values with the column's Zod schema from `schemas.select` shape where feasible, otherwise pass the string through (Postgres casts).
- Plain path (no relations): `select().from(table).where(and(...)).orderBy(...).limit(...).offset(...)` with `ilike`/`or` from `drizzle-orm`. Extend the structural `DrizzleDb` type accordingly.
- Count: `select({ count: count() }).from(table).where(sameWhere)` (import `count` from `drizzle-orm`); return `{ data, total }`.
- `detail`: single relational `findFirst({ where: pkAndNothingElse, with })` (drop the select-then-materialize double read); plain path unchanged plus parse.

**Verify**: `pnpm --filter @southneuhof/sprindle test` → pass; then against real DB: `pnpm --filter @southneuhof/api test` → pass.

### Step 3: Batch `materialize` for write paths

Per Design: array input + single-column PK → one `findMany({ where: { [pkKey]: { in: ids } }, with })`, reorder to input order, `schemas.select.parse` each; composite PK → existing per-row loop. Preserve plan 011's property: materialize during `create`/`update` runs on the tx db.

**Verify**: `pnpm --filter @southneuhof/sprindle test` → pass.

### Step 4: Make `total` required and update route + RPC types

`SourceListResult.total: number` (required). `list.ts` action: bare-array source result → `total = data.length`. Response always `{ data, page, limit, total }`. Update `hono/index.ts:78-79` `KindOutput` list to `total: number`. Fix `apps/api/src/__tests__/products.spec.ts` expectations and add assertions there for: `?limit=2&page=2` slices correctly with correct `total`; `?sort=name&order=desc` orders; `?sku=...` equality-filters; `?search=` matches case-insensitively; unknown filter key → 400.

**Verify**: all five command-table commands → green. If `schema-parity.spec.ts` fails, mirror the change in `packages/contracts` the way that spec directs.

## Test plan

- Unit (`drizzle-source.spec.ts`): filter partitioning (reserved vs column vs unknown), sort validation, count query issued, batch materialize ordering, composite-PK fallback. Model mocks on the file's existing style.
- Type (`install-sprindle.spec.ts`): `expectTypeOf` — list output has required `total: number`; query input accepts `sort`/`order`.
- Integration (`products.spec.ts`): the five behaviors in Step 4.

## Done criteria

- [ ] `grep -n "database.select().from(table)$" packages/sprindle/src/source/drizzle-source.ts` → no bare unfiltered full-table list read remains
- [ ] List response includes correct `total` under filters (integration test proves it)
- [ ] Unknown filter key and unknown `sort` column → 400 with the key named
- [ ] All commands in the table exit 0
- [ ] No files outside Scope modified; `plans/README.md` row updated

## STOP conditions

- The installed drizzle-orm RQB v2 does not support `in`/`ilike`/`OR` object-where operators needed for filters/search on the relational path (verify with a scratch query first). Report the actual supported syntax — do not invent a fallback that silently changes semantics.
- `apps/api` products integration tests reveal relation-shaped rows differing between `findMany({with})` output and the old materialize output (e.g. missing nested normalization) — report, don't patch schemas ad hoc.
- The contracts parity test requires changes beyond mechanically mirroring the new query/response shape.

## Maintenance notes

- Deferred, with rationale recorded: operator filters and per-entity searchable/sortable allowlists (wait for a real consumer need — YAGNI + vocabulary budget); cursor pagination (offset fine at current scale).
- Plan 017 (OpenAPI) reads the query vocabulary from this plan — if you rename any param, update plan 017 before executing it.
- Reviewer: check the count query and data query share the identical `where`; check `limit`'s max (100) still enforced by schema.
