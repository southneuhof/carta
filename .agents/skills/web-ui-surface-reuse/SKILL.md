---
name: web-ui-surface-reuse
description: Select, compare, and verify reusable @southneuhof/is-vue-framework surfaces for apps/web UI changes, including route-scoped actions, sibling CRUD conventions, and real-browser visual checks. Use when implementing or reviewing routes, filters, forms, tables, details, dialogs, tabs, inputs, or other web UI; do not use for backend, API, database, or architecture-only work.
---

# Web UI surface reuse

Use this skill only for `apps/web` UI work. Keep framework discovery out of
backend and architecture-only tasks.

## Discover before editing

Read these files first:

- `AGENTS.md`
- `docs/architecture/web-application-architecture.md`
- `packages/is-vue-framework/README.md`
- the nearest route, resource, and existing route test

Then search the framework and application for the required surface. Prefer
`rg --files packages/is-vue-framework/src/components` and searches for the
component name, renderer key, and a nearby usage. Do not infer that a native
HTML control is the intended implementation from its visual shape.

Make this decision before writing code:

```text
Requirement: <what the screen needs>
Reused: <exact component, renderer, or slot>
Searched: <exact framework and application paths>
Gap: <None, or the missing framework capability>
```

Keep this record in the plan or task notes. Do not start route UI changes until
the route, surface, action scope, and reuse decision are recorded.

## Establish route scope before editing

Before removing, adding, or renaming a control:

1. Identify the exact route and surface: list, detail, row, form, or shared
   component.
2. Write the intended action change for that surface only.
3. Check sibling CRUD routes for the standard action names and layout.
4. Do not remove an action from another surface because it uses the same
   component or label.

When the request is ambiguous, stop and ask for the surface or preserve actions
on other surfaces until their scope is clear. After the change, verify that the
intended surface changed and the other surfaces still have their actions.

## Reuse sibling UI patterns

Search nearby CRUD routes before creating a custom action or layout.

- Reuse the sibling route's standard action names, such as `View`, `Edit`,
  `Delete`, or `Create`.
- Reuse its action grouping and alignment, including horizontal row actions.
- Prefer one existing standard action over a custom equivalent such as `Open`.
- Use custom controls only when the sibling pattern cannot express the
  requirement. Record the exact gap.

When legacy is the business reference, use the exact label from the approved
legacy label ledger for fields, headings, actions, dialogs, and messages. Do
not translate, shorten, improve, or invent a synonym. An unapproved label
difference is a review failure.

## Use the framework surfaces

Use these mappings unless a documented gap exists:

| Need | Use |
| --- | --- |
| Standard list | `ListView` with a resource or table props |
| Standard detail | `DetailView` with a resource or detail props |
| Standard form | `FormView` with a resource |
| Custom collection | `Table` |
| Custom record view | `Detail` |
| Custom form or filter controls | `Form` with `defineFields` |
| Select field | `Form` field with `renderer: 'select'` (resolves `SelectInput`) |
| Lookup field | `Form` field with `renderer: 'lookup'` |
| List filters | `ListView` `filters` slot containing a `Form` |
| Buttons, alerts, cards, loading | Framework base components |
| Tabs, dialogs, search, filter chips | Framework composite components |

For a Form select, use the field contract and an option source:

```ts
divisionId: {
  label: 'Division',
  form: {
    renderer: 'select',
    source: divisions,
    props: { pick: 'id', view: 'name' },
  },
}
```

Do not author a native `<select>` in an application route when the framework
select renderer exists. Do not replace framework tables, forms, dialogs,
switches, buttons, or tabs with route-local equivalents. Direct input imports
are for cases outside Form composition; Form fields must use the renderer
registry.

## Handle real gaps

When no framework surface fits, keep the smallest implementation route-local.
Add an inline `framework-gap:` comment that names the missing capability and
the likely framework extension. Do not edit `packages/is-vue-framework`
without explicit user approval.

## Verify the result

Test the observable UI surface, not only helper functions. For every changed
route, verify in an authenticated real browser or T3 preview:

- requested controls exist on the intended surface and remain on other
  surfaces;
- action labels and alignment match sibling CRUD routes;
- tree hierarchy remains clear after first load and reload;
- indentation is stable and connector arms do not make the hierarchy unclear.

Tests do not prove that the visible UI is correct. If browser verification is
not possible after a valid retry, report `UI UNVERIFIED` or `BLOCKED`; do not
mark the plan `DONE` or report the route complete.

For a framework surface change, run the focused route test, web type-check,
lint, and `git diff --check`.
In the final summary, state `Reused`, `Searched`, and `Gap` with exact paths or
component names.
