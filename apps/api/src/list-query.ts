import { validationError } from '@southneuhof/sprindle'
import { asc, desc, eq, ilike, or, type SQL } from 'drizzle-orm'

export const reservedQueryKeys: ReadonlySet<string> = new Set(['page', 'limit', 'search', 'sort', 'order', 'permission'])

export function equalityFilters(
  query: Record<string, unknown>,
  columns: Record<string, unknown>,
  options: { ignore?: ReadonlySet<string>; reservedKeys?: ReadonlySet<string> } = {},
): SQL[] {
  const skip = new Set([...(options.reservedKeys ?? reservedQueryKeys), ...(options.ignore ?? [])])
  const filters: SQL[] = []
  for (const [key, value] of Object.entries(query)) {
    if (skip.has(key) || value === undefined || value === '') continue
    const column = columns[key]
    if (!column) throw validationError(`Unknown query parameter "${key}".`)
    filters.push(eq(column as never, value as never))
  }
  return filters
}

export function searchCondition(query: Record<string, unknown>, columns: Record<string, unknown>, searchable: readonly string[]): SQL | undefined {
  const search = typeof query.search === 'string' && query.search ? `%${query.search}%` : undefined
  if (!search) return undefined
  return or(...searchable.map((field) => ilike(columns[field] as never, search)))
}

export function orderClause(query: Record<string, unknown>, columns: Record<string, unknown>, fallback: SQL[]): SQL[] {
  if (!query.sort) return fallback
  const column = columns[String(query.sort)]
  if (!column) throw validationError(`Unknown sort column "${String(query.sort)}".`)
  return [query.order === 'desc' ? desc(column as never) : asc(column as never)]
}
