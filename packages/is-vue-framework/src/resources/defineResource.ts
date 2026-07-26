/**
 * Native resource definitions.
 *
 * A resource declares standard data once and hands back exact native core
 * props. Routes still own placement and navigation; nothing here inspects route
 * state, and there is no composite renderer, no nested-resource kind, and no
 * form mode.
 *
 * `form()` wires create submit plus the create schema; `form({ id })` wires the
 * record load, update submit, and the update schema — which is how plan 003's
 * operation-schema selection stays out of Form.
 */
import type {
  CollectionLoadContext,
  CollectionResult,
  DetailFactoryArguments,
  DetailProps,
  FieldCatalog,
  FormProps,
  MaybePromise,
  RecordIdentity,
  RecordLoadContext,
  ResourceSchemas,
  TableFactoryArguments,
  TableProps,
  ValidationSchema,
} from '../contracts'
import { stableValue } from '../query/keys'
import { invalidateResourceData } from '../query/client'
import { selectSchema } from '../validation'
import { useResourceRuntime } from './runtime'

export interface ResourceOperations<
  TRecord extends object = Record<string, unknown>,
  TQuery extends object = Record<string, unknown>,
  TCreate extends object = Record<string, unknown>,
  TUpdate extends object = TCreate,
> {
  list?: (context: CollectionLoadContext<TQuery>) => MaybePromise<unknown>
  detail?: (context: RecordLoadContext) => MaybePromise<unknown>
  create?: (input: TCreate) => MaybePromise<unknown>
  update?: (id: RecordIdentity, input: TUpdate) => MaybePromise<unknown>
  delete?: (id: RecordIdentity) => MaybePromise<unknown>
  /** Declared so `TRecord` stays meaningful for consumers of this interface. */
  readonly __record?: TRecord
}

export interface ResourceSurfaceDefinition {
  /** Field order for this surface; defaults to catalog declaration order. */
  fields?: readonly string[]
}

export interface ResourceRouteTargets {
  list?: string
  create?: string
  detail?: (id: RecordIdentity) => string
  update?: (id: RecordIdentity) => string
}

export interface ResourceDefinition<
  TRecord extends object = Record<string, unknown>,
  TQuery extends object = Record<string, unknown>,
  TCreate extends object = Record<string, unknown>,
  TUpdate extends object = TCreate,
> {
  key: string
  fields: FieldCatalog<TRecord, TCreate>
  identity?: (record: TRecord) => RecordIdentity
  operations?: ResourceOperations<TRecord, TQuery, TCreate, TUpdate>
  table?: ResourceSurfaceDefinition
  detail?: ResourceSurfaceDefinition
  form?: ResourceSurfaceDefinition & { initialData?: Partial<TCreate> }
  schemas?: ResourceSchemas<TRecord, TQuery, TCreate, TUpdate>
  routes?: ResourceRouteTargets
  /** UI permission identities; default to `<key>.<operation>`. */
  permissions?: Partial<Record<'list' | 'detail' | 'create' | 'update' | 'delete', string>>
}

export interface ResourceCapabilities {
  list: boolean
  detail: boolean
  create: boolean
  update: boolean
  delete: boolean
}

export interface Resource<
  TRecord extends object = Record<string, unknown>,
  TQuery extends object = Record<string, unknown>,
  TCreate extends object = Record<string, unknown>,
  TUpdate extends object = TCreate,
> {
  key: string
  fields: FieldCatalog<TRecord, TCreate>
  routes: ResourceRouteTargets
  capabilities: ResourceCapabilities
  permissions: Record<'list' | 'detail' | 'create' | 'update' | 'delete', string>
  identity: (record: TRecord) => RecordIdentity
  table: (args?: TableFactoryArguments<TQuery>) => TableProps<TRecord, TQuery>
  detail: (args: DetailFactoryArguments) => DetailProps<TRecord>
  form: {
    (): FormProps<TCreate>
    (args: { initialData?: Partial<TCreate>; searchParameters?: Record<string, unknown> }): FormProps<TCreate>
    (args: { id: RecordIdentity; initialData?: Partial<TUpdate>; searchParameters?: Record<string, unknown> }): FormProps<TUpdate>
  }
  remove: (id: RecordIdentity) => Promise<unknown>
  invalidate: (args?: { id?: RecordIdentity }) => Promise<void>
}

const operationNames = ['list', 'detail', 'create', 'update', 'delete'] as const

function memoize<TArgs, TResult>(create: (args: TArgs) => TResult) {
  const cache = new Map<string, TResult>()
  return (args: TArgs): TResult => {
    const identity = JSON.stringify(stableValue(args as unknown) ?? null)
    const cached = cache.get(identity)
    if (cached) return cached
    const result = create(args)
    cache.set(identity, result)
    return result
  }
}

export function defineResource<
  TRecord extends object = Record<string, unknown>,
  TQuery extends object = Record<string, unknown>,
  TCreate extends object = Record<string, unknown>,
  TUpdate extends object = TCreate,
>(definition: ResourceDefinition<TRecord, TQuery, TCreate, TUpdate>): Resource<TRecord, TQuery, TCreate, TUpdate> {
  const operations = definition.operations ?? {}
  const routes = definition.routes ?? {}

  const capabilities: ResourceCapabilities = {
    list: Boolean(operations.list),
    detail: Boolean(operations.detail),
    create: Boolean(operations.create),
    update: Boolean(operations.update),
    delete: Boolean(operations.delete),
  }

  const permissions = Object.fromEntries(
    operationNames.map((operation) => [operation, definition.permissions?.[operation] ?? `${definition.key}.${operation}`]),
  ) as Resource<TRecord, TQuery, TCreate, TUpdate>['permissions']

  const identity = definition.identity ?? ((record: TRecord) => (record as { id: RecordIdentity }).id)

  function schemaFor(operation: 'record' | 'query' | 'create' | 'update'): ValidationSchema | undefined {
    const { adapters } = useResourceRuntime()
    return selectSchema({
      resource: definition.schemas?.[operation] as ValidationSchema | undefined,
      adapter: { adapter: adapters.schemas, resourceKey: definition.key, operation },
    })
  }

  const table = memoize((args: TableFactoryArguments<TQuery> | undefined) => {
    const props: TableProps<TRecord, TQuery> = {
      fields: definition.fields as never,
      namespace: args?.namespace ?? definition.key,
      searchParameters: args?.searchParameters ?? {},
      schema: schemaFor('query') as ValidationSchema<TQuery> | undefined,
    }
    if (args?.query) props.query = args.query
    if (operations.list) {
      props.load = (context) => operations.list!(context) as MaybePromise<CollectionResult<TRecord>>
    }
    if (definition.table?.fields) props.fields = pickFields(definition.fields, definition.table.fields) as never
    return props
  })

  const detail = memoize((args: DetailFactoryArguments) => {
    const props: DetailProps<TRecord> = {
      fields: (definition.detail?.fields ? pickFields(definition.fields, definition.detail.fields) : definition.fields) as never,
      id: args.id,
      namespace: definition.key,
      searchParameters: args.searchParameters ?? {},
    }
    if (operations.detail) props.load = (context) => operations.detail!(context) as never
    return props
  })

  const form = memoize((args: { id?: RecordIdentity; initialData?: Partial<TCreate>; searchParameters?: Record<string, unknown> } | undefined) => {
    const fields = (definition.form?.fields ? pickFields(definition.fields, definition.form.fields) : definition.fields) as never
    const searchParameters = args?.searchParameters ?? {}
    const initialData = (args?.initialData ?? definition.form?.initialData) as Partial<TCreate> | undefined

    if (args?.id === undefined) {
      const props: FormProps<TCreate> = {
        fields,
        searchParameters,
        namespace: `${definition.key}.create`,
        schema: schemaFor('create') as ValidationSchema<TCreate> | undefined,
        submit: async (draft) => {
          if (!operations.create) throw new Error(`[is-vue-framework] Resource "${definition.key}" has no create behavior.`)
          const result = await operations.create(draft as TCreate)
          await invalidate()
          return result
        },
      }
      if (initialData) props.initialData = initialData
      return props
    }

    const id = args.id
    const props: FormProps<TUpdate> = {
      fields,
      searchParameters,
      namespace: `${definition.key}.update.${String(id)}`,
      schema: schemaFor('update') as ValidationSchema<TUpdate> | undefined,
      submit: async (draft) => {
        if (!operations.update) throw new Error(`[is-vue-framework] Resource "${definition.key}" has no update behavior.`)
        const result = await operations.update(id, draft as TUpdate)
        await invalidate({ id })
        return result
      },
    }
    if (operations.detail) {
      props.load = (context) => operations.detail!({ ...context, id }) as never
    }
    if (args.initialData) props.initialData = args.initialData as unknown as Partial<TUpdate>
    return props
  })

  async function invalidate(args?: { id?: RecordIdentity }): Promise<void> {
    const { queryClient } = useResourceRuntime()
    await invalidateResourceData(queryClient, { resource: definition.key, id: args?.id })
  }

  async function remove(id: RecordIdentity): Promise<unknown> {
    if (!operations.delete) throw new Error(`[is-vue-framework] Resource "${definition.key}" has no delete behavior.`)
    const result = await operations.delete(id)
    await invalidate({ id })
    return result
  }

  return {
    key: definition.key,
    fields: definition.fields,
    routes,
    capabilities,
    permissions,
    identity,
    table: (args?: TableFactoryArguments<TQuery>) => table(args),
    detail,
    form: form as Resource<TRecord, TQuery, TCreate, TUpdate>['form'],
    remove,
    invalidate,
  }
}

function pickFields<TRecord extends object, TDraft extends object>(
  catalog: FieldCatalog<TRecord, TDraft>,
  keys: readonly string[],
): FieldCatalog<TRecord, TDraft> {
  const picked: FieldCatalog<TRecord, TDraft> = {}
  for (const key of keys) {
    const field = catalog[key]
    if (!field) throw new Error(`[is-vue-framework] Unknown field "${key}".`)
    picked[key] = field
  }
  return picked
}
