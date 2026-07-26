import { validationError } from '../errors'
import type { ModelRuntimeContext, ModelSource, SourceListResult } from '../source'

export type MemorySource<TRecord> = Omit<ModelSource<TRecord>, 'list'> & {
  rows: TRecord[]
  list: (args: { query: Record<string, unknown>; context: ModelRuntimeContext }) => Promise<SourceListResult<TRecord>>
}

const RESERVED_LIST_QUERY_KEYS = new Set(['page', 'limit', 'search', 'sort', 'order'])

/**
 * In-memory `ModelSource` mirroring the Drizzle source's list semantics, so app
 * tests can run without a database. Keep both implementations in step.
 */
export function createMemorySource<TRecord extends Record<string, unknown>>(
  config: { rows?: TRecord[]; id?: keyof TRecord & string } = {},
): MemorySource<TRecord> {
  const rows = config.rows ? [...config.rows] : []
  const idKey = config.id ?? ('id' as keyof TRecord & string)
  const indexOf = (id: string) => rows.findIndex((row) => String(row[idKey]) === String(id))

  return {
    rows,
    async list({ query }): Promise<SourceListResult<TRecord>> {
      const source = query ?? {}
      const page = toPositiveInteger(source.page, 1)
      const limit = toPositiveInteger(source.limit, 20)
      const search = typeof source.search === 'string' && source.search.length ? source.search.toLowerCase() : undefined
      const order = source.order === 'desc' ? 'desc' : 'asc'
      const sort = source.sort == null || source.sort === '' ? undefined : String(source.sort)
      const fields = new Set(rows.flatMap((row) => Object.keys(row)))
      if (sort && !fields.has(sort)) throw validationError(`Unknown sort column "${sort}".`)

      const filters = Object.entries(source).filter(([key, value]) => !RESERVED_LIST_QUERY_KEYS.has(key) && value !== undefined)
      for (const [key] of filters) {
        if (!fields.has(key)) throw validationError(`Unknown query parameter "${key}".`)
      }

      let matched = rows.filter((row) => filters.every(([key, value]) => String(row[key]) === String(value)))
      if (search) {
        matched = matched.filter((row) =>
          Object.values(row).some((value) => typeof value === 'string' && value.toLowerCase().includes(search)),
        )
      }
      if (sort) {
        matched = [...matched].sort((left, right) => compare(left[sort], right[sort]) * (order === 'desc' ? -1 : 1))
      }

      const offset = (page - 1) * limit
      return { data: matched.slice(offset, offset + limit), total: matched.length }
    },
    async detail({ id }) {
      return rows[indexOf(id)] ?? null
    },
    async create({ input }) {
      const record = { ...(input as TRecord) }
      if (record[idKey] == null) (record as Record<string, unknown>)[idKey] = crypto.randomUUID()
      rows.push(record)
      return record
    },
    async update({ id, input }) {
      const index = indexOf(id)
      if (index < 0) return null
      const merged = { ...rows[index], ...(input as Partial<TRecord>) }
      rows[index] = merged
      return merged
    },
    async delete({ id }) {
      const index = indexOf(id)
      if (index < 0) return false
      rows.splice(index, 1)
      return true
    },
    async materialize(input) {
      return input as TRecord | TRecord[]
    },
  }
}

function toPositiveInteger(value: unknown, fallback: number) {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function compare(left: unknown, right: unknown) {
  if (left === right) return 0
  if (left == null) return -1
  if (right == null) return 1
  return String(left) < String(right) ? -1 : 1
}
