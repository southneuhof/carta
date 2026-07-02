import { and, eq, getTableColumns, getTableName, Table } from 'drizzle-orm'
import type { AnyColumn } from 'drizzle-orm'
import { PrimaryKeyBuilder } from 'drizzle-orm/pg-core'
import type { ModelRuntimeEntity, ModelSource } from './model-source'

const tableSymbols = (Table as unknown as { Symbol: Record<'ExtraConfigBuilder' | 'ExtraConfigColumns', symbol> }).Symbol

type DrizzleDb = {
  select: () => {
    from: (table: unknown) => {
      where: (condition: unknown) => {
        limit: (limit: number) => Promise<unknown[]>
      }
    } & PromiseLike<unknown[]>
  }
  insert: (table: unknown) => {
    values: (input: unknown) => {
      returning: () => Promise<unknown[]>
    }
  }
  update: (table: unknown) => {
    set: (input: unknown) => {
      where: (condition: unknown) => {
        returning: () => Promise<unknown[]>
      }
    }
  }
  delete: (table: unknown) => {
    where: (condition: unknown) => {
      returning: () => Promise<unknown[]>
    }
  }
}

export type CreateDrizzleSourceConfig<TRecord, TCreate, TUpdate> = {
  db: unknown
  table: unknown
  schemas: {
    create: { parse: (input: unknown) => TCreate }
    update: { parse: (input: unknown) => TUpdate }
    select: { parse: (input: unknown) => TRecord }
  }
}

export function createDrizzleSource<TRecord, TCreate, TUpdate>({
  db,
  table,
  schemas,
}: CreateDrizzleSourceConfig<TRecord, TCreate, TUpdate>): ModelSource<TRecord> {
  const database = db as DrizzleDb
  const primaryKey = getPrimaryKeyColumns(table)
  const wherePrimaryKey = (id: unknown) => {
    const values = primaryKey.length === 1 ? { [primaryKey[0].name]: id } : parseCompositeId(id)
    return and(...primaryKey.map((column) => eq(column, values[column.name])))
  }

  return {
    async list() {
      const rows = await database.select().from(table)
      return { data: rows.map((row) => schemas.select.parse(row)) }
    },
    async detail({ id }) {
      const rows = await database.select().from(table).where(wherePrimaryKey(id)).limit(1)
      return rows[0] ? schemas.select.parse(rows[0]) : null
    },
    async create({ input }) {
      const rows = await database.insert(table).values(schemas.create.parse(input)).returning()
      return schemas.select.parse(rows[0])
    },
    async update({ id, input }) {
      const rows = await database.update(table).set(schemas.update.parse(input)).where(wherePrimaryKey(id)).returning()
      return rows[0] ? schemas.select.parse(rows[0]) : null
    },
    async delete({ id }) {
      const rows = await database.delete(table).where(wherePrimaryKey(id)).returning()
      return rows[0] ? schemas.select.parse(rows[0]) : null
    },
  }
}

export function getPrimaryKeyColumns(table: unknown): AnyColumn[] {
  const columns = getTableColumns(table as never) as Record<string, AnyColumn>
  const inline = Object.values(columns).filter((column) => column.primary)
  if (inline.length) return inline

  const extraConfigBuilder = (table as { [tableSymbols.ExtraConfigBuilder]?: (columns: unknown) => unknown })[tableSymbols.ExtraConfigBuilder]
  const extraConfigColumns = (table as { [tableSymbols.ExtraConfigColumns]?: unknown })[tableSymbols.ExtraConfigColumns]
  const extraConfig = extraConfigBuilder?.(extraConfigColumns) ?? []
  const primaryKey = (Array.isArray(extraConfig) ? extraConfig : Object.values(extraConfig)).find((item) => item instanceof PrimaryKeyBuilder) as
    | { columns: { name: string }[] }
    | undefined
  const names = primaryKey?.columns.map((column) => column.name) ?? []
  if (names.length) return names.map((name) => columns[name])

  throw new Error(`Primary key not found for table "${getTableName(table as never)}"`)
}

function parseCompositeId(id: unknown): Record<string, unknown> {
  if (id && typeof id === 'object' && !Array.isArray(id)) return id as Record<string, unknown>
  if (typeof id === 'string') {
    const value = JSON.parse(id)
    if (value && typeof value === 'object' && !Array.isArray(value)) return value
  }
  throw new Error('Composite primary key id must be an object or JSON object string')
}

export function createDrizzleModel<TTable, TRecord, TCreate, TUpdate>({
  table,
  ...config
}: CreateDrizzleSourceConfig<TRecord, TCreate, TUpdate> & { table: TTable }): ModelRuntimeEntity<TTable> {
  return {
    name: getTableName(table as never),
    table,
    source: createDrizzleSource({ ...config, table }),
  }
}

export function createDrizzleModelFactory(db: unknown) {
  return <TTable, TRecord, TCreate, TUpdate>(config: Omit<CreateDrizzleSourceConfig<TRecord, TCreate, TUpdate>, 'db'> & { table: TTable }) =>
    createDrizzleModel({ ...config, db })
}
