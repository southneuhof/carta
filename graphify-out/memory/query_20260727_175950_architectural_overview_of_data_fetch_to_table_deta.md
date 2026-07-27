---
type: "query"
date: "2026-07-27T17:59:50.299791+00:00"
question: "Architectural overview of data fetch to table detail form in apps/web and how to simplify unnecessary layers"
contributor: "graphify"
outcome: "useful"
source_nodes: ["roles.resource.ts", "defineResource.ts", "Table core", "useLoader", "createHonoResourceOperations()", "roleModel"]
---

# Q: Architectural overview of data fetch to table detail form in apps/web and how to simplify unnecessary layers

## Answer

Expanded from original query via vocab: [fetch, query, client, server, route, table, detail, form, hook, provider, schema, mutation]. Roles path shows route to View shell to defineResource surface factory to core component to useLoader and TanStack Query to ResourceOperations to Hono RPC to Sprindle model and Drizzle. Main simplification: make ResourceOperations canonical data boundary, remove second DataAdapter record and collection normalization, merge per-resource operations file into Hono-aware resource declaration, remove legacy table and detail runtime capabilities, and narrow resource-first View APIs. Keep route, resource descriptor, query cache, typed transport, server model, and core renderer.

## Outcome

- Signal: useful

## Source Nodes

- roles.resource.ts
- defineResource.ts
- Table core
- useLoader
- createHonoResourceOperations()
- roleModel