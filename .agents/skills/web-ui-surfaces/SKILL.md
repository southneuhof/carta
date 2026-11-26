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
   so colons align, and keep `ListView`'s default `Create` button label unless
   the approved design explicitly requires custom wording or custom sections.
2. **Reuse Loom composites before writing markup.** Check
   [capabilities.md](references/capabilities.md) for `ChipFilter`,
   `ConfirmationDialog`, `DialogForm`, `Dialog`, `Timeline`, `Button`, `Icon`,
   and `Card`. For multi-line selectable queue rows where Loom has no list-item
   component, render clean full-row selectors inside one divided `Card`
   (`divide-y`) rather than wrapping record IDs in pill buttons.
3. **Design custom workspaces from a spatial thesis.** Give the primary work
   region clear visual dominance instead of equal-width columns of identical
   cards, auto-select the first queue item when present so the workspace never
   opens on an empty stub, and keep comparison panels visible so selecting a
   record never pushes them below the fold. Use tight proximity inside groups
   and generous spacing between groups so the page passes the squint test.
4. **Keep pages framed and secondary info in dialogs.** Place peer sections
   below `DetailView` inside `Card` containers. Never nest two same-tone
   outlined cards; when sub-items inside a card need containment, step to a
   distinct Material 3 container tone (`surface-container-low`,
   `surface-container-lowest`, or `surface-container-high`) without redundant
   heavy borders. Move secondary read-only views (audit metadata, technical
   details, activity logs) behind `variant="text"` buttons with icons that open
   a `Dialog`.
5. **Follow action-bar hierarchy, the button icon rule, and theme emphasis.**
   Tier header actions cleanly (`filled` for primary workflow actions,
   `outlined` for record controls like Edit/Delete, `text` for secondary
   reference dialogs). Add icons to header/toolbar actions, dialog/navigation
   triggers, active selected buttons (`check`), and standalone destructive
   actions; omit icons on form/dialog `Submit`/`Cancel`, repeated unselected
   row/card `Choose` buttons, and inline recovery links. Keep default `Button`
   horizontal padding intact (never pass `px-0`), keep form `Submit` compact
   and right-aligned, omit Back controls on top-level sidebar custom pages
   without selector CSS hacks, use one explicit locale for dates and
   timestamps, gate custom controls with `command.can` and
   `allowedOperations`, and render plain-text fields as plain text (never
   `renderer: 'html'`).

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
