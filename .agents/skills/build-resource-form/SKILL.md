---
name: build-resource-form
description: Build or repair an ADS-HK `apps/web` resource form from the matching legacy form while keeping the frontend as a display and request client. Use for create or edit forms, `FormView`, `defineFields`, lookup fields, dependent lookups, lookup API design, or form parity work. Require server-side authorization, search, filtering, hierarchy rules, sorting, and pagination for every non-static lookup. Never use a combined unfiltered lookup payload or client-side domain filtering.
---

# Build Resource Form

Build one complete form slice. Use the legacy repository for product behavior and the current repository for architecture.

## Read before editing

Read all of these sources:

1. `AGENTS.md`.
2. `docs/architecture/web-application-architecture.md`.
3. `packages/is-vue-framework/README.md`.
4. `.agents/skills/web-ui-surface-reuse/SKILL.md`.
5. The current schema, resource, actions, route, API route, service, entity, and focused tests for the target module.
6. The matching legacy frontend config and backend model or service under `/Users/gamer/Documents/projects/ads-hk-legacy`.
7. [Legacy lookup pattern](references/legacy-lookup-pattern.md).

If the legacy path is not available, state this fact and infer only the missing product behavior from current domain evidence.

## Record the form contract

Before implementation, record one row for each field:

```text
Field | create/edit | renderer | required | source | dependency | server query | reset rule
```

Preserve the legacy field order, labels, required rules, dependencies, and business meaning unless the user asks for a change. Do not preserve legacy framework code or obsolete wire shapes.

For each UI surface, also record:

```text
Requirement: <screen need>
Reused: <framework component, renderer, or resource>
Searched: <framework and application paths>
Gap: <None or exact missing capability>
```

## Enforce the lookup boundary

Treat each non-static lookup as a server query.

The frontend may:

- send `page`, `limit`, `search`, sort values, and parent field values;
- display returned rows and metadata;
- send the selected ID or IDs;
- reset or disable a dependent field when its parent changes.

The frontend must not:

- fetch a module-wide lookup bundle;
- fetch all rows for several lookup fields from one endpoint;
- filter lookup rows by search, parent, project, division, status, hierarchy, or permission;
- build descendants or leaf sets from a full client dataset;
- resolve one selected ID with a list request followed by `.find()`;
- use a large static option array for database records.

Allow a client-side source only for a small closed code list that is part of the form contract, such as a status radio list. Database records are not static options.

## Implement lookup APIs first

Reuse the target domain resource list and detail endpoints when they support the required contract. Extend the application API when a required query is missing. Do not add a form-specific combined lookup endpoint.

For each lookup list endpoint:

1. Authenticate and apply permission or project scope in the database query.
2. Parse and allow only known query parameters.
3. Apply active-state, dependency, hierarchy, and search conditions in SQL.
4. Apply stable server sorting.
5. Apply `limit` and `offset` in SQL.
6. Count with the same conditions and return collection metadata.
7. Return only fields needed by the lookup and its table.

For each lookup detail endpoint:

1. Read one row by ID.
2. Apply the same access scope.
3. Return the display fields needed to hydrate an existing form value.

Keep submit validation authoritative. Recheck active state, access, and relationships even when the lookup list already limits valid choices.

## Bind the current resource form

Use `defineSchema`, `defineFields`, `defineResource`, and `FormView` for a standard form. Reuse an existing domain resource as the lookup `source`.

`LookupInput` already sends its search value in `searchParameters`. Its table sends `page` and `limit` in `query`. `createHonoResourceActions` merges both objects into the API query. Pass dependency values only:

```ts
projectId: {
  label: 'Project',
  form: {
    renderer: 'lookup',
    source: projects,
    props: { pick: 'id', view: 'name', required: true },
    behavior: {
      disabled: ({ draft }) => !draft.divisionId,
      props: ({ draft }) => ({ searchParameters: { divisionId: draft.divisionId } }),
      resetWhen: ({ draft }) => draft.divisionId,
    },
  },
}
```

Do not wrap an existing resource in a local lookup resource unless the server contract is different and cannot belong to that domain resource. Do not put domain filters in an app action after the response arrives.

Use `Form` with `defineFields` only for a real custom workflow. Keep routes responsible for navigation, dialogs, toasts, and workflow state.

## Verify the boundary

Add the smallest durable checks:

- API domain tests prove access scope, parent filters, hierarchy filters, search, and pagination for non-trivial lookup rules.
- A focused resource test proves dependency values, disable or visibility behavior, and reset rules.
- Do not test framework markup or repeat framework tests.

Run the focused API and web tests, web type-check, lint for changed files, and `git diff --check`.

Use the real create or edit form when available. In the browser network log, verify:

1. Opening one lookup calls only its domain endpoint.
2. The request contains `page`, `limit`, and required dependency values.
3. Search causes a server request.
4. The response contains only authorized and matching rows.
5. Editing hydrates selected values with detail requests, not full list requests.

Do not claim completion if any lookup still depends on client-side domain filtering.

## Report

Report:

- the legacy behavior preserved;
- each lookup endpoint and its server filters;
- `Reused`, `Searched`, and `Gap`;
- checks run and browser network evidence;
- any framework gap, without editing framework code.
