---
name: api-conventions
description: Build or review Carta API entities, routes, permissions, transactions, migrations, and backend tests.
---

# API conventions

Use the module contract for business behavior and current Carta exports for
implementation. A completed app is evidence, not a template to copy unchanged.

## Start from the contract

1. Identify the records, read and write fields, relations, ownership, permissions,
   delete rules, and any state transitions affected by the request.
2. Read `packages/sprindle/docs/reference.md` and the relevant current code in
   `apps/api/src`. Check exports before using a helper. Existing modules can have
   older patterns; use them to find integration points, not to justify defects.
3. Choose the smallest supported route below. Read only the applicable reference.

| Work | Implementation | Read |
|---|---|---|
| Resource reads and writes | Canonical factories inside `defineModel`; declarative options, then hooks | [Resource contracts](references/standard-crud.md) |
| Transactions, child writes, state changes | Factory `run` for canonical HTTP contracts; service functions for business transactions | [Workflow services](references/workflow-service.md) |
| Files, public records, derived fields | Schema-bound record conversion; batch extra reads | [Public records](references/public-records.md) |

A true custom HTTP action uses `defineRoute`. A service file earns its place
when it owns a business operation or shared transaction. Simple CRUD needs no
service, repository wrapper, or per-route permission-array constant.

## App boundaries

- Register each module once in `apps/api/src/routes/index.ts` with
  `defineModule({ domain, models })`. Include its domain when it owns entities.
- Use the installed identity and permission helpers in `src/identity.ts` and
  `src/authorization/`. Routes are public unless guarded. Permission helpers
  already require a session; use `authenticated()` alone only for a
  session-only route or a service that checks record-dependent permission.
  Public routes need an explicit product requirement.
- Define exact permission codes in `src/authorization/catalog.ts`. Standard verbs
  are `view`, `list`, `detail`, `create`, `update`, and `delete`, followed by the
  module code. Add only the operations the module exposes. Use an action verb for
  a custom action. Match the catalog, route guard, navigation, and seed.
- Discover supported authorization targets from the catalog. Add ownership or
  scope only when the product needs it; no business hierarchy is assumed.
- Reuse `src/schema.ts`, `src/request-body.ts`, `src/guards.ts`,
  `src/soft-delete.ts`, `src/list-query.ts`, and `src/storage/` where their actual
  contracts fit. A helper name does not prove that it preserves scope or a
  transaction. Keep unsupported behavior local; framework changes need an
  explicit user request.
- Apply policy at the route that owns it. Do not infer policy from method, URL,
  private route metadata, or arbitrary state keys.

For unresolved product behavior, use `$carta-module-design`. Existing user
instructions and approved decisions remain valid; routine code choices need no
new approval.

## Verification

Use the module's [verification strategy](../carta-module-development/references/verification-strategy.md)
for shared test selection. For API behavior, apply these criteria:

- Test a business rule or boundary that could fail: restricted records,
  foreign-child IDs, invalid state, server-owned fields, rollback, or a changed
  query. Assert the result and persisted state, including unchanged rows after
  rejection. A status code alone rarely proves a write is correct.
- Use a real database for SQL predicates, constraints, joins, and transactions.
  Use a small unit test for pure domain logic. Mock external storage or delivery
  at its boundary; mocking Drizzle cannot prove database behavior.
- Each case establishes its own relevant state. Use small fixture records and
  existing session helpers; inspect `src/testing/session.ts` for supported calls.
  Clean only test-owned rows, in foreign-key order, even after failure.
- Split unrelated rules into independent cases. A long create-update-delete
  journey hides later failures. Generic factory status, envelope, coercion, and
  trimming matrices belong in framework tests, not every module.
- Name the failure each test prevents. Omit tests that inspect source text,
  repeat schema declarations, assert calls to trivial wrappers, or copy the
  implementation to calculate the expected value. For a regression, confirm
  that the test fails without the fix.

Read `apps/api/package.json` for current check commands. Run type-check, lint,
and the relevant focused tests; include affected consumers when a contract
changes. The focused API command migrates the configured test database: inspect
its target guard and `.env.test.example` first. A development reset is not a
test prerequisite. Report failed or unrun checks; do not repeat valid checks
without a changed input or new risk.
