---
name: web-ui-surfaces
description: Build or review Carta apps/web pages, Loom Views, resources, filters, dialogs, custom workspaces, routes, and navigation.
---

# Web UI surfaces

Read [DESIGN.md](../../../DESIGN.md) and the
[capability index](references/capabilities.md) before authoring any `apps/web`
page, resource, or component.

| Work | Contract |
|---|---|
| Components and existing Loom owners | [Capability index](references/capabilities.md) |
| Visual layout, framing, emphasis, dialogs | [DESIGN.md](../../../DESIGN.md) |
| Resources, operations, values, slots | [Architecture and compiled examples](../../../docs/resource_system_overhaul/ARCHITECTURE.md) |
| Routes, navigation, parents, Back targets | [File routing](../../../docs/architecture/file-routing.md) |
| API schemas, transport, query ownership | [Web architecture](../../../docs/architecture/web-application-architecture.md) |
| Forms, lookups, inline tables, and inputs | [$build-resource-form](../build-resource-form/SKILL.md) |
| Prototype-based UI translation | [Prototype translation](references/prototype-translation.md) |

## Composition defaults

1. **Use the highest-level Loom owner.** Start with `ListView`, `DetailView`,
   and `FormView`. Keep default View layouts and `ListView`'s default `Create`
   button label unless the approved design explicitly requires custom wording
   or custom sections.
2. **Reuse Loom composites before writing markup.** Check
   [capabilities.md](references/capabilities.md) for `ChipFilter`,
   `ConfirmationDialog`, `DialogForm`, `Dialog`, `Timeline`, `Button`, and
   `Card`. Avoid hand-rolled native `<button>` elements, custom modal wrappers,
   or custom `<ol>` timelines.
3. **Keep pages framed, calm, and spatially stable.** Place peer sections below
   `DetailView` inside `Card` containers and keep cards flat (never nest a
   `Card` inside a `Card`). Move secondary read-only views (audit metadata,
   technical details, activity logs) behind a button that opens a `Dialog`. In
   custom workspaces, keep comparison panels visible so selecting an item never
   pushes them below the fold.
4. **Match theme emphasis and control contracts.** Use `Button` with
   `variant="filled"` for primary actions and selected button states (paired
   with clear selected wording or an icon), never `variant="tonal"` on
   `surfaceContainer` cards. Pass `:back-to="false"` to `NavigationHeader` on
   top-level sidebar pages. Gate custom controls with View-supplied callbacks
   and `command.can` / `allowedOperations`, never hardcoded status checks.
   Render plain-text fields as plain text, never with `renderer: 'html'`.

## Resource and data binding

Call `resource.list()` and `resource.create()` to bind their page props. Bind
`detail` and `update` with the record identity. Keep `load` inside the
operation's `form` or `detail` bag consistently across modules. Use
`DetailView`'s `body` and `controls` slots or `useRecord` for custom record
pages. Use `useCollection` when a custom page owns a collection presentation.
Bound commands already invalidate their resource; add invalidation only for
another affected resource or an unbound write.

Normal web type checks and builds validate module navigation paths.
Complete every check in [UI review](references/verification.md) before
finishing.
