# Web Application Architecture

- **Status:** Shipped; this document describes the implemented API
- **Scope:** `apps/web` and reusable web framework APIs in `packages/is-vue-framework`
- **Last updated:** 2026-07-26 (reconciled to the shipped API; the former Addendum is folded into the body)

## Context

South Neuhof applications are usually a mixture of:

- resource-oriented list, detail, and form screens;
- nested resource screens inside a parent record;
- custom workflows and fully custom routes.

The current architecture accelerates these applications through `CRUDComposite`,
`CRUDList`, `CRUDDetail`, `CRUDCreate`, and `CRUDUpdate`. It also hides important
application structure inside query parameters, slot conventions, injected data,
and one broad model configuration.

This architecture keeps the useful parts—automatic resource operations,
consistent application surfaces, configurable fields, and shared components—while
removing the CRUD state machine and making routes, data dependencies, and custom
behavior explicit.

## Goals

- Make filesystem routes the source of truth for application navigation.
- Keep standard resource API calls automatic and project-specific transport code
  outside feature components.
- Make resource definitions produce native props for framework components.
- Keep `Form`, `Table`, and `Detail` highly configurable and usable without a
  resource.
- Preserve a consistent application look through reusable visual surface shells.
- Support nested resources without a separate "nested resource" vocabulary.
- Keep custom workflows as ordinary TypeScript and Vue code.
- Make normal usage short while preserving explicit escape hatches.
- Make architecture easy to trace for both humans and agents.

## Non-goals

- Sharing the schema with the mobile application. Mobile is intentionally ignored
  for this iteration.
- Encoding arbitrary workflows as configuration.
- Generating every route from a resource declaration.
- Making API response formats part of core component contracts.
- Retaining `CRUDComposite` as a route or view-state orchestrator.

## Architectural principles

1. **Routes own navigation.** A list, detail, create form, update form, or nested
   resource that is independently meaningful receives a route.
2. **Resources own standard data behavior.** A resource identifies standard list,
   detail, create, update, and delete operations without repeating transport calls.
3. **Core components own data presentation and editing.** They do not own page
   chrome, routes, resources, permissions, or CRUD modes.
4. **Surface shells own the application look.** Cards, headers, toolbars, and
   standard controls remain consistent without being pushed into core components.
5. **Configuration describes data. Code expresses control flow.** When behavior
   needs branching, sequencing, or substantial side effects, use ordinary code.
6. **Hide mechanics, not intent.** Standard HTTP mechanics may be inferred;
   resource identity, parent scope, and custom workflows remain visible.

## Layers

```text
filesystem routes
  -> resource prop bags
    -> visual surface shells
      -> core components
        -> renderers and inputs

project adapters
  -> resource runtime
    -> generated prop bags and data loaders
```

### Filesystem routes

Routes choose which surface is active and compose pages. No component switches
between list, detail, create, and update based on a query-string state machine.

```text
src/routes/(authenticated)/emergency/incidents/
  index.route.vue
  new.route.vue
  [incidentId].layout.vue
  [incidentId]/
    index.route.vue
    edit.route.vue
    actions/
      index.route.vue
      new.route.vue
      [actionId].route.vue
    victims/
      index.route.vue
    asset-damages/
      index.route.vue
      new.route.vue
      [damageId].route.vue
```

The route structure itself expresses nesting. There is no `NestedResourceList`,
`NestedCRUD`, or equivalent abstraction.

### Resource definitions

A resource combines:

- stable identity;
- typed standard operations;
- shared field catalog;
- list, detail, create, and update surface definitions;
- default permissions and stable control policies;
- query schemas and default query namespaces.

Standard operations are inferred from the configured RPC integration when
available. Resources without RPC provide their loaders and submitters manually.

```ts
export const incidents = defineResource({
  key: "incidents",
  rpc: rpc.incidents,
  identity: (incident) => incident.id,
  fields: incidentFields,

  list: {
    fields: [
      "incident_name",
      "section_id",
      "accident_date",
      "shift",
      "status_code",
    ],
    query: incidentListQuerySchema,
  },

  detail: {
    fields: [
      "incident_name",
      "section_id",
      "accident_date",
      "accident_time",
      "source_id",
      "status_code",
    ],
  },

  create: {
    fields: incidentFormFields,
    initial: { is_accident: true },
  },

  update: {
    fields: incidentFormFields,
  },
});
```

The resource exposes callable prop factories returning exact native props:

```ts
incidents.table();
incidents.table({ searchParameters: { section_id } });
incidents.detail({ id: incidentId });
incidents.form();
incidents.form({ id: incidentId });
incidents.form({ initialData });
```

`table(args?)` takes optional `{ searchParameters, namespace, query }`;
`detail({ id })` requires the record identity; `form()` wires the create submit
and create schema while `form({ id })` wires the record load, update submit, and
update schema. Overloads make `id` non-nullable, so a possibly-undefined route
param is a compile error rather than a silent create form. Results are memoized
per normalized arguments, and load re-execution is governed by the deterministic
query key, never by closure identity. Call-site overrides are plain object
spread: `v-bind="{ ...roles.form({ id }), submit }"`.

These values satisfy the props of the corresponding core components and surface
shells. They are not resource objects interpreted by those components.

### Core components

The three core components are deliberately resource-agnostic.

#### `Table`

`Table` represents a collection. It owns collection rendering, namespaced query
state, pagination, sorting, selection, loading, refreshing, empty, and error
states. It does not own page headers, Cards, route navigation, or CRUD controls.

#### `Detail`

`Detail` represents one record. It owns record loading, field rendering, loading,
refreshing, and error states. It does not own page layout, route navigation, or
edit/delete controls.

#### `Form`

`Form` owns mutable draft state, field rendering, Zod validation, loading initial
data, and submission. It does not know whether it is creating, updating, or
executing another workflow.

Create behavior is simply a form with no loader and a submitter:

```ts
{
  fields,
  initial,
  submit,
}
```

Update behavior is a form with a loader and a submitter:

```ts
{
  fields,
  load,
  submit,
}
```

There is no `mode="create"` or `mode="update"` prop.

### Visual surface shells

Surface shells preserve the normal application look without contaminating core
components with CRUD assumptions.

- `ListView` composes a Card/container, title, list toolbar, standard controls,
  and `Table`.
- `DetailView` composes a Card/container, title, detail toolbar, layout regions,
  standard controls, and `Detail`.
- `FormView` composes a Card/container, title, form toolbar, and `Form`.

Normal route usage stays concise:

```vue
<ListView :table="incidents.table()" />
<DetailView :detail="incidents.detail({ id: incidentId })" />
<FormView :form="incidents.form()" />
<FormView :form="incidents.form({ id: incidentId })" />
```

The primitives remain available for custom composition:

```vue
<Table :load="loadRecentIncidents" :fields="compactFields" />
<Detail :data="incident" :fields="summaryFields" />
<Form :load="loadDraft" :submit="publishDraft" :fields="draftFields" />
```

Surface shells are visual compositions, not resource adapters. They receive
native props, do not discover APIs, and do not switch between CRUD states.

## Native prop matching

Resources and surface schemas are co-designed. `defineResource` produces exact
prop bags instead of requiring `ResourceForm`, `ResourceTable`, or another adapter
component.

Conceptually:

```ts
type ListSurface<TRecord, TQuery> = {
  title: string;
  description?: string;
  table: TableProps<TRecord, TQuery>;
  controls: ListControls<TRecord>;
};

type DetailSurface<TRecord> = {
  title: string;
  detail: DetailProps<TRecord>;
  controls: DetailControls<TRecord>;
};

type FormSurface<TInput> = {
  title: string;
  form: FormProps<TInput>;
};
```

Use exact surfaces:

```vue
<ListView :table="incidents.table()" />
```

Do not bind a whole resource:

```vue
<!-- Do not do this. -->
<ListView v-bind="incidents" />
```

Exact surfaces prevent unrelated resource properties from leaking through Vue
attribute fallthrough and preserve strict prop typing.

## Shared field catalog

The current parallel maps (`fieldsAlias`, `fieldsType`, `fieldsProxy`,
`fieldsParse`, and similar properties) are replaced by one field catalog.

```ts
const incidentFields = defineFields<Incident>()({
  incident_name: {
    label: "Nama Insiden",
    form: {
      renderer: "text",
    },
    table: {
      sortable: true,
    },
    detail: {
      emphasis: "strong",
    },
  },

  status_code: {
    label: "Status",
    display: {
      renderer: "chip",
      props: {
        options: incidentStatusOptions,
      },
    },
    form: {
      renderer: "radio",
      props: {
        options: incidentStatusOptions,
      },
    },
  },

  accident_date: {
    label: "Tanggal Insiden",
    display: {
      format: "date",
    },
    form: {
      renderer: "date",
    },
  },
});
```

Shared properties apply across surfaces. `form`, `table`, and `detail` contain
surface-specific behavior.

### Field access

Ordinary fields need no accessor configuration:

```ts
read = (record) => record[fieldKey];
write = (draft, value) => {
  draft[fieldKey] = value;
};
```

`read` and `write` are escape hatches for extraordinary fields.

Current `fieldsProxy` behavior becomes `read`:

```ts
section_id: {
  label: 'Ruas',
  read: (record) => record.rel_section_id,
}
```

A field backed by multiple properties may define both:

```ts
location: {
  read: (record) => ({
    latitude: record.latitude,
    longitude: record.longitude,
  }),
  write: (draft, location) => {
    draft.latitude = location.latitude
    draft.longitude = location.longitude
  },
}
```

## Universal `load` contract

All three core components obtain optional data through `load`. The source is an
implementation detail.

```ts
type Load<TArgs, TResult> = (
  args: TArgs,
  context: { signal?: AbortSignal },
) => TResult | Promise<TResult>;
```

A loader may read from an API, IndexedDB, local state, fixtures, or a computed
projection. Components only require a normalized result.

```ts
const loadFromApi = () => rpc.incidents.$get(...)
const loadFromCache = () => incidentStore.value
const loadFromFixture = () => fixtureIncidents
```

Backend `Response` objects and project-specific envelopes must be normalized before
they reach a core component.

### Data ownership

When both styles are supported, `data` and `load` are alternatives:

- `data` means data is controlled externally.
- `load` means the component owns loading.
- Supplying both is a development error.
- `Form.initial` may coexist with `load`; loaded values override initial values,
  and user edits override both.

## Query state

Each table owns an independent query, derived from its resource surface by default.
Normal usage requires no explicit `v-model:query`:

```vue
<ListView :table="incidentActions.table()" />
<ListView :table="incidentVictims.table()" />
```

The default URL namespace derives from the resource key:

```text
?incident-actions.page=2&incident-victims.page=1
```

Resources provide a Zod query schema, defaults, and default namespace. The table
uses that binding to parse, serialize, and update query state.

Escape hatches remain available:

```vue
<ListView :table="users.table({ namespace: 'assignees' })" />

<ListView :table="{ ...users.table(), query: externallyControlledQuery }" />
```

`namespace` is the prop distinguishing duplicate table instances
(`<Table namespace="archived">` -> `archived.page`).

An explicit namespace is required when the same resource appears multiple times in
one view. Framework code cannot infer the semantic difference between those table
instances.

Core `Table` does not import the router directly. Query serialization and URL
synchronization are supplied through the configured query adapter.

## Internal query runtime

TanStack Query is the preferred implementation candidate for caching,
deduplication, stale data, cancellation, retries, background refetching, and
invalidation. It remains an internal implementation detail.

Public APIs expose `load` and `submit`, not `useQuery`, `useMutation`, or query keys.

Internally, the runtime creates stable cache identities such as:

```ts
['resource', 'incidents', 'list', { page: 1 }]
['resource', 'incidents', 'detail', incidentId]
['resource', 'incident-actions', 'list', { incidentId, page: 1 }]
```

Developers do not author these keys. Standard resource mutations automatically
invalidate matching resource data. A custom API workflow remains ordinary code
and explicitly invalidates the affected resource afterward:

```ts
await rpc.incidentActions.progress.$put(...)
await incidentActions.invalidate({ incidentId })
```

## Project adapters

Project- and backend-specific behavior belongs in the application adapter folder,
not in core components or feature routes.

```text
apps/web/src/framework/adapters/
  data/
    normalizeCollection.ts
    normalizeError.ts
    pagination.ts
  rpc/
    resources.ts
    crud.ts
    response.ts
  query/
    routeQuery.ts
    defaults.ts
  validation/
    rpcSchemas.ts
  renderers/
    table.ts
    detail.ts
    form.ts
  index.ts
```

The framework defines typed adapter contracts. `apps/web` supplies implementations
at bootstrap. Appropriate adapter responsibilities include:

- backend response normalization;
- backend error normalization;
- pagination mapping;
- query serialization and deserialization;
- RPC resource discovery;
- RPC schema extraction;
- project renderer registries;
- project-wide query and cache defaults.

Feature-specific fields, routes, and business workflows do not belong in this
folder.

## Validation

Zod schemas are the source of truth for validation. Presentation config must not
duplicate constraints such as required, minimum length, or regular expressions.

When an RPC route exposes input schemas, resource validation is derived from those
schemas:

```ts
export const incidents = defineResource({
  key: "incidents",
  rpc: rpc.incidents,
});
```

The RPC adapter supplies record, query, create, and update schemas when available.

Resources without RPC define schemas manually:

```ts
export const localIncidents = defineResource({
  key: "local-incidents",
  schemas: {
    record: incidentSchema,
    query: incidentQuerySchema,
    create: incidentCreateSchema,
    update: incidentUpdateSchema,
  },
});
```

Backend validation errors are normalized by the project adapter before `Form`
maps them to fields.

## Standard controls and permissions

List and detail surface shells render standard controls from the intersection of:

```text
resource operation exists
+ matching filesystem route exists
+ user permission allows operation
+ optional stable resource visibility policy allows operation
= render control
```

Denied controls disappear.

The resource owns operation availability, default permission identity, and stable
resource-level policies. Vue surface shells own control layout and rendering.
One-off presentation belongs in route/component slots.

```vue
<ListView :table="incidents.table()" :controls="standardControls({ resource: incidents, surface: 'list' })">
  <template #cell:status_code="{ record }">
    <IncidentStatus :incident="record" />
  </template>
</ListView>
```

Standard controls are list, detail, create, update, and delete. Excel export and
print are app-level custom controls, not framework standard controls.

Resource-level control configuration is an override, not the primary way standard
controls are declared.

## Renderer contracts

Custom renderers and slots receive predictable context.

Display renderer:

```ts
{
  value,
  record,
  field,
  index,
}
```

Form renderer:

```ts
{
  value,
  draft,
  field,
  setValue,
  error,
  touched,
  disabled,
}
```

Registry keys cover normal cases. Direct components, slots, and headless rendering
provide escape hatches.

## Dynamic field behavior

A field's form projection may carry a `behavior` block of pure, synchronous
function options over the reactive draft:

```ts
status_code: {
  label: 'Status',
  form: {
    renderer: 'radio',
    behavior: {
      visible: ({ draft }) => draft.is_accident === true,
      disabled: ({ draft }) => draft.locked === true,
      props: ({ draft }) => ({ options: optionsFor(draft.section_id) }),
    },
  },
}
```

Each option is evaluated in one Vue `computed` over the draft, so it subscribes
to exactly the properties it reads and is re-tracked on every run — there is no
depends-on list. `derived` computes a value the user cannot override;
`resetWhen` clears the field when its result changes identity. `behavior`
accepts functions only: constants belong in the static projection, and
`derived` together with `resetWhen` on one field is a contradictory definition.

A field whose `visible` evaluates false contributes no value to the submitted
draft, and validation runs on the visibility-filtered draft. Behavior decides
presence; schemas decide validity. Conditional requiredness belongs in the Zod
schema (`refine` or a discriminated union), never duplicated in behavior.

## Routing and URL state

The app uses HTML5 history (`createWebHistory`). It stays fully static; the only
hosting requirement is a fallback rule serving `index.html` for unknown paths.
Legacy hash URLs are normalized client-side on boot, and legacy query-state URLs
(`?roles_view=detail&roles_id=1`) redirect to their route. Links between sibling
routes under a shared parent layout preserve the siblings' namespaced query
params within that subtree; leaving the subtree drops them.

## Vocabulary rules

Public API names come from, in order of preference: the legacy framework where
semantics genuinely match (`searchParameters`, `initialData`, `fields`, `load`,
`submit`); Vue/HTML/TypeScript standard vocabulary (`props`, `namespace`,
`visible`, `disabled`, `renderer`, `id`); plain English (`behavior`, `derived`).
`renderer` is the field-config key for widget selection on every surface — never
`type` or `control`; "control(s)" refers exclusively to action controls. Domain
words never appear in framework APIs.

## Configuration composition

Configuration merging uses explicit boundaries rather than a universal recursive
deep merge.

- Surface objects merge only through their dedicated resolver.
- `display.props`, `form.props`, `table.props`, and `detail.props` shallow-merge.
- Arrays replace.
- Functions replace.
- `undefined` inherits.
- `null` explicitly clears.

Plain object and prop composition remains the local override mechanism:

```vue
<ListView :table="incidents.table({ namespace: 'dashboard-incidents' })" />
```

When behavior requires substantial control flow, use ordinary TypeScript or Vue
instead of extending the schema language.

## Nested resource example

An incident action route receives `incidentId` from filesystem routing and uses the
same `ListView` as a top-level resource.

```vue
<script setup lang="ts">
import { incidentActions } from "@/features/incidents/incident-actions.resource";

const props = defineProps<{ incidentId: string }>();
</script>

<template>
  <ListView v-bind="incidentActions.list({ incidentId: props.incidentId })" />
</template>
```

The resource defines the project API mapping once:

```ts
export const incidentActions = defineResource({
  key: "incident-actions",
  fields: incidentActionFields,
  operations: createRpcOperations(rpc.incidentActions),
  table: {
    fields: ["service_type_id", "vehicle_id", "officer_id", "stage"],
  },
});
```

There is no nested-resource component or nested-resource-specific operation.

## Custom workflows

Non-standard workflows remain ordinary functions using the project RPC/API client.

```ts
async function updateProgress(input: UpdateProgressInput) {
  const response = await rpc.incidentActions.progress.$put({ json: input });
  if (!response.ok) throw await response.json();

  await incidentActions.invalidate({ incidentId: input.incidentId });
}
```

No framework `Command`, workflow registry, or fake CRUD operation is introduced.

## Effect on current CRUD components

`CRUDComposite` is removed from the target architecture.

The useful visual responsibilities of the thin CRUD components remain, but their
resource, routing, and state-machine responsibilities move elsewhere:

| Current component | Target responsibility                                         |
| ----------------- | ------------------------------------------------------------- |
| `CRUDList`        | `ListView` shell plus `resource.table()`                      |
| `CRUDDetail`      | `DetailView` shell plus `resource.detail({ id })`             |
| `CRUDCreate`      | `FormView` shell plus `resource.form()`                       |
| `CRUDUpdate`      | `FormView` shell plus `resource.form({ id })`                 |
| `CRUDComposite`   | Removed; filesystem routes select surfaces                    |

There are no compatibility wrappers. The package had no consumers outside this
monorepo, so the legacy components and their CRUD runtime were deleted outright
under a major version bump; `docs/architecture/resource-migration-guide.md`
records the manual translation.

## Suggested project structure

```text
apps/web/src/
  framework/
    adapters/
    query/
    resources/
  features/
    incidents/
      incidents.resource.ts
      incidents.fields.ts
      incident-actions.resource.ts
      components/
  routes/
    (authenticated)/
      emergency/
        incidents/

packages/is-vue-framework/src/
  components/
    core/
      Form.vue
      Table.vue
      Detail.vue
    views/
      ListView.vue
      DetailView.vue
      FormView.vue
  fields/
  resources/
  query/
  renderers/
  runtime/
```

## Migration history

The migration shipped in this order (see `plans/000`-`plans/009`):

1. Establish a green, independent web verification baseline.
2. Define typed adapter, load, field, resource, and surface contracts.
3. Introduce the field catalog and the three core component contracts.
4. Extract `ListView`, `DetailView`, and `FormView` visual shells from the useful
   parts of current `CRUD*` components.
5. Implement resource-generated prop bags and RPC schema/operation inference.
6. Implement namespaced query state and the internal TanStack Query runtime.
7. Migrate `roles` as a bounded simple-plus-nested vertical slice.
8. Migrate `incidents` as the complex validation, rendering, nested-resource, and
   workflow slice.
9. Validate a fully custom route using the primitives without resources.
10. Freeze legacy CRUD APIs, migrate remaining routes, then remove compatibility
    wrappers and `CRUDComposite`.

## Acceptance gates

These cases are covered by tests in the framework package and by
`apps/web/src/framework/acceptance/QueryOwnershipFixture.vue`:

- `<ListView :table="resource.table()" />` with automatic namespaced query state;
- two tables in one route with independent URL query state;
- an explicit query namespace override for duplicate resource tables;
- API-backed and local/offline loaders using the same component contracts;
- list/detail cache sharing and cancellation;
- invalidation after standard and custom submissions;
- RPC-derived Zod validation plus a manually defined non-RPC schema;
- default field access and extraordinary `read`/`write` fields;
- custom renderer slots and direct core-component usage;
- nested resource scope without nested-specific component vocabulary;
- inferred standard controls with denied controls hidden;
- `ListView`, `DetailView`, and `FormView` preserving the normal application look.

The shipped vertical slices are `roles` (list, create, detail, edit, and nested
permissions) and `users` (list, detail, edit, and role mapping). `incidents`
lives in a downstream repository and is covered by the downstream checklist in
the migration guide.

