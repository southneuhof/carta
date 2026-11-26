# Web capability index

Find an existing Loom owner here before writing custom markup, then inspect its
source and a current consumer. [DESIGN.md](../../../../DESIGN.md) defines
visual framing, layout craft, icons, emphasis, and placement.

Note on imports: views, constructors, hooks, base components, composites, and
inputs export directly from `@southneuhof/loom`.

| Task | Existing owner (`@southneuhof/loom`) | Fit and usage notes |
|---|---|---|
| Browse, inspect, create, or edit records | `ListView`, `DetailView`, `FormView`, `defineResource` | Keep default layouts, single default `DetailView` card with `sections` when needed, automatic `DetailView` Edit/Delete actions (`#edit-action`, `#delete-action`, `#controls`), and default `Create` label unless the design requires otherwise. See [Users resource](../../../../apps/web/src/routes/%28authenticated%29/settings/users/users.resource.ts). |
| Custom page header | `PageHeader` | One per custom page. Omit `backTo` on top-level sidebar pages so no Back button renders; pass `backTo` (`RouteTarget` or `'history'`) when a back target is needed. Supports `#header`, `#toolbar`, `#controls`, and `#subbar` slots. |
| Single-query or boolean chip filter | `ChipFilter` | Declare `selection="optional"` or `selection="required"`. Replaces hand-rolled `<button><Chip>` rows and stray filter switches or pill buttons. See [collections.md](../../../../docs/ui/collections.md#chipfilter). |
| Inline or toolbar collection filters | `ListView #filters` | Use `field(key)` in `#filters` to derive `label`, `options`, `value`, `setValue`, and `input` bindings from the shared `filters` definition. Pass `filter-controls="slot"` on `ListView` when a list uses quick inline filters only and omits the filter popover trigger. See [ListView filters](../../../../docs/resource_system_overhaul/ARCHITECTURE.md#72-filters). |
| Grouped detail or form sections | `defineDetail` / `defineForm` `sections` | Pass `sections: [{ title, description?, fields }]` orthogonal to `schema` and `fields`. Keeps single-table colon alignment in `Detail` and automatically collapses empty/hidden sections in `Form`. |
| Yes/no destructive or workflow confirmation | `ConfirmationDialog` | Pass explicit `title` and `message` for destructive consequences. Replaces custom `Dialog` confirmation wrappers. |
| Contextual input modal | `DialogForm` | Pass flat `Form` props. Owns open/close and submit lifecycle. See [compiled bindings](../../../../packages/loom/src/components/composites/__type-tests__/flat-form-components.type-test.vue). |
| Secondary reference info or on-demand inspection | `Dialog`, `Drawer` | Use `Dialog` (or `Drawer` with `v-model`) for audit metadata, technical details, and activity logs opened from a `variant="text"` button with an icon so the main page stays focused. |
| Selectable multi-line queue or list rows | `ListItem` | Flat full-bleed row selector (`selected`, `disabled`, `href`, `#leading`, `#trailing`) with vertical content stack, hover surface, Material 3 `primary-container` selected highlight, and `aria-pressed` / `aria-current`. Place inside a divided `Card` (`divide-y divide-outline-variant p-0`). |
| Buttons, emphasis, and selected states | `Button` | Use `variant="filled"` or `toggle` + `:selected="true"` for primary workflow actions and active selected action buttons (with leading `check` icon), `variant="outlined"` for record controls (`Edit`, `Delete`) and unselected choices, `variant="tonal"` for subtle secondary emphasis, `variant="text"` for quiet secondary dialog triggers (`Audit Details`, `Activity Log`). Wrap `Button` inside `RouterLink` for action-bar links. |
| Icons inside buttons and indicators | `Icon` | Typed against Remix Icon names in `remixicon-tags.ts` (`aria-hidden="true"` by default). Place inside `Button` `#icon` or `#trailing-icon` (`size="base"`), or pass `icon` on `Tabs` items. Follow the icon rule in [DESIGN.md](../../../../DESIGN.md#actions-icons-and-forms). |
| Section containers | `Card` | Use `variant="outlined" color="surfaceContainer"` for peer sections below `DetailView` and independent workspace regions. Never nest two same-tone outlined cards; inside `surfaceContainer`, step up to `surfaceContainerHigh` without redundant borders (never `surfaceContainerLowest` for nested cards). |
| Status or category pills | `Chip` | Keep one consistent variant across a page. Pair color with text labels. |
| Milestone or status timeline | `Timeline` | Pass `:data` with `#node`, `#header`, and `#content` slots. Replaces custom `<ol>` timelines. |
| Select related records from a short list | `CheckboxGroupInput` and [input-source contract](../../../../docs/resource_system_overhaul/ARCHITECTURE.md#74-lookup-option-and-location-inputs) | Supply identity, label, scope, and conversion; the input owns loading and selection. |
| Pick related records through a searchable table | `LookupInput` | Owns picker query, staged selection, and hydration. Supply scoped loaders. See [owner examples](../../../../packages/loom/src/components/composites/__tests__/LookupInput.spec.ts). |
| Add, edit, remove, or reorder parent-form rows | `TableInput` | Owns row identity, draft, and errors in dialog or inline mode. Inline mode supports `kind: 'display'` read-only/computed columns (`read`, `format`, `align`) alongside editable inputs. See [inline contract](../../../../packages/loom/README.md#local-controls-and-form-state). |
| Export records or a custom report | `ListView` and `DetailView` `export` and [Spool](../../../../packages/spool/README.md) | Views own access, loading, and display mapping. |
| Run a record command from custom controls | Resource commands | Bind row context with `command.withContext({ record })`, gate visibility with `command.can(...)` and `allowedOperations`, never hardcoded status checks. See [Role assignment page](../../../../apps/web/src/routes/%28authenticated%29/settings/users/%5BuserId%5D/detail/role-assignments/index.route.vue). |
| Switch views or navigate primary child tabs | `Tabs` and `AppRouterView` (`@/components/routing/AppRouterView.vue`) | Use `Tabs` (`v-model` with `TabsItem`, optional `icon`) for mutually exclusive local view switches such as `Table` / `Cards`, and `RoutedTabItem` targets inside a `Card` below `DetailView` for primary operational child routes. Put read-only logs in a `Dialog`. See [User detail](../../../../apps/web/src/routes/%28authenticated%29/settings/users/%5BuserId%5D/detail.route.vue). |
| Select a location with search or a map | `LocationInput` | The app supplies provider operations. See [Map preview](../../../../apps/web/src/routes/%28authenticated%29/map-preview/index.route.vue). |
| Compose a form and collection without page Views | `Form`, `Table`, `TreeTable`, `Detail`, `useCollection`, `useRecord` | Retain session, query, access, and cache owners. See [QueryOwnershipFixture](../../../../apps/web/src/framework/acceptance/QueryOwnershipFixture.vue). |
| Keep standard actions in a custom list or card grid | `ListView #collection` | Render `<component :is="rowActions" :record="record" />` with the original resource record. Use `body-variant="plain"` when a card grid sits directly on the page canvas. |

For an unlisted task, search [public exports](../../../../packages/loom/src/index.ts),
[form renderers](../../../../packages/loom/src/renderers/form.ts), and
`packages/loom/src/components/` before creating local markup.
