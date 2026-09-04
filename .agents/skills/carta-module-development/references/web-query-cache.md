# Web query cache convention (TanStack via framework)

The web app caches server data through the framework's query runtime
(`packages/is-vue-framework/src/query/`, TanStack Query under the hood). One
client is installed per app by the framework plugin (default `staleTime` 30s).
Application code never creates clients or authors raw query keys.

## Rules

- **Never fetch naively.** No bare `await action.run(...)` inside `onMounted`,
  no `ref` + manual reload functions. Every server read goes through a cached
  loader or a framework surface (`ListView`, `Detail`, `Table`, `TreeTable`
  with `load`).
- **Standard resource methods, not `.actions`.** `defineResource` exposes
  `list()`, `detail()`, `create()`, `update()`, `delete()` as direct resource
  methods. `resource.actions` holds only custom actions (e.g. `loadTree`);
  custom actions must be declared in `defineResource`'s `actions` block to
  exist. `resource.actions.list` is `undefined` — a real crash seen in review.
- **Mutations invalidate automatically — mostly.** The standard wrappers
  (`resource.create/update/delete(...).run`) call `invalidate()` internally:
  create without id, update/delete with `{ id }`. An explicit
  `resource.invalidate()` after `@submitted` is convention and insurance; it is
  required only when a mutation bypasses the wrappers (custom action run).
  Invalidate without `{ id }` also refreshes custom-namespaced collections of
  that resource (they live under the `[resource, 'list']` key segment).
- **One loader per logical dataset**, keyed by the exported key helpers.
- **`data` XOR `load`.** `useLoader` throws when both are supplied.

## Key helper choice

Use the action's own `namespace` for standard reads (a `list()` factory's
namespace defaults to the resource key). For custom collections use
`resource.key` plus an explicit distinct `namespace` so they never collide with
the standard list entry.

## Pattern: plain list outside a surface

```ts
import { computed } from 'vue'
import { collectionKey, useLoader } from '@southneuhof/is-vue-framework'

const list = divisions.list()
const query = { page: 1, limit: 100 }
const loader = useLoader({
  key: collectionKey({ resource: list.namespace, query, searchParameters: {} }),
  context: { query, searchParameters: {} },
  load: list.run,
})
const items = computed(() => loader.data.value?.data ?? [])
```

List runs return a `CollectionResult`: read `.data`. No `onMounted` — the
loader fetches on mount.

## Pattern: single record

Follow `apps/web/src/routes/(authenticated)/quality/pts/[ptsId]/detail.route.vue`:

```ts
const detail = pts.detail({ id: ptsId })
const loaded = useLoader({
  key: recordKey({ resource: detail.namespace, id: detail.id, searchParameters: detail.searchParameters }),
  context: { id: detail.id, searchParameters: detail.searchParameters },
  load: detail.run,
})
```

## Pattern: per-selection cache (ChipFilter tabs)

Make the key and context reactive. The cache keeps one entry per selection:

```ts
const treeLoader = useLoader({
  key: computed(() => collectionKey({
    resource: resource.key,
    namespace: 'tree',
    query: { businessCategoryId: selected.value ?? '' },
    searchParameters: {},
  })),
  context: computed(() => ({ searchParameters: {}, businessCategoryId: selected.value ?? '' })),
  enabled: computed(() => Boolean(selected.value)),
  load: (context: { searchParameters: Record<string, unknown>; businessCategoryId: string }) =>
    resource.actions.loadTree.run(context.businessCategoryId),
})
const nodes = computed(() => treeLoader.data.value?.categories ?? [])
```

The selection is folded into the key (stable serialization), so switching back
and forth between already-visited selections serves from cache within
`staleTime`; afterwards TanStack refetches in the background on remount.
`enabled` gates loaders whose inputs start empty; `loading` is false while
gated.

Exports from `@southneuhof/is-vue-framework`: `useLoader`, `collectionKey`,
`recordKey`. `useLoader` accepts `key`, `context`, `load`, optional `enabled`
and `data`; returns `data`, `loading`, `error`, `refresh`. `error` is a
normalized `SubmitError` (`message`).

## Checklist

- [ ] Every server read uses `useLoader` (+ key helper) or a framework surface.
- [ ] No `.actions.list`-style access to standard CRUD; custom actions declared in `defineResource`.
- [ ] Standard mutations rely on wrapper invalidation; custom-action mutations end with `resource.invalidate()`.
- [ ] Per-selection datasets encode the selection in the query key with a distinct `namespace`.
- [ ] `enabled` gates loaders whose inputs start empty; never pass both `data` and `load`.
