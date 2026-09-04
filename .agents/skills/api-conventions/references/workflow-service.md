# Workflow service

Use for state machines, child-row writes, or cross-module transactions. Follow
`apps/api/src/routes/quality-inspection/`.

Keep canonical read or write surfaces on their matching factories when hooks
or `run` can express them. Add a custom `defineRoute` only for the workflow
action whose HTTP contract is different, and mark it with
`// CUSTOM SURFACE — <reason>`.

## Routes stay thin

`<name>.routes.ts` can resolve identity, parse input, and call one service
function. It must not contain Drizzle writes. Factory `enrich` hooks can read
extra domain data for a response.

- Static permission: `authorize: [requirePermission('<code>')]`.
- Custom action permissions use the URL action segment as the verb and the
  exact code from the module permission matrix. See [standard-crud.md](standard-crud.md).
- Session with record-dependent permission: `authorize: [authenticated()]`.
  The service checks coverage or permission after it loads the record.
- Body: `schema.parse(await readJsonBody(c))`.
- Path: `requirePathParam(args, 'id')`.
- Success: return `{ data }`. Use `created(args.c, data)` only for 201.

Do not use `c.req.json().catch(...)`, repeat path guards, or build 200 JSON
responses by hand.

## Services own business changes

Use the applicable `Db`, `Tx`, or `DbOrTx` type from `src/db.ts`; never replace
these types with `any`. Keep permission codes in typed constants. Each use case
follows this shape:

1. Check the caller's permission or coverage.
2. Parse the use-case input.
3. Start one transaction.
4. Use `lockRow(tx, table, id, { require, failMessage })` before branching on
   the parent state.
5. Write child and parent rows in the transaction.
6. Append activity with one module-local `logFor(moduleName, referenceTable)`
   partial.
7. After commit, load and return the complete record when the contract needs
   relations or derived fields.

Use 409 `invalid_transition` for state conflicts, `validationError` for input
or domain validation, and `notFound` for missing records. `lockRow` already
checks liveness and the supplied parent-state condition. Do not repeat its
`FOR UPDATE`, missing-row, or state checks. Lock a child row separately only
when the use case also branches on that child's state.

For soft delete, use `softDeleteValues` inside the transaction. For a write
into another module, call that module's existing transaction-first service
function so both changes commit together.

The constructor `dataWrite` hook does not run for custom routes. Stamp audit
columns explicitly for child rows and other true custom writes inside the same
transaction.

## Focused checks

Test allowed and denied permission paths and the state transitions that this
module owns. Use the shared session and project fixtures from `src/testing`.
Run the module-scoped spec with `test:focused -- <spec>`. Do not run the full
API suite unless the change crosses modules or the focused result shows that
risk.
