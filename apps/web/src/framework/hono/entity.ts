import { defineSchema, fromZod } from '@southneuhof/loom'
import type { RecordIdentity, SchemaIdentityDeclaration } from '@southneuhof/loom'
import type { AppResourceContract, HonoCreateOf, HonoRecordOf, HonoUpdateOf } from './contracts'

type SchemaWithOutput<TOutput> = { _output: TOutput }

type EntitySchemasOf<TRoute> = {
  schemas: {
    select: Parameters<typeof fromZod>[0] & SchemaWithOutput<HonoRecordOf<TRoute>>
    create: Parameters<typeof fromZod>[0] & SchemaWithOutput<HonoCreateOf<TRoute>>
    update: Parameters<typeof fromZod>[0] & SchemaWithOutput<HonoUpdateOf<TRoute>>
  }
}

type SchemaOutput<TSchema> = TSchema extends SchemaWithOutput<infer TOutput> ? TOutput : never
type Exact<TActual, TExpected> = [TActual] extends [TExpected] ? ([TExpected] extends [TActual] ? true : false) : false
type EntitySchemaContract<TRoute, TEntity extends EntitySchemasOf<TRoute>> = {
  schemas: {
    select: Exact<SchemaOutput<TEntity['schemas']['select']>, HonoRecordOf<TRoute>> extends true ? TEntity['schemas']['select'] : never
    create: SchemaOutput<TEntity['schemas']['create']> extends HonoCreateOf<TRoute> ? TEntity['schemas']['create'] : never
    update: SchemaOutput<TEntity['schemas']['update']> extends HonoUpdateOf<TRoute> ? TEntity['schemas']['update'] : never
  }
}

export function defineEntitySchema<const TRoute, const TEntity extends EntitySchemasOf<TRoute>>(route: TRoute, entity: TEntity & EntitySchemaContract<TRoute, TEntity>) {
  return defineSchema<AppResourceContract<TRoute>>({
    identity: 'id' as SchemaIdentityDeclaration<HonoRecordOf<TRoute>, RecordIdentity>,
    record: { schema: fromZod(entity.schemas.select) },
    create: { schema: fromZod(entity.schemas.create) },
    update: { schema: fromZod(entity.schemas.update) },
  })
}
