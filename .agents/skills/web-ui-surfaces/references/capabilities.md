# Web capability selection guide

Read the generated [Loom and web framework catalog](../../../../packages/loom/CATALOG.md)
for the complete inventory of `@southneuhof/loom` components, props, slots, form
renderers, display renderers, parser formatters, and `@/framework/hono` helpers.
[DESIGN.md](../../../../DESIGN.md) defines visual framing, layout craft, icons,
and emphasis.

Use the rules below when two controls or patterns could be confused:

| Decision | Choice | Notes |
|---|---|---|
| Standard CRUD page | `ListView`, `DetailView`, `FormView`, `defineResource` | Keep default `Create` label, single `DetailView` card with `sections`, and automatic `DetailView` Edit/Delete actions unless the design requires otherwise. Use `#title` / `#description` slots on `DetailView` for record-derived headers instead of replacing `#header`. Put custom detail actions in `DetailView` `#controls` (rightmost, with the primary `filled` workflow CTA last). See [Users resource](../../../../apps/web/src/routes/%28authenticated%29/settings/users/users.resource.ts). |
| Non-CRUD page header vs CRUD `PageHeader` | Bare `<header>` (`<h1>`) vs `PageHeader` | On dashboards, analytics, split queues, and custom workspaces, use a bare typographic `<header>` (`<h1>` directly on the canvas with optional right-aligned filters or actions) rather than boxing the title in `PageHeader`. Reserve `PageHeader` for CRUD views or sub-pages that need `backTo` and card toolbar chrome. |
| Local view switch vs filter chips vs filter popover | `Tabs` vs `ChipFilter` vs `Popover` | Use `Tabs` (`v-model`, optional `icon`) for mutually exclusive view switches (`Table` / `Cards`) or `RoutedTabItem` child routes. Use `ChipFilter` (`items`, `selection="optional"` or `"required"`) for a single quick filter row. In narrow panes or when 2+ secondary filters sit beside `SearchBox`, place secondary filters in a `Popover` behind a borderless icon button instead of stacking inline inputs. |
| Quick inline filters only on `ListView` | `filter-controls="slot"` | Omits the redundant filter popover trigger when `#filters` already shows all filters inline. |
| Card grid on `ListView` | `#collection` inside default `Card` | Keep `ListView`'s default outer `surfaceContainer` `Card`, render inner cards with borderless `Card` (`color="surfaceContainerHigh"`) and `<component :is="rowActions" :record="record" />`. Use `body-variant="plain"` only when an explicit layout calls for unframed cards on the canvas. |
| Hierarchical tree table | `TreeTable` | `TreeTable` expects nested root nodes whose `children` hold descendants. Assemble flat parent-child rows into nested roots in the API response or inside `load` instead of bypassing `TreeTable` for `TreeTableContent`. |
| Multi-line selectable queue or workload rows | `ListItem` inside a divided `Card` | Place `ListItem` rows directly inside `<Card variant="outlined" color="surfaceContainer" class="divide-y divide-outline-variant p-0">`. Never stack bordered mini-cards inside a card. |
| Nested sub-panel inside a `surfaceContainer` `Card` | `bg-surface-container-high` without border | Step up in Material 3 tonal elevation instead of nesting another outlined card. |
| Confirmation vs input modal vs slide-over sheet | `ConfirmationDialog` vs `DialogForm` vs `Dialog` vs `Drawer` | Use `ConfirmationDialog` for yes/no transitions or deletes, `DialogForm` for short modal edits (including editing a read-only detail sub-section via an `Edit` button), `Dialog` for secondary reference views and short list-triggered utilities (imports, batch previews) instead of separate routes, and `Drawer` (`v-model`, `title`, `description`, `#content`, `#footer`) for slide-over triage or inspection sheets over a list. |
| Server-side list export vs built-in snapshot | `defineResource` `exports.list` | Use default client snapshots (`xlsx` / `pdf`) or declare `exports: { list: { permission, formats: [], downloads: [{ label, run }] } }` so `ListView`'s export toolbar control owns permission gating, active query forwarding, pending state, and error display. |
| Read-only map display | `MapView` | Pass `location` for the marker and address. OpenStreetMap is the default provider. `LocationInput` edits a coordinate. |
| Chart | `chart.js` inside a Loom `Card` | Loom has no `Chart` component. |
| Date vs date-time inputs | `renderer: 'date'` | Pass `props: { withTimePicker: true }` for date-time inputs. |
| Short relation list vs searchable picker vs inline child rows | `CheckboxGroupInput` vs `LookupInput` vs `TableInput` | For inline child rows with computed values, use `TableInput` (`mode: 'inline'`) with `kind: 'display'` (plain typographic `<output>`) or override `#cell:<key>` with a disabled controlled Loom input rather than faux-input box chrome. See [input-source contract](../../../../docs/resource_system_overhaul/ARCHITECTURE.md#74-lookup-option-and-location-inputs). |
| Cross-resource refresh and custom API writes | `defineResource` `invalidates` + `runHonoMutation` | Declare `invalidates: ['other-resource']` on `create`, `update`, `delete`, or custom commands so Loom owns refresh recovery. Wrap custom `POST`/`PATCH` routes with `runHonoMutation` from `@/framework/hono` for standard error normalization and uncertain-write handling. |
| Row and detail action gating | `command.can(...)` + `allowedOperations` | Bind row context with `command.withContext({ record })` and rely on server `allowedOperations` rather than hardcoded status checks or direct permission helper calls in templates. |
