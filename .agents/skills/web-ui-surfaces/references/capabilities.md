# Web capability index

Find an existing Loom owner here before writing custom markup, then inspect its
source and a current consumer. [DESIGN.md](../../../../DESIGN.md) defines
visual framing, emphasis, and placement.

Note on imports: core views, constructors, and hooks export from
`@southneuhof/loom`. Base components, composites, and inputs listed below with
subpaths currently live under `@southneuhof/loom/components/...`.

| Task | Existing owner and import path | Fit and usage notes |
|---|---|---|
| Browse, inspect, create, or edit records | `ListView`, `DetailView`, `FormView`, `defineResource` (`@southneuhof/loom`) | Keep default layouts and `Create` label unless the design requires otherwise. See [Users resource](../../../../apps/web/src/routes/%28authenticated%29/settings/users/users.resource.ts). |
| Custom page header | `NavigationHeader` (`@southneuhof/loom`) | One per custom page without `DetailView`/`FormView`. Pass `:back-to="false"` on top-level sidebar pages. |
| Single-query chip filter | `ChipFilter` (`@southneuhof/loom/components/composites/ChipFilter.vue`) | Declare `selection="optional"` or `selection="required"`. Replaces hand-rolled `<button><Chip>` filter rows. See [collections.md](../../../../docs/ui/collections.md#chipfilter). |
| Inline or toolbar collection filters | `ListView #filters` (`@southneuhof/loom`) | Bind slot controls to shared `draft` and `setValue`. Keep controls aligned in one compact row. See [ListView filters](../../../../docs/resource_system_overhaul/ARCHITECTURE.md#72-filters). |
| Yes/no destructive or workflow confirmation | `ConfirmationDialog` (`@southneuhof/loom/components/composites/ConfirmationDialog.vue`) | Always pass explicit `title` and `message` in the app language. Replaces custom `Dialog` confirmation wrappers. |
| Contextual input modal | `DialogForm` (`@southneuhof/loom`) | Pass flat `Form` props. Owns open/close and submit lifecycle. See [compiled bindings](../../../../packages/loom/src/components/composites/__type-tests__/flat-form-components.type-test.vue). |
| Secondary reference info or on-demand inspection | `Dialog` (`@southneuhof/loom/components/base/Dialog.vue`) | Use for audit metadata, technical details, activity logs, or on-demand inspectors opened from a button so the main page stays uncluttered. |
| Buttons and selected states | `Button` (`@southneuhof/loom/components/base/Button.vue`) | Use `variant="filled"` for primary actions and active/selected states (with clear selected wording/icon), `variant="outlined"` for secondary/unselected, `variant="text"` for quiet actions. Do not use `tonal` for selected state on `surfaceContainer` cards. Wrap `Button` inside `RouterLink` for action-bar links. |
| Section containers | `Card` (`@southneuhof/loom/components/base/Card.vue`) | Use `variant="outlined" color="surfaceContainer"` for peer sections below `DetailView` and independent workspace regions. Never nest a `Card` inside another `Card`. |
| Status or category pills | `Chip` (`@southneuhof/loom/components/base/Chip.vue`) | Keep one consistent variant across a page. Pair color with text labels. |
| Milestone or status timeline | `Timeline` (`@southneuhof/loom/components/base/Timeline.vue`) | Pass `:data` with `#node`, `#header`, and `#content` slots. Replaces custom `<ol>` timelines. |
| Select related records from a short list | `CheckboxGroupInput` (`@southneuhof/loom/components/inputs/CheckboxGroupInput.vue`) and [input-source contract](../../../../docs/resource_system_overhaul/ARCHITECTURE.md#74-lookup-option-and-location-inputs) | Supply identity, label, scope, and conversion; the input owns loading and selection. |
| Pick related records through a searchable table | `LookupInput` (`@southneuhof/loom/components/composites/form-inputs/LookupInput.vue`) | Owns picker query, staged selection, and hydration. Supply scoped loaders. See [owner examples](../../../../packages/loom/src/components/composites/__tests__/LookupInput.spec.ts). |
| Add, edit, remove, or reorder parent-form rows | `TableInput` (`@southneuhof/loom/components/composites/form-inputs/TableInput.vue`) | Owns row identity, draft, and errors in dialog or inline mode. See [inline contract](../../../../packages/loom/README.md#local-controls-and-form-state). |
| Export records or a custom report | `ListView` and `DetailView` `export` (`@southneuhof/loom`) and [Spool](../../../../packages/spool/README.md) | Views own access, loading, and display mapping. |
| Run a record command from custom controls | Resource commands (`@southneuhof/loom`) | Bind row context with `command.withContext({ record })`, gate visibility with `command.can(...)` and `allowedOperations`, never hardcoded status checks. See [Role assignment page](../../../../apps/web/src/routes/%28authenticated%29/settings/users/%5BuserId%5D/detail/role-assignments/index.route.vue). |
| Keep a record summary visible across primary child tabs | `Tabs` (`@southneuhof/loom`) and `AppRouterView` (`@/components/routing/AppRouterView.vue`) | Enclose the tabbed section cleanly in a `Card` below `DetailView`. Reserve for primary operational child routes; put read-only logs in a `Dialog`. See [User detail](../../../../apps/web/src/routes/%28authenticated%29/settings/users/%5BuserId%5D/detail.route.vue). |
| Select a location with search or a map | `LocationInput` (`@southneuhof/loom/components/composites/form-inputs/LocationInput.vue`) | The app supplies provider operations. See [Map preview](../../../../apps/web/src/routes/%28authenticated%29/map-preview/index.route.vue). |
| Compose a form and collection without page Views | `Form`, `Table`, `TreeTable`, `Detail`, `useCollection`, `useRecord` (`@southneuhof/loom`) | Retain session, query, access, and cache owners. See [QueryOwnershipFixture](../../../../apps/web/src/framework/acceptance/QueryOwnershipFixture.vue). |
| Keep standard actions in a custom list or card grid | `ListView #collection` (`@southneuhof/loom`) | Render `<component :is="rowActions" :record="record" />` with the original resource record. |

For an unlisted task, search [public exports](../../../../packages/loom/src/index.ts),
[form renderers](../../../../packages/loom/src/renderers/form.ts), and
`packages/loom/src/components/` before creating local markup.
