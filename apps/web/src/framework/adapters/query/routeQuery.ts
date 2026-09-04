import { watch } from 'vue'
import type { Router } from 'vue-router'
import type { QueryLocationAdapter, QueryNamespace, QueryValues } from '@southneuhof/loom'

/**
 * Router-backed query location adapter.
 *
 * Table query state lives in the URL under dotted namespaces (`roles.page`),
 * so sibling tables never collide and a shared link restores every table.
 *
 * Writes use `replace`: paging or searching a table is a refinement of the
 * current screen, not a navigation step, so the back button keeps meaning
 * "previous screen". Unrelated query parameters are always preserved.
 */

function prefixOf(namespace: QueryNamespace) {
  return `${namespace}.`
}

function stringify(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (Array.isArray(value)) return value.length ? value.join(',') : undefined
  return String(value)
}

export function readNamespace(query: Record<string, unknown>, namespace: QueryNamespace): QueryValues {
  const prefix = prefixOf(namespace)
  const values: QueryValues = {}
  for (const [key, value] of Object.entries(query)) {
    if (!key.startsWith(prefix)) continue
    values[key.slice(prefix.length)] = Array.isArray(value) ? value[0] : value
  }
  return values
}

export function mergeNamespace(query: Record<string, unknown>, namespace: QueryNamespace, values: QueryValues): Record<string, string> {
  const prefix = prefixOf(namespace)
  const next: Record<string, string> = {}

  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith(prefix)) continue
    const serialized = stringify(Array.isArray(value) ? value[0] : value)
    if (serialized !== undefined) next[key] = serialized
  }

  for (const [key, value] of Object.entries(values)) {
    const serialized = stringify(value)
    if (serialized !== undefined) next[`${prefix}${key}`] = serialized
  }

  return next
}

export function createRouteQueryAdapter(router: Router): QueryLocationAdapter {
  return {
    read: (namespace) => readNamespace(router.currentRoute.value.query as Record<string, unknown>, namespace),

    write: (namespace, values) => {
      const current = router.currentRoute.value.query as Record<string, unknown>
      const next = mergeNamespace(current, namespace, values)
      if (JSON.stringify(next) === JSON.stringify(current)) return
      void router.replace({ query: next })
    },

    watch: (namespace, onChange) =>
      watch(
        () => readNamespace(router.currentRoute.value.query as Record<string, unknown>, namespace),
        (values, previous) => {
          if (JSON.stringify(values) === JSON.stringify(previous)) return
          onChange(values)
        },
        { deep: true }
      ),
  }
}
