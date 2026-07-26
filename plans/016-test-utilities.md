# Plan 016: Ship test utilities — in-memory source and entity/test-app helpers

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 694c905..HEAD -- packages/sprindle`
> Changes attributable to plans marked DONE in `plans/README.md` (esp. 012 —
> it changes the `ModelSource` list contract this plan must honor) are
> expected. Any other change: compare "Current state" excerpts against live
> code; on mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW (additive; plus a mechanical refactor of the framework's own specs)
- **Depends on**: plans/012-working-list-queries.md (list contract), plans/013-error-contract.md (error shapes helpers assert)
- **Category**: tests
- **Planned at**: commit `694c905`, 2026-07-26

## Why this matters

Sprindle asks every consumer to build against `ModelSource` and the pipeline, but exports **zero test helpers**. The framework's own specs hand-roll `ModelSource` literals and inline entities in every file; every app will copy-paste the same scaffolding, each slightly differently. A `testing` subpath with an in-memory source that honors the real list-query semantics makes app tests cheap, DB-free, and consistent — and dogfooding it in the framework's own specs keeps it honest.

## Current state

- `packages/sprindle/package.json` `exports`: `.`, `./hono`, `./model`, `./routes`, `./source`, `./validation` — no `./testing`.
- Hand-rolled source in `packages/sprindle/src/hono/__tests__/install-sprindle.spec.ts:9-17`:
  ```ts
  const source = {
    list: async () => [],
    detail: async () => null,
    create: async ({ input }) => input,
    update: async () => null,
    delete: async () => false,
    materialize: async (input) => input,
  } satisfies ModelSource
  ```
  and an inline entity at `:18-27` (`{ name: 'items', source, schemas: { create, update, select } }`). The same pattern repeats in `model/__tests__/define-model.spec.ts` (278 lines) and `model/__tests__/domain-schema.spec.ts`.
- `ModelSource` contract: `packages/sprindle/src/source/model-source.ts:17-24` — after plan 012, `list` receives the parsed query and must return `{ data, total }` (or a bare array).
- List query semantics (post-012): `page`/`limit` slice; `search` case-insensitive substring over string fields; `sort` + `order` (`asc`/`desc`); remaining keys = equality filters; unknown filter/sort keys → 400 via `validationError(...)` from `packages/sprindle/src/errors.ts` (post-013).
- Test invocation style: specs build a Hono app via `defineModel` + `installSprindle` and call `app.request('/items/list')` — see `install-sprindle.spec.ts` and `apps/api/src/__tests__/products.spec.ts:168-191` (canonical paths `/x/list`, `/x/detail/:id`, `/x/create`, `/x/update/:id`, `/x/delete/:id`).

## Design (decided — implement as specified)

New subpath `@southneuhof/sprindle/testing` → `src/testing/index.ts`:

1. `createMemorySource<TRecord>(config?: { rows?: TRecord[]; id?: keyof TRecord }): ModelSource<TRecord> & { rows: TRecord[] }`
   - Default id key `'id'`. Backed by a plain array (exposed as `.rows` for seeding/assertions).
   - `list({ query })` implements the REAL semantics: equality filters on record fields (unknown key → throw `validationError`), `search` over string-valued fields, `sort`/`order`, then `page`/`limit` slice, returns `{ data, total }` with `total` = filtered count pre-slice.
   - `create` appends (generating a `crypto.randomUUID()` id when absent), `update` merges-or-null, `delete` splices-or-false, `detail` finds-or-null, `materialize` identity.
2. `createTestEntity(config?: { name?: string; schemas?: Partial<EntitySchemas>; rows?: ... })` — returns a `ModelRuntimeEntity` with passthrough Zod schemas by default (`z.looseObject({})` / v4 equivalent) and a memory source; overridable.
3. `testApp(...installables)` — sugar: `installSprindle(new Hono(), installables)` returned so specs go straight to `app.request(...)`.

No new dependencies. Vitest stays a devDependency; helpers must not import it (they are runtime-agnostic).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Framework tests | `pnpm --filter @southneuhof/sprindle test` | all pass |
| Framework types | `pnpm --filter @southneuhof/sprindle type-check` | exit 0 |
| Lint | `pnpm --filter @southneuhof/sprindle lint` | exit 0 |
| API types (consumer intact) | `pnpm --filter @southneuhof/api type-check` | exit 0 |

## Scope

**In scope**:
- `packages/sprindle/src/testing/` (create: `index.ts`, `memory-source.ts`, `test-entity.ts`)
- `packages/sprindle/package.json` (add `./testing` export)
- `packages/sprindle/src/testing/__tests__/memory-source.spec.ts` (create)
- Refactor ONLY: `src/hono/__tests__/install-sprindle.spec.ts`, `src/model/__tests__/define-model.spec.ts` to consume the helpers (assertions unchanged)

**Out of scope**:
- `domain-schema.spec.ts` and `drizzle-source.spec.ts` — they intentionally test Drizzle-specific machinery with bespoke mocks; leave them.
- DB-truncation/fixture helpers for Postgres integration tests — deferred (needs a design pass on app test lifecycle).
- `apps/api` test refactors.

## Git workflow

- Branch: `codex/plan-016-test-utilities`
- Commits: `feat(sprindle): add testing subpath with memory source`, `refactor(sprindle): dogfood test utilities in framework specs`.

## Steps

### Step 1: Implement `createMemorySource` + spec

Per Design. The spec (`memory-source.spec.ts`) mirrors plan 012's semantics table: pagination slice + total, search, sort asc/desc, equality filter, unknown-key throw, create/update/delete/detail basics.

**Verify**: `pnpm --filter @southneuhof/sprindle test` → pass including new spec.

### Step 2: `createTestEntity` + `testApp` + export wiring

Per Design; add `"./testing": "./src/testing/index.ts"` to the exports map.

**Verify**: `pnpm --filter @southneuhof/sprindle type-check` → exit 0; a one-assertion smoke test: `testApp(defineModel({ path: '/items', entity: createTestEntity(), routes: { list: list() } }))` then `app.request('/items/list')` → 200 with `{ data: [], page: 1, limit: 20, total: 0 }`.

### Step 3: Dogfood in the two framework specs

Replace the hand-rolled `source`/`item` literals in `install-sprindle.spec.ts` and `define-model.spec.ts` with the helpers where the test's intent allows (tests asserting on specific source behavior keep their custom mocks). Assertions must not change.

**Verify**: `pnpm --filter @southneuhof/sprindle test` → same test count, all pass.

## Test plan

Step 1 spec is the core. The dogfooding refactor is itself a consumer test of ergonomics — if the helpers feel awkward there, fix the helpers, not the specs.

## Done criteria

- [ ] `@southneuhof/sprindle/testing` resolves (`node -e "import('...')"` or the type-check of a spec importing it)
- [ ] Memory-source spec covers all plan 012 query semantics (pagination/total, search, sort, filter, unknown-key 400)
- [ ] `install-sprindle.spec.ts` no longer contains a hand-rolled 6-method source literal
- [ ] All commands green; no out-of-scope files; `plans/README.md` updated

## STOP conditions

- Plan 012 not DONE (semantics to mirror don't exist yet) — the memory source must not define its own divergent query behavior.
- Dogfooding forces assertion changes in existing specs — report which assertion and why instead of changing it.
- The Zod version in use rejects the passthrough-schema approach for default test entities — report the exact API available.

## Maintenance notes

- The memory source is a second `ModelSource` implementation — it doubles as the contract's conformance witness. When plan 012 semantics evolve (operator filters etc.), update BOTH implementations and this spec in one change.
- Deferred: Postgres fixture/truncation helpers; an `identity` test helper for plan 014 flows (add when an app test needs it).
- Reviewer: check helpers import nothing from vitest and add no runtime deps.
