# Plan 011: Make Drizzle source writes atomic (transactions around multi-statement writes)

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 694c905..HEAD -- packages/sprindle/src/source apps/api/src/__tests__`
> Changes attributable to plans marked DONE in `plans/README.md` are expected.
> Any other change: compare the "Current state" excerpts against live code
> before proceeding; on a mismatch, treat as STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (touches every write path; mitigated by existing integration tests)
- **Depends on**: plans/010-backend-verification-baseline.md
- **Category**: bug
- **Planned at**: commit `694c905`, 2026-07-26

## Why this matters

Sprindle's Drizzle source performs **multi-statement writes with no transaction**. A `create` with relations is: insert row → per many-relation, update child FK rows → re-read (`materialize`). A many-to-many write is delete-all-junction-rows → insert-new-junction-rows. Any failure between statements leaves the database in a partial state — e.g. all role-permission junction rows deleted and none re-inserted. The framework generates these statement sequences itself, so no app can fix this; atomicity is a source-contract correctness requirement, not a feature.

## Current state

- `packages/sprindle/src/source/drizzle-source.ts` — the only `ModelSource` implementation. `grep -n transaction packages/sprindle/src/source/drizzle-source.ts` → no matches.
- The structural DB type at `drizzle-source.ts:9-41` (`type DrizzleDb`) declares `query`/`select`/`insert`/`update`/`delete` — no `transaction`.
- `create` (`drizzle-source.ts:105-115`):
  ```ts
  async create({ input }) {
    const { row, relations } = splitRelationInput(schemas.create.parse(input), relationByField)
    applyOneRelationValues(row, relations, tableColumns)
    const rows = await database.insert(table).values(row).returning()
    if (rows[0]) {
      const id = getReturnedId(rows[0], primaryKey)
      await applyManyRelationValues(database, id, relations, primaryKey, tableColumns)
      return (await materialize(rows[0])) as TRecord
    }
    return schemas.select.parse(rows[0])
  },
  ```
- `update` (`drizzle-source.ts:116-127`) — same shape: update → `applyManyRelationValues` → `materialize`.
- `applyManyRelationValues` (`:166-214`) issues up to 3 statements per array relation (select stale check / null-out update / assign update).
- `applyThroughManyRelationValue` (`:216-243`) — the worst case:
  ```ts
  await database.delete(relation.throughTable).where(eq(throughSourceColumn, ownerValue)).returning()
  if (selectedIds.length) {
    await database.insert(relation.throughTable).values(...).returning()
  }
  ```
- The real db is `drizzle-orm/node-postgres` (`apps/api/src/db.ts:20` — `drizzle({ client: pool, relations })`), which provides `db.transaction(async (tx) => ...)` where `tx` has the same `select/insert/update/delete/query` surface.
- Integration tests: `apps/api/src/__tests__/products.spec.ts` (401 lines, runs against real Postgres). Framework unit tests: `packages/sprindle/src/source/__tests__/drizzle-source.spec.ts` (mock db objects — they do NOT implement `transaction`).
- Convention: `drizzle-source.ts` types the db structurally (`DrizzleDb`) rather than importing Drizzle's db types — keep that.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Framework tests | `pnpm --filter @southneuhof/sprindle test` | all pass |
| Framework types | `pnpm --filter @southneuhof/sprindle type-check` | exit 0 |
| API tests | `pnpm --filter @southneuhof/api test` | all pass (needs DB env per plan 010) |
| Lint | `pnpm --filter @southneuhof/sprindle lint` | exit 0 |

## Scope

**In scope**:
- `packages/sprindle/src/source/drizzle-source.ts`
- `packages/sprindle/src/source/__tests__/drizzle-source.spec.ts`

**Out of scope**:
- `ModelSource` interface (`model-source.ts`) — the public contract does not change.
- Exposing a userland transaction boundary (running `action` + hooks inside a tx) — deliberately deferred; see Maintenance notes.
- `list`/`detail` — reads; untouched here (plan 012 rewrites them).

## Git workflow

- Branch: `codex/plan-011-atomic-source-writes`
- Commit: `fix(sprindle): run multi-statement source writes in a transaction`

## Steps

### Step 1: Add optional `transaction` to the structural DB type

In `DrizzleDb` (`drizzle-source.ts:9-41`) add:

```ts
transaction?: <T>(fn: (tx: DrizzleDb) => Promise<T>) => Promise<T>
```

Note: the relational-query path in `materializeOne` uses `database.query` — inside a node-postgres transaction, `tx.query` exists in drizzle-orm 1.0.0-rc.4 relational-query-builder v2. Verify with a quick script against the installed package before relying on it (see STOP conditions).

**Verify**: `pnpm --filter @southneuhof/sprindle type-check` → exit 0.

### Step 2: Introduce a `withTransaction` helper and wrap `create`/`update`

Add a module-level helper:

```ts
async function withTransaction<T>(database: DrizzleDb, fn: (tx: DrizzleDb) => Promise<T>): Promise<T> {
  return database.transaction ? database.transaction(fn) : fn(database)
}
```

(The fallback keeps mock/in-memory sources in tests working — they don't implement `transaction`.)

Rewrite `create` and `update` so the whole body after schema parsing runs inside `withTransaction(database, async (tx) => ...)`, passing `tx` (not `database`) to `insert`/`update`/`applyManyRelationValues` and to `materialize`. `materializeOne` currently closes over `database`; refactor it to accept the db as a parameter (or make `materialize` accept an optional `tx` defaulting to `database`) so the post-write re-read sees the uncommitted rows. `delete` is single-statement — leave direct.

Keep schema parsing (`schemas.create.parse(input)`) OUTSIDE the transaction — validation failures must not open a tx.

**Verify**: `pnpm --filter @southneuhof/sprindle test` → all pass; `pnpm --filter @southneuhof/api test` → all pass.

### Step 3: Add failure-injection unit tests

In `drizzle-source.spec.ts`, add tests with a mock db that (a) implements `transaction` by invoking the callback with a tx-recording proxy and (b) can be told to throw on the Nth statement:

1. `create` with a through-relation where the junction insert throws → assert `transaction` was entered and the error propagates (rollback is the driver's job; assert the statements all ran on the tx object, not the base db).
2. `update` with an array relation → assert all statements (update, null-out, assign, materialize read) execute on the tx object.
3. Mock db WITHOUT `transaction` → create still succeeds (fallback path).

Model the mock-db style on the existing mocks in this spec file.

**Verify**: `pnpm --filter @southneuhof/sprindle test` → all pass including 3 new tests.

## Test plan

Covered by Step 3 (unit, statement-routing assertions) plus the existing `apps/api/src/__tests__/products.spec.ts` integration suite against real Postgres, which exercises relation writes end-to-end.

## Done criteria

- [ ] `grep -n "withTransaction" packages/sprindle/src/source/drizzle-source.ts` shows `create` and `update` wrapped
- [ ] All four commands in the table exit 0
- [ ] 3 new tests exist in `drizzle-source.spec.ts` and pass
- [ ] `git status`: no files outside Scope modified
- [ ] `plans/README.md` row updated

## STOP conditions

- The installed `drizzle-orm@1.0.0-rc.4` node-postgres `tx` object does NOT expose `query.<table>.findFirst` inside a transaction (check with a scratch script against a real DB). If so, report — the materialize-inside-tx design needs a decision (e.g. materialize after commit), don't pick silently.
- Existing tests fail before your first change (dirty baseline).
- `apps/api` integration tests fail after Step 2 in a way that suggests changed read-your-writes semantics.

## Maintenance notes

- Plan 012 rewrites `list`/`materialize` for query support and batching — it must preserve the "materialize runs on the tx during writes" property introduced here.
- Deferred deliberately: a userland transaction boundary (whole route `action` + hooks in one tx). Revisit only if apps demonstrate the need; it would add public API surface.
- Reviewer: confirm no statement inside `create`/`update` still references the outer `database` variable.
