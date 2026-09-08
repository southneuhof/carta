---
name: web-ui-surfaces
description: Build or review Carta web pages, app navigation, collections, record details, and workflow controls.
---

# Web UI surfaces

Use Carta's page shells and controls as the starting point. Adapt content,
density, and layout to the user's task. Consistency comes from shared controls,
clear hierarchy, and predictable behavior, not identical pages.

## Find the current boundary

Read `docs/architecture/web-application-architecture.md`, `docs/ui/README.md`,
and the UI branch for the changed surface. Inspect its route, schema, resource,
app adapter, and the relevant Loom exports. For a new app surface, inspect
`apps/web/src/main.ts`, app defaults, navigation manifest, and authenticated
layout before adding another owner for them.

Use nearby modules as evidence, then check their pattern against the current
public API. Copy neither obsolete contracts nor unnecessary layers. Keep
framework changes within explicit user scope; compose supported controls
locally when the requested behavior needs a custom body.

## Choose and build

| Work | Read |
| --- | --- |
| New page, app shell, navigation, visual hierarchy, responsive layout | [App conventions](references/app-conventions.md) |
| Lists, cards, filters, actions, dialogs | [Surfaces](references/surfaces.md) |
| Workflow detail, history, related records | [Detail layout](references/detail-layout.md) |
| Display fields and relation labels | [Fields](references/fields.md) |
| Form values, sources, dependencies, child editing | [Build resource forms](../build-resource-form/SKILL.md) |

Routes own URLs, query state, navigation, dialogs, and workflow feedback.
Schemas own data validation. A resource owns standard actions and one shared
field catalog. Pass the returned action directly to its View:

```vue
<ListView v-bind="records.list()" />
<DetailView v-bind="records.detail({ id })" />
<FormView v-bind="records.create()" />
<FormView v-bind="records.update({ id })" />
```

Use `createHonoResourceActions(rpc.<module>)` for standard transport. It already
normalizes responses. Keep custom transport in app actions, with a typed
`{ run }` resource action when needed. Routes do not call raw RPC endpoints.
A file or wrapper earns its place when it owns behavior; simple standard
resources can call the adapter directly without a separate actions file.

## Check the result

Use [verification](references/verification.md). Report visible behavior checked,
failed checks, and any unverified result. Reuse the parent module's evidence;
do not start a second verification process.
