# Standard CRUD module

Use for a resource whose behavior fits the canonical factories. Read
`apps/api/src/routes/tools-types/` first. Use `uoms/` only when you need its
fixed list filter or reference-delete guard.

## Entity

Create `<name>.entity.ts` with the Drizzle table, drizzle-zod create, update,
and select schemas, and `createEntity`. Copy the nearest entity's local
`auditFields` block because its nullability can differ. Omit primary key,
audit, soft-delete, and other server-owned fields from client write schemas.

Use shared schema helpers such as `optionalText()` from `src/schema.ts`. Put
static read policy on the entity. Preserve directly observed legacy search,
filter, and default order behavior; do not accept broader Sprindle defaults
when the legacy contract is narrower or uses a different order.

- `read.searchColumns` limits searchable columns.
- `read.pinnedOrder` forces a server order.

For a database relation, keep the scalar ID or code in write schemas. Add the
Drizzle relation through `defineRelationsPart`, and use the related entity's
`schemas.select` for the nested field in the select schema. The canonical
source must hydrate it for list, detail, create, and update.

## Model

Create `<name>.ts` with one `defineDomainPart` and one `defineModel`. Use
`list`, `detail`, `create`, `update`, and `deleteRoute`. Put
`[requirePermission('<code>')]` on each route.

Keep every resource constructor inside `defineModel`. A top-level installable
route must be a true custom `defineRoute` with an explicit path.

Prefer declarative behavior:

| Need | Use |
|---|---|
| Default list sort | `list({ query: { defaultSort: 'name' } })` |
| Enum list filter | `list({ query: { enumFilters: { categoryCode: codes } } })` |
| Boolean equality filter | Built-in source coercion; add nothing |
| Fixed, parent, realm, or identity scope | `list/detail/update/deleteRoute` route `before` returning server-owned `{ where: (table) => predicate }` |
| List row decoration | `list({ enrich })` |
| Detail/create/update record decoration | Factory `enrich(record, args)` |
| Write-domain check | Route `validate` or Zod schema |
| Referenced-row delete check | `deleteGuard([{ table, fkColumn }])` |
| Soft delete | `softDeleteRoute` |

`app.ts` installs `dataWrite: auditStamp()`. Its one callback receives the
operation (`create` or `update`) and supplies server-owned audit values only to
those constructors. Do not add route-level audit hooks or infer writes from
route metadata or state shape.

`where` and `enrich` have separate jobs:

```ts
update({
  authorize: [requirePermission('update-things')],
  before: () => ({ where: (table) => eq(table.parentId, parentId) }),
  enrich: (record, args) => addDomainData(record, args),
})

deleteRoute({
  authorize: [requirePermission('delete-things')],
  before: () => ({ where: (table) => eq(table.parentId, parentId) }),
})
```

The source combines update/delete `where` with the primary key in one
statement. Request input cannot set or widen it. A hidden row gets the same
404 as a missing row. Do not do an access read followed by an unscoped write.

Record `enrich` runs after a successful source call and before the factory
builds `{ data }`. It returns a replacement record or `void`. Use it to add
allowed operations, derived fields, or ordered/filtered child data. Use the
given base record and query only the extra data. Do not parse
`args.response.json()` and do not make a custom route only to rebuild the
record envelope. Keep `after` for full HTTP response changes.

If the canonical wire contract is correct but the default source call is not,
keep the factory and use `run`:

```ts
create({
  authorize: [requirePermission('create-things')],
  run: async (args) => {
    const input = thingCreateSchema.parse(args.state.input)
    const rows = await getDb().insert(things).values({
      ...input,
      ...args.state.values,
    }).returning()
    const row = rows[0]
    if (!row) throw validationError('Thing was not created.')
    return row
  },
})
```

- `list.run` returns `{ data, total }`; the constructor adds page and limit.
- `create.run` and `update.run` return the record. Update can return
  `null`/`undefined` for the canonical 404.
- `deleteRoute.run` returns `void` and throws `notFound()` for a missing row.
- Create/update persistence applies `args.state.values` after client values so
  server-owned audit values win.
- Scoped list/update/delete persistence applies `args.state.where` in its SQL.
- A `run` callback never returns `Response`, an envelope, a status, or a
  method/path override. Detail has no `run` seam.

Use `defineRoute` only when the HTTP contract is truly custom. Declare its
real method, path, input, and output. It has no `kind` or `operation`. Add
`// CUSTOM SURFACE — <reason>`, and use `readJsonBody`, `requirePathParam`,
plain object returns, and `created()` as applicable.

For a true custom list contract, normalize it with `normalizeListQuery` and
reuse only the needed helpers from `src/list-query.ts`: `reservedQueryKeys`,
`equalityFilters`, `searchCondition`, and `orderClause`. Do not use this path
when the canonical `list()` contract fits.

## Registration, permission, and migration

- Add one `defineModule({ domain, models })` entry to the ordered `modules`
  literal in `src/routes/index.ts`. Do not create a second route or domain list.
- Add permission codes to `src/authorization/catalog.ts`. Standard permission
  codes use `<verb>-<authorization-module-code>`. The six standard verbs are
  `view`, `list`, `detail`, `create`, `update`, and `delete`. `view` grants
  module or surface access, `list` grants collection access, and `detail`
  grants record access. `create`, `update`, and `delete` grant their matching
  mutations.
- A custom route action may extend the standard set. Use the action segment in
  the URL as the permission verb, so `/users/verify` uses `verify-users`.
  Record the exact code and realm in the module permission matrix, then use it
  in the catalog, route guard, navigation, seed, and tests. Existing legacy
  codes outside this form need an explicit matrix entry.
- Run `db:generate`; review the new SQL; then run dev `db:migrate` and
  `db:seed`. Never edit an applied migration.

## Focused specification

Start from `tools-types.routes.spec.ts`. Use `createSystemSession`; use
`testId` when a test needs generated row identifiers. Use `seedProject` only
when records need a project tree. Delete business rows in foreign-key order.
Session cleanup runs when the test pool closes.

Test the module's domain behavior and its authorization boundary. Do not copy
a broad CRUD matrix when the factories already test the generic wire behavior.
Run only the module spec with `test:focused -- <spec>` unless a focused failure
shows a cross-module risk.
