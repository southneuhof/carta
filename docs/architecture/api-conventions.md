# Backend API conventions

Conventions for `apps/api` (Hono + Sprindle + Drizzle). This file is the
human-readable summary; the operational rule book for agents is the
`api-conventions` skill (`.agents/skills/api-conventions/SKILL.md`). When rules
change, change the skill first, then this file — they must not diverge.
Framework vocabulary lives in
[`packages/sprindle/docs/reference.md`](../../packages/sprindle/docs/reference.md);
read it before inventing names.

## 1. Module classes and their canonical pattern

Pick one pattern per module class. Do not invent a fourth.

### Pattern A — standard CRUD master data

Drizzle table + drizzle-zod schemas + `createEntity`, and factory routes
(`list()`, `detail()`, `create()`, `update()`, `deleteRoute()`) inside
`defineModel`. Authorization uses `authorize:` arrays of
`[requirePermission('<code>')]`. Project- and division-owned records use
`requireProjectRecord` or `requireDivisionRecord` after the owner is known.
A route with `requirePermission(...)` (also
`requireScopedLookupPermission`) is already
authentication-guarded: unauthenticated callers get 401 from the identity
check, so do not pair it with `authenticated()`. Attach bare `authenticated()`
only when a route needs a session but no permission code. Custom behavior goes
into `before` / `validate` / `after` hooks or the constructor's narrow `run`
callback. A `defineRoute` call describes only a custom HTTP contract; it has no
resource operation field. Do not dispatch route policy on route metadata,
method, or path. Use a custom action only when the response or write flow is
not expressible by the factories.

Exemplar: `apps/api/src/routes/uoms/uoms.ts`.

Audit stamping rule: `app.ts` installs `dataWrite: auditStamp()` with one
callback. It receives the narrow `operation` value (`create` or `update`) and
returns server-owned values. Only canonical `create()` and `update()` invoke
it. The stamp travels in the `{ values }` bag, which Sprindle merges after
schema validation and which wins over client keys; never put stamps into
`state.input`. `dataWrite.operation` is a write-stage value, not route
metadata. A custom route state property named `values` is inert to automatic
audit stamping. Child rows and true custom writes stamp their own values inside
their transaction.

Constructor `run` ownership: the constructor owns method, path, input parsing,
success status, response envelope, and the documented return shape. `run` owns
custom persistence; create/update applies `state.values` after client input,
and scoped list/update/delete applies `state.where` when used. Update returns
`undefined` for not found; delete throws `notFound()` when no valid row is
affected. Sprindle cannot enforce these source rules for arbitrary SQL, so
focused domain tests must prove them.

### Pattern C — domain surfaces

A module whose routes enforce structural domain rules or manage embedded child
collections keeps thin custom actions beside factory routes for its standard
surface. Every retained custom action carries a one-line header comment naming
its reason (`// CUSTOM SURFACE — ...`). Exemplars:
`law-reference-items` (level/parent/cycle rules, recursive soft delete, tree
endpoint), `learning-materials` questions/answers (child-collection workflows),
`syllabus` (final-quiz synthesis). Soft deletes route through the app kernel
(`src/soft-delete.ts`) and read scopes compose through `src/scopes.ts`; a
custom action is legitimate only when factories plus hooks cannot express it.

### Pattern D — workflow domains

Multi-step state machines, child rows, and cross-module writes use thin
`<name>.routes.ts` handlers delegating to `<name>.service.ts` functions.
Permission checks that depend on a loaded record live inside the service via
`requireProjectRecord` or `requireDivisionRecord`; collection scope uses
`accessibleProjectIds` or `accessibleDivisionIds` with the exact collection
permission. Static entry permission codes stay in `authorize:` arrays.

Exemplar: `apps/api/src/routes/quality-inspection/`.

### Legacy drift

Hand-rolled routes are drift only when a factory migration exists for them
today — filtering, pagination, envelope, or write logic that the canonical
factories plus hooks can express. Do not copy such files; migrate them when
touched. Routes that fail byte-equality against the factories belong to
Pattern C instead and carry their recorded header.

## 2. Request plumbing vocabulary

Shared request helpers:

- `requireOrgIdentity(args)` and `requirePathParam(args, 'id')` from
  `src/identity.ts`
- `normalizeListQuery` from Sprindle removes exact empty HTTP values before
  list parsing. This is built-in framework behavior, not app configuration.
- list-query helpers (`reservedQueryKeys`, `equalityFilters`, search, order)
  from `src/list-query.ts`; `equalityFilters` also skips empty values for
  manual callers.

Never define local `actor`, `caller`, `requiredId`, `reservedQueryKeys`,
`equalityFilters`, or `orderBy` copies in a module.

Static read policy belongs on `entity.read`: use `searchColumns` for fixed
search columns and `pinnedOrder` for forced order. Use a route `before` hook
for identity scope, owner-list permission, and other dynamic domain filters.
Owner-list `permission` is a project-level policy. Non-owner lists must not silently
delete it; a non-empty unknown key returns 400.

Write schemas own text trimming and blank-to-null conversion. Use the shared
`src/schema.ts` `optionalText(max)` for nullable text. Stored application file
keys use `uploadKey`; external URLs need an explicit domain schema. Keep audit
and identity values in the server-owned `values` bag.

Selection contract: a multi lookup or select request and response uses
`selectionValues(exactItemSchema)`. The item schema owns its keys; it does not
need `id` or `name`. A service may map the submitted identity keys to join rows
inside its transaction, then reads current labels from the database and
returns the same object-array contract. Do not accept scalar ID arrays for a
multi lookup or select. Use `selectionQuery(itemSchema)` for object-array
filters encoded as JSON query values.

## 3. Transaction typing

Services import `Db`, `Tx`, and `DbOrTx` from `src/db.ts`. A `tx: any`
parameter is a lint error, not a shortcut.

## 4. Soft delete convention

New tables use a nullable `deletedAt` timestamp (plus optional
`deletedByUserId`, `deletedReason`) and filter with `isNull(deletedAt)`. The
two former boolean-`deleted` tables (`law-reference-items`,
`customer-oppinion-question-categories`) were migrated to nullable
`deletedAt`; nullable `deletedAt` is the single convention. Delete paths use
the shared `src/soft-delete.ts` helpers (`softDeleteRoute`,
`softDeleteValues`); do not replicate legacy boolean flags.

## 5. Audit columns

Entities keep copying the local `auditFields` block. Do not unify it into a
shared helper: copies differ in nullability
(`quality-inspection.entity.ts` declares `.notNull().references(...)`), so one
shared block would silently change schema semantics. This is accepted
duplication.

## 6. Registration reminder

A new module registers once in `apps/api/src/routes/index.ts` as
a `defineModule({ domain, models })` bundle — or is generated through the manifest pipeline,
which inserts it. A bundle missing its `domain` fails at boot with an unbound-model error.
