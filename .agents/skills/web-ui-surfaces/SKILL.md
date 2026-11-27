---
name: web-ui-surfaces
description: Build or review Carta apps/web pages, Loom Views, resources, filters, dialogs, custom workspaces, routes, and navigation.
---

# Web UI surfaces

Read [DESIGN.md](../../../DESIGN.md), the generated
[Loom and web framework catalog](../../../packages/loom/CATALOG.md), and the
[capability selection guide](references/capabilities.md) before authoring any
`apps/web` page, resource, or component.

| Work | Contract |
|---|---|
| Full inventory of Loom components, props, slots, renderers, and web helpers | [Loom catalog](../../../packages/loom/CATALOG.md) |
| Component choice and disambiguation rules | [Capability guide](references/capabilities.md) |
| Visual layout, framing, icons, emphasis, dialogs | [DESIGN.md](../../../DESIGN.md) |
| Resources, operations, values, slots | [Architecture and compiled examples](../../../docs/resource_system_overhaul/ARCHITECTURE.md) |
| Routes, navigation, parents, Back targets | [File routing](../../../docs/architecture/file-routing.md) |
| API schemas, transport, query ownership | [Web architecture](../../../docs/architecture/web-application-architecture.md) |
| Forms, lookups, inline tables, and inputs | [$build-resource-form](../build-resource-form/SKILL.md) |
| Prototype-based UI translation | [Prototype translation](references/prototype-translation.md) |

## Composition defaults

1. **Use the highest-level Loom owner.** Start with `ListView`, `DetailView`,
   and `FormView`. Keep `DetailView`'s single default card on standard CRUD
   detail pages, keep all fields of one card inside a single `defineDetail` map
   (with `sections` when logical groups help scanning) so colons align, rely on
   `DetailView`'s automatic Edit and Delete header actions when declared on the
   resource, and keep `ListView`'s default `Create` button label unless the
   approved design explicitly requires custom wording or custom sections.
2. **Reuse Loom components from `@southneuhof/loom`.** Check
   [Loom catalog](../../../packages/loom/CATALOG.md) for exported components,
   props, slots, form renderers, and app display renderers before building local
   wrappers. Rely on Loom props, slots, and defaults rather than overriding
   component internals with `:deep(...)` or descendant CSS selectors.
3. **Design custom workspaces from a spatial thesis.** Give the primary work
   region clear visual dominance instead of equal-width columns of identical
   cards, auto-select the first queue item when present so the workspace never
   opens on an empty stub, and keep comparison panels visible so selecting a
   record never pushes them below the fold. Use tight proximity inside groups
   and generous spacing between groups so the page passes the squint test.
4. **Keep pages framed and secondary info in dialogs.** Place peer sections
   below `DetailView` inside `Card` containers. Never nest two same-tone
   outlined cards; when sub-items inside a `surface-container` card need
   containment, step up to `surface-container-high` without redundant borders
   (never `surface-container-lowest`, which reads as a recessed cutout), or use
   `body-variant="plain"` on `ListView` when a card grid sits directly on the
   canvas. Move secondary read-only views (audit metadata, technical details,
   activity logs) behind `variant="text"` buttons with icons that open a
   `Dialog`.
5. **Follow action-bar hierarchy, the button icon rule, and theme emphasis.**
   Tier header actions cleanly (`filled` for primary workflow actions,
   `outlined` for record controls like Edit/Delete, `text` for secondary
   reference dialogs). Use `PageHeader` for custom page headers (omit `backTo`
   on top-level sidebar pages). Follow the icon rules in
   [DESIGN.md](../../../DESIGN.md#actions-icons-and-forms), use one explicit
   locale for dates and timestamps, and gate custom controls with `command.can`
   and `allowedOperations`.

## Resource and data binding

Call `resource.list()` and `resource.create()` to bind their page props. Bind
`detail` and `update` with the record identity. Keep `load` inside the
operation's `form` or `detail` bag consistently across modules. Use
`DetailView`'s `body` and `controls` slots or `useRecord` for custom record
pages. Use `useCollection` when a custom page owns a collection presentation.
Bound commands already invalidate their own resource; declare `invalidates` on
resource writes and commands to refresh related resources instead of writing
manual invalidation wrappers. Use `runHonoMutation` from `@/framework/hono` for
custom write endpoints so uncertain writes and error codes follow the shared
transport contract.

Normal web type checks and builds validate module navigation paths.
Complete every check in [UI review](references/verification.md) before
finishing.
