---
name: web-ui-surfaces
description: Build or review Carta apps/web routes with the current schema-bound resource API and @southneuhof/loom surfaces. Use for lists, details, forms, dialogs, filters, actions, and layout. Do not use for backend or architecture-only work.
---

# Web UI surfaces

Use this skill for `apps/web` UI work.

## Discover before edits

Read:

- `docs/ui/README.md`, then each UI contract branch named for the changed
  surface;
- `docs/architecture/web-application-architecture.md`
- `packages/loom/README.md`
- the owning schema, resource or actions file, route, and focused tests

Then search framework exports and `apps/web/src/framework` for the needed
surface or behavior. Use nearby routes only for domain evidence. The UI
contract owns visual structure and interaction.

Record this before route edits:

```text
Route/surface: <exact route and list/detail/row/form/custom surface>
Requirement: <UI contract pattern, visible behavior, and actions>
Reused: <resource API, component, renderer, slot, or app helper>
Searched: <framework and app paths>
Gap: <None, or the exact missing capability>
```

When the framework lacks a UI contract capability, record
`framework-gap: <capability>` and stop before a local substitute or framework
edit.

## Select the surface

- Standard CRUD: `defineSchema` + `defineFields` + `defineResource`, then
  `ListView`, `DetailView`, or `FormView` with the standard action prop bag.
- Custom collection or record: use `Table`, `Detail`, `Form`, and existing
  composite or base components.
- Workflow detail: use the route-owned layout in
  [references/detail-layout.md](references/detail-layout.md).

Read [references/surfaces.md](references/surfaces.md) for resource actions,
collection slots, action overrides, custom-surface permissions, dialogs, and
filters. Read [references/fields.md](references/fields.md) when fields, forms,
relations, or dependent lookups change.

## Hard rules

1. Routes own URLs, query state, navigation, dialogs, confirmations, toasts,
   and workflows. Change only the named surface; do not remove an action from
   another surface. Route components do not call raw RPC endpoints.
2. Schemas own standard record, query, create, and update validation. Use
   `fromZod(schema)` with no caller-supplied output type.
3. Resources own standard actions and fields. Use
   `createHonoResourceActions(rpc.<module>)`; response normalization is already
   owned by that app adapter. Custom actions expose only `{ run }`.
4. The standard action object is both the View prop bag and the execution path:
   `v-bind="resource.list()"` and `resource.update({ id }).run(input)`. Do not
   rebuild a prop bag or add an operations mirror.
5. Every declared delete action has an explicit permission string or explicit
   `null`. Every destructive control uses a confirmation.
6. Standard actions invalidate their resource automatically. After a custom
   action, await `resource.invalidate({ id })` or `resource.invalidate()`.
7. Use generated file-route names in resources and the typed navigation
   manifest. Do not invent route names or create route folder barrel files.
8. Use the UI contract and existing framework component for layout, copy,
   fields, collection states, and actions. A proved domain workflow can add
   minimum route-local composition. A framework gap needs user approval before
   any framework or local substitute change.

## Verify

Read [references/verification.md](references/verification.md). A user-facing
change is not complete until its focused Playwright journey passes.
