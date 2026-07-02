import { getTableColumns, getTableName, is, Many, One, Relations, Table } from 'drizzle-orm'
import { createTableRelationsHelpers } from 'drizzle-orm/relations'
import { createDrizzleSource } from '../source/drizzle-source'
import type { ModelRuntimeEntity, ModelSource } from '../source/model-source'

const ENTITY_MARK = Symbol.for('@southneuhof/domain/entity')

type AnySchema = { parse: (input: unknown) => unknown }

type EntitySchemas = {
  create: AnySchema
  update: AnySchema
  select: AnySchema
}

export type DomainEntity<TTable = unknown, TSchemas extends EntitySchemas = EntitySchemas> = ModelRuntimeEntity<TTable> & {
  [ENTITY_MARK]: true
  schemas: TSchemas
  table: TTable
}

type CreateEntityConfig<TTable, TSchemas extends EntitySchemas> = {
  table: TTable
  schemas: TSchemas
  relations?: never
}

type DomainRegistry = {
  tables: Map<unknown, string>
  relations: Map<unknown, Relations>
  entities: Set<DomainEntity>
}

export type DomainSchema = {
  drizzleSchema: Record<string, unknown>
  entities: DomainEntity[]
  relationsByTable: Map<unknown, Record<string, unknown>>
  relationFieldsByEntity: Map<DomainEntity, string[]>
  tableKeyByEntity: Map<DomainEntity, string>
}

const registry: DomainRegistry = {
  tables: new Map(),
  relations: new Map(),
  entities: new Set(),
}

export function createEntity<TTable, TSchemas extends EntitySchemas>(config: CreateEntityConfig<TTable, TSchemas>): DomainEntity<TTable, TSchemas> {
  if ('relations' in (config as Record<string, unknown>)) throw new Error('createEntity() does not accept relations.')

  return {
    [ENTITY_MARK]: true,
    name: getTableName(config.table as never),
    table: config.table,
    schemas: config.schemas,
    source: unboundSource(),
  }
}

function isDomainEntity(value: unknown): value is DomainEntity {
  return Boolean(value && typeof value === 'object' && (value as { [ENTITY_MARK]?: true })[ENTITY_MARK])
}

export function registerTable(table: unknown) {
  if (!isDrizzleTable(table)) throw new Error('registerTable() expects a Drizzle table.')
  if (registry.tables.has(table)) throw new Error(`Table "${getTableName(table as never)}" is already registered.`)
  registry.tables.set(table, getTableName(table as never))
}

export function registerRelations(relations: unknown) {
  if (!isDrizzleRelations(relations)) throw new Error('registerRelations() expects Drizzle relations().')
  if (registry.relations.has(relations.table)) throw new Error(`Relations for table "${getTableName(relations.table as never)}" are already registered.`)
  registry.relations.set(relations.table, relations)
}

export function registerEntity(entity: DomainEntity) {
  if (!isDomainEntity(entity)) throw new Error('registerEntity() expects an entity from createEntity().')
  if (registry.entities.has(entity)) throw new Error(`Entity "${entity.name}" is already registered.`)
  registry.entities.add(entity)
}

export function defineDomainSchema(): DomainSchema {
  const drizzleSchema: Record<string, unknown> = {}
  const entities = [...registry.entities]
  const relationsByTable = new Map<unknown, Record<string, unknown>>()
  const relationFieldsByEntity = new Map<DomainEntity, string[]>()
  const tableKeyByEntity = new Map<DomainEntity, string>()
  const entityByTable = new Map<unknown, DomainEntity>()
  const entityBySelectSchema = new Map<unknown, DomainEntity>()

  for (const [table, key] of registry.tables) {
    drizzleSchema[key] = table
  }

  for (const [table, relation] of registry.relations) {
    drizzleSchema[`${registry.tables.get(table) ?? getTableName(table as never)}Relations`] = relation
  }

  for (const entity of entities) {
    entityByTable.set(entity.table, entity)
    entityBySelectSchema.set(entity.schemas.select, entity)
    const tableKey = registry.tables.get(entity.table)
    if (tableKey) tableKeyByEntity.set(entity, tableKey)
  }

  for (const relation of registry.relations.values()) {
    relationsByTable.set(relation.table, relation.config(createTableRelationsHelpers(relation.table as never)))
  }

  for (const entity of entities) {
    relationFieldsByEntity.set(entity, validateEntitySelect({ entity, relationsByTable, entityBySelectSchema }))
  }

  return { drizzleSchema, entities, relationsByTable, relationFieldsByEntity, tableKeyByEntity }
}

export function resetDomainRegistryForTests() {
  registry.tables.clear()
  registry.relations.clear()
  registry.entities.clear()
}

export function bindDomainDatabase(domainSchema: DomainSchema, db: unknown) {
  for (const entity of domainSchema.entities) {
    entity.source = createDrizzleSource({
      db,
      table: entity.table,
      schemas: entity.schemas,
      domainSchema,
      entity,
    })
  }
}

function validateEntitySelect({
  entity,
  relationsByTable,
  entityBySelectSchema,
}: {
  entity: DomainEntity
  relationsByTable: Map<unknown, Record<string, unknown>>
  entityBySelectSchema: Map<unknown, DomainEntity>
}) {
  const relationFields: string[] = []
  const columns = getTableColumns(entity.table as never) as Record<string, unknown>
  const relations = relationsByTable.get(entity.table) ?? {}
  const aliases = new Map(
    Object.entries(relations)
      .map(([key, relation]) => [(relation as { relationName?: string }).relationName, key] as const)
      .filter(([alias]) => alias),
  )

  for (const [field, schema] of Object.entries(getZodShape(entity.schemas.select))) {
    if (field in columns) continue

    const nested = getNestedEntitySchema(schema, entityBySelectSchema)
    if (!nested) {
      const aliasFor = aliases.get(field)
      if (aliasFor) throw new Error(`Invalid relation field "${field}" on entity "${entity.name}".\n\n"${field}" is a Drizzle alias. Use the relation key "${aliasFor}" in schemas.select.`)
      throw new Error(`Unknown nested object field "${field}" on entity "${entity.name}".\n\nNested relation fields must use another entity's schemas.select.`)
    }

    const relation = relations[field]
    if (!relation) throw new Error(`Missing Drizzle relation for select field "${field}" on entity "${entity.name}".\nAdd a relation named "${field}" in relations().`)

    if (nested.isArray && !is(relation, Many)) {
      throw new Error(`Cardinality mismatch for relation "${field}" on entity "${entity.name}".\n\nDrizzle relation "${field}" is one, but schemas.select.${field} is an array.`)
    }
    if (!nested.isArray && !is(relation, One)) {
      throw new Error(`Cardinality mismatch for relation "${field}" on entity "${entity.name}".\n\nDrizzle relation "${field}" is many, but schemas.select.${field} is not an array.`)
    }
    if ((relation as { referencedTable?: unknown }).referencedTable !== nested.entity.table) {
      throw new Error(`Target entity mismatch for relation "${field}" on entity "${entity.name}".\n\nDrizzle relation "${field}" targets table "${getTableName((relation as { referencedTable: never }).referencedTable)}".\nschemas.select.${field} uses entity "${nested.entity.name}".`)
    }

    relationFields.push(field)
  }

  return relationFields
}

function getNestedEntitySchema(schema: unknown, entityBySelectSchema: Map<unknown, DomainEntity>) {
  const unwrapped = unwrapZod(schema)
  if (isZodArray(unwrapped)) {
    const entity = entityBySelectSchema.get(unwrapZod(getZodArrayElement(unwrapped)))
    return entity ? { entity, isArray: true } : undefined
  }
  const entity = entityBySelectSchema.get(unwrapped)
  return entity ? { entity, isArray: false } : undefined
}

function unwrapZod(schema: unknown): unknown {
  while (
    getZodDef(schema)?.type === 'optional' ||
    getZodDef(schema)?.type === 'nullable' ||
    getZodDef(schema)?.type === 'lazy' ||
    getZodDef(schema)?.typeName === 'ZodOptional' ||
    getZodDef(schema)?.typeName === 'ZodNullable' ||
    getZodDef(schema)?.typeName === 'ZodLazy'
  ) {
    schema = (schema as { unwrap?: () => unknown }).unwrap?.() ?? (getZodDef(schema)?.getter as (() => unknown) | undefined)?.() ?? getZodDef(schema)?.innerType
  }
  return schema
}

function getZodShape(schema: AnySchema): Record<string, unknown> {
  const shape = (schema as { shape?: unknown }).shape ?? getZodDef(schema)?.shape
  const value = typeof shape === 'function' ? shape() : shape
  if (!value || typeof value !== 'object') throw new Error('schemas.select must be a Zod object.')
  return value as Record<string, unknown>
}

function isZodArray(schema: unknown) {
  const def = getZodDef(schema)
  return def?.type === 'array' || def?.typeName === 'ZodArray' || (def?.type && typeof def.type === 'object')
}

function getZodArrayElement(schema: unknown) {
  const def = getZodDef(schema)
  return def?.element ?? def?.type
}

function getZodDef(schema: unknown): Record<string, unknown> | undefined {
  return ((schema as { _def?: unknown; def?: unknown })?._def ?? (schema as { def?: unknown })?.def) as Record<string, unknown> | undefined
}

function isDrizzleTable(value: unknown): value is Table {
  return is(value, Table)
}

function isDrizzleRelations(value: unknown): value is Relations {
  return is(value, Relations)
}

function unboundSource(): ModelSource {
  const fail = async () => {
    throw new Error('Domain database is not bound. Call bindDomainDatabase() before model actions run.')
  }
  return { list: fail, detail: fail, create: fail, update: fail, delete: fail }
}
