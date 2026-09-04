# Backend Form Contract

Use this reference when a resource form needs a new API route, a filtered
standard list source, a detail source, or a custom write action.

## Contents

- [Contract map](#contract-map)
- [Route rules](#route-rules)
- [List and detail sources](#list-and-detail-sources)
- [Write rules](#write-rules)
- [Custom actions and child writes](#custom-actions-and-child-writes)
- [Tests](#tests)

## Contract map

The web Hono adapter expects the typed route to provide the actions used by the
resource:

| Resource action | Wire operation | Successful response |
| --- | --- | --- |
| `list` | `GET /records/list` | `{ data, page, limit, total }` |
| `detail` | `GET /records/:id` | `{ data: record }` |
| `create` | `POST /records` | `{ data: record }`, usually `201` |
| `update` | `PATCH /records/:id` | `{ data: record }` |
| `delete` | `DELETE /records/:id` | `{ ok: true }` or the current module result |

Use `createHonoResourceActions(rpc.records, dataAdapter)` in the web actions
file. It wires list query values, identity values, request cancellation, and
response normalization. Do not hand-write a second fetch adapter for one
resource.

Use the current Sprindle route and model pattern:

```ts
export const recordModel = defineModel({
  path: '/records',
  entity: record,
  routes: {
    list: recordList,
    detail: recordDetail,
    create: recordCreate,
    update: recordUpdate,
    delete: recordDelete,
  },
})
```

The exact route declaration may differ for a custom domain route. Keep the
typed RPC shape aligned with the web adapter.

## Route rules

Every route must do all of the following:

1. Authenticate the caller.
2. Apply permission checks at the route boundary.
3. Apply organization, project, parent, and active-state scope in the query
   or service.
4. Parse query and body values with the runtime schema.
5. Validate relationships and business rules again during the write.
6. Return only the data required by the consuming surface.

Use entity schemas for ordinary record, create, update, and select shapes:

```ts
export const record = createEntity({
  table: records,
  schemas: {
    create: createInsertSchema(records).omit(serverOwned),
    update: createUpdateSchema(records).omit(serverOwned),
    select: createSelectSchema(records),
  },
})
```

Extend the generated schemas when a form needs trimmed text, a nested object,
an explicit enum, or a write-only relation array. Omit server-owned identity,
audit, and derived columns from client write schemas.

A list endpoint owns the query contract for its resource. A parent form may
pass dependency values to a source resource, but it does not declare the
source resource's filters. Read the shared parser in
`packages/sprindle/src/validation/common-schemas.ts` before adding a
route-specific schema. Add one only when the endpoint needs runtime
validation, coercion, or a typed guarantee that the shared parser does not
provide.

For list routes, parse the shared query values and apply the endpoint's domain
filters:

```ts
const query = listQuerySchema.parse(c.req.query())
const page = Number(query.page)
const limit = Number(query.limit)
const where = and(scopeCondition, customCondition(query))
```

Apply search, filters, stable sorting, `limit`, and
`offset((page - 1) * limit)` in SQL. Add a stable identity tie-breaker after
the requested sort so page results do not move between requests.

Use the same logical conditions for the rows and count queries. A count that
ignores scope, search, or a parent filter makes the form source report false
pages.

## List and detail sources

Import the owner resource as the field `source`. The owner `list` and
`detail` actions are the only allowed option sources. Pass
`searchParameters`. Do not redeclare the owner query. Do not add
`/<consumer>/create-options/*`. Do not add `/lookup`. Do not add a second
list on the consumer. API list and detail use `list-*` / `detail-*`.
Resource `permission` stays `view-*` for the admin screen.

If the owner list or detail cannot serve the field, stop. Tell the user
the missing owner filter or contract. Use the brainstorming skill with the
user before you add or change a route. Do not invent a custom endpoint.

Use a standard list and detail pair for every database-backed form source.

The list action should:

- accept `page`, `limit`, and `search` when the input supports server search;
- accept every parent or status parameter used by the field;
- return only the fields needed by the option display, normally `id`, `name`,
  and an optional `code`;
- apply access scope before search and paging; and
- return `{ data, page, limit, total }`.

The detail action should:

- accept one identity;
- use the same access and relationship rules as the list action;
- return `{ data: record }`; and
- return the current not-found response when the identity is not available.

The detail action is required for edit forms. It loads a selected value when
that record is not in the current list page. Do not load the full collection
just to resolve one selected record.

For dependent sources, enforce the parent on the server. A missing required
parent must produce the module's clear validation response or an empty
authorized result, according to the route contract. Do not return records from
other parents.

## Write rules

Parse input before calling the service:

```ts
const input = record.schemas.create.parse(await c.req.json().catch(() => ({})))
```

For create and update:

- check the caller's permission and scope;
- validate every referenced identity;
- validate active state and parent relationships;
- validate unique values and state transitions;
- ignore client values for server-owned columns; and
- return the saved record through the select schema or the module's declared
  response projection.

A filtered source is only a user interface aid. It does not authorize a
submitted identity. Repeat the check in the write service.

Keep delete checks separate from update checks when the domain rules differ.
Return not-found for an inaccessible identity when that is the current module
security pattern. Do not reveal records through validation messages.

## Custom actions and child writes

Do not add a custom endpoint for options, search, or a filtered list. Those
stay on the owner `list` and `detail`.

A custom write is only for a domain state transition that create, update, or
delete cannot express. If you think you need one, stop. Ask the user. Use
the brainstorming skill. Do not invent the route, permission, or payload.

After the user approves a custom write, use it when the operation is a
state transition, has a distinct permission, accepts a different input
shape, returns a different projection, or must execute several writes
atomically.

```ts
const actionInput = z.object({ reason: z.string().trim().min(1) })

export const closeRecord = defineRoute({
  path: '/:id/actions/close',
  method: 'post',
  authorize: [authenticated(), requirePermission('close-records')],
  state: async ({ c }) => ({
    input: actionInput.parse(await c.req.json().catch(() => ({}))),
  }),
  action: async (args) => {
    const identity = await actor(args)
    const id = requiredId(args)
    return args.c.json({ data: await closeRecordFor(identity.userId, id, args.state.input) })
  },
})
```

Keep the state check in the service. When a parent form submits child rows,
validate the complete parent-child set and use one transaction. Use a separate
child resource when child rows have their own route, permission, list, detail,
or actions. Keep route-local child editing when the rows exist only inside one
parent workflow.

## Tests

Add focused tests at the smallest useful layer:

- route tests for authentication, permission, malformed input, not-found, and
  response shapes;
- service tests for scope, parent relationships, state, and transaction
  behavior;
- list tests for search, custom filters, stable sort, page, limit, and count;
- source tests for required parent parameters and selected-record detail; and
- end-to-end or browser checks for create, edit, dependent fields, and submit.

Use current fixtures and helpers. Do not add a broad test matrix for a simple
field when an existing resource or route test already covers the behavior.
