---
name: web-ui-surfaces
description: Build or review Carta apps/web pages, Loom Views, resources, filters, dialogs, custom workspaces, routes, and navigation.
---

# Web UI surfaces

Read [DESIGN.md](../../../DESIGN.md) for visual rules and check the
[capability guide](references/capabilities.md) when choosing between similar
controls. Search [packages/loom/CATALOG.md](../../../packages/loom/CATALOG.md)
on demand for exact component props, slots, renderers, and helpers rather than
reading it front-to-back.

| When you need | Open |
|---|---|
| Exact props, slots, form/display renderers, or `@/framework/hono` helpers | Search [Loom catalog](../../../packages/loom/CATALOG.md) |
| Control disambiguation (filters, dialogs, trees, maps, charts, exports) | [Capability guide](references/capabilities.md) |
| Visual framing, M3 emphasis, icons, filter layout, alignment, dark mode | [DESIGN.md](../../../DESIGN.md) |
| Forms, lookups, `TableInput`, and file uploads | [$build-resource-form](../build-resource-form/SKILL.md) |
| Routes, navigation, parents, Back targets | [File routing](../../../docs/architecture/file-routing.md) |
| API schemas, transport, query ownership | [Web architecture](../../../docs/architecture/web-application-architecture.md) |
| Prototype-based UI translation | [Prototype translation](references/prototype-translation.md) |

## Composition defaults

1. **Use the highest-level Loom owner.** Build CRUD, directory, detail, tree,
   and form modules with `defineResource`, `defineTable`, `defineDetail`,
   `defineForm`, `ListView`, `DetailView`, `FormView`, `Form`, `TreeTable`, and
   `TableInput` from `@southneuhof/loom`. Do not write native `<table>` or
   `<form>` elements or manual `reactive()` CRUD pages. Before writing routes
   for a new module, open
   `apps/web/src/routes/(authenticated)/settings/users/users.resource.ts` and
   mirror its structure:
   - Resource (`*.resource.ts`): `defineResource({ key, identity, list, detail, create, update, delete, actions, exports })` backed by `createHonoResourceActions(...)` or `parseHonoResponse` / `runHonoMutation`.
   - Directory: `<ListView v-bind="resource.list()" title="...">`.
   - Detail: `<DetailView v-bind="resource.detail({ id })">` using `#title`, `#description`, `#controls` (rightmost), and `#body`, with one `defineDetail` map (`sections` for groups) and automatic Edit/Delete actions on standard CRUD details.
   - Forms (including drawer and public forms): `<Form v-bind="form" />` with `defineForm({ schema, fields, submit })`.
2. **Reuse `@southneuhof/loom` directly.** Check [capabilities.md](references/capabilities.md)
   and search [CATALOG.md](../../../packages/loom/CATALOG.md) before writing local
   wrappers. Rely on Loom props, slots, and defaults rather than `:deep(...)` or
   descendant CSS overrides.
3. **Follow [DESIGN.md](../../../DESIGN.md) for layout, emphasis, icons, and filters.**
   Gate custom actions with `command.can` and server `allowedOperations`.

## Resource and data binding

Call `resource.list()` and `resource.create()` to bind their page props. Bind
`detail` and `update` with the record identity. Keep `load` inside the
operation's `form` or `detail` bag consistently across modules. Use
`DetailView`'s `#body` and `#controls` slots or `useRecord` for custom record
pages, and `useCollection` when a custom page owns a collection presentation.
Bound commands invalidate their own resource; declare `invalidates` on resource
writes and commands for cross-resource refreshes. Use `runHonoMutation` from
`@/framework/hono` for custom write endpoints.

Complete every gate in [UI review](references/verification.md) before finishing.
