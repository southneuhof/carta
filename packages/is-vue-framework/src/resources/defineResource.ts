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
  AccessAdapter,
  DetailFactoryArguments,
  DetailProps,
  FieldCatalog,
  FieldContext,
  FormValidator,
  FormProps,
  MaybePromise,
  RecordIdentity,
  RecordIdentityValue,
  RecordLoadContext,
  ResourceSchemas,
  ResourceValidators,
  TableFactoryArguments,
  TableProps,
  ValidationSchema,
} from '../contracts'
import { stableValue } from '../query/keys'
import { invalidateResourceData } from '../query/client'
import { selectSchema } from '../validation'
import { useResourceRuntime } from './runtime'
import type { RouteLocationRaw } from 'vue-router'

/**
 * The identity shape a declaration yields. A key list picks those keys off the
 * record; a function contributes its return type; an omitted declaration keeps
 * the `{ id }` scalar default.
 */
export type ResolvedIdentity<TRecord extends object, TDeclaration> = TDeclaration extends readonly (keyof TRecord &
  string)[]
  ? IdentityFromKeys<TRecord, TDeclaration[number]>
  : TDeclaration extends (record: TRecord) => infer TResult
    ? TResult extends RecordIdentity
      ? TResult
      : RecordIdentityValue
    : RecordIdentityValue

type IdentityFromKeys<TRecord extends object, TKey extends keyof TRecord & string> = {
  [K in TKey]: TRecord[K] extends RecordIdentityValue ? TRecord[K] : RecordIdentityValue
}

/** Accepted spellings of an identity declaration before resolution. */
export type IdentityDeclarationInput<TRecord extends object> =
  | readonly (keyof TRecord & string)[]
  | ((record: TRecord) => RecordIdentity)

export interface ResourceOperations<
  TRecord extends object = Record<string, unknown>,
  TQuery extends object = Record<string, unknown>,
  TCreate extends object = Record<string, unknown>,
  TUpdate extends object = TCreate,
  TIdentity extends RecordIdentity = RecordIdentityValue,
> {
  /** Operation adapters return canonical results; consumers never unwrap wire envelopes. */
  list?: (context: CollectionLoadContext<TQuery>) => MaybePromise<CollectionResult<TRecord>>
  detail?: (context: RecordLoadContext<TIdentity>) => MaybePromise<TRecord | undefined>
  create?: (input: TCreate) => MaybePromise<TRecord>
  update?: (id: TIdentity, input: TUpdate) => MaybePromise<TRecord>
  delete?: (id: TIdentity) => MaybePromise<unknown>
  /** Type-only metadata; no runtime key is created. */
  readonly __record?: TRecord
  readonly __query?: TQuery
  readonly __create?: TCreate
  readonly __update?: TUpdate
  readonly __identity?: TIdentity
}

export type ResourceOperationKey = 'list' | 'detail' | 'create' | 'update' | 'delete'
export type ResourceOperationKeys<TOperations> = Extract<keyof TOperations, ResourceOperationKey>
type ResourceOperationContract<
  TRecord extends object = Record<string, unknown>,
  TQuery extends object = Record<string, unknown>,
  TCreate extends object = Record<string, unknown>,
  TUpdate extends object = TCreate,
  TIdentity extends RecordIdentity = RecordIdentityValue,
> = Pick<ResourceOperations<TRecord, TQuery, TCreate, TUpdate, TIdentity>, ResourceOperationKey>
type ResourceOperationMetadata<
  TRecord extends object,
  TQuery extends object,
  TCreate extends object,
  TUpdate extends object,
  TIdentity extends RecordIdentity,
> = {
  /** Compile-time only; this identity helper adds no JavaScript properties. */
  readonly __record: TRecord
  readonly __query: TQuery
  readonly __create: TCreate
  readonly __update: TUpdate
  readonly __identity: TIdentity
}
type ResourceMetadata<T> = T extends { readonly __record?: infer TValue } ? TValue : never
type ResourceQueryMetadata<T> = T extends { readonly __query?: infer TValue } ? TValue : never
type ResourceCreateMetadata<T> = T extends { readonly __create?: infer TValue } ? TValue : never
type ResourceUpdateMetadata<T> = T extends { readonly __update?: infer TValue } ? TValue : never
type ResourceIdentityMetadata<T> = T extends { readonly __identity?: infer TValue } ? TValue : never
type OperationReturn<T, TKey extends ResourceOperationKey> = T extends Record<TKey, infer TOperation>
  ? TOperation extends (...args: infer _TArgs) => infer TResult ? Awaited<TResult> : never
  : never
type OperationArgument<T, TKey extends ResourceOperationKey, TIndex extends number> = T extends Record<TKey, infer TOperation>
  ? TOperation extends (...args: infer TArgs) => unknown ? TArgs[TIndex] : never
  : never
type RecordFromList<T> = OperationReturn<T, 'list'> extends CollectionResult<infer TValue> ? TValue : never
type RecordFromDetail<T> = Exclude<OperationReturn<T, 'detail'>, undefined>

/** Backend-neutral operation-contract extractors. */
export type ResourceRecordOf<TOperations> = ResourceMetadata<TOperations> extends object
  ? ResourceMetadata<TOperations>
  : RecordFromList<TOperations> extends object ? RecordFromList<TOperations> : RecordFromDetail<TOperations> extends object ? RecordFromDetail<TOperations> : never
export type ResourceQueryOf<TOperations> = ResourceQueryMetadata<TOperations> extends object
  ? ResourceQueryMetadata<TOperations>
  : OperationArgument<TOperations, 'list', 0> extends CollectionLoadContext<infer TValue> ? TValue : never
export type ResourceCreateOf<TOperations> = ResourceCreateMetadata<TOperations> extends object ? ResourceCreateMetadata<TOperations> : OperationArgument<TOperations, 'create', 0> extends object ? OperationArgument<TOperations, 'create', 0> : never
export type ResourceUpdateOf<TOperations> = ResourceUpdateMetadata<TOperations> extends object ? ResourceUpdateMetadata<TOperations> : OperationArgument<TOperations, 'update', 1> extends object ? OperationArgument<TOperations, 'update', 1> : never
export type ResourceIdentityOf<TOperations> = ResourceIdentityMetadata<TOperations> extends RecordIdentity
  ? ResourceIdentityMetadata<TOperations>
  : OperationArgument<TOperations, 'update', 0> extends RecordIdentity ? OperationArgument<TOperations, 'update', 0> : OperationArgument<TOperations, 'delete', 0> extends RecordIdentity ? OperationArgument<TOperations, 'delete', 0> : never

type CapabilityHandlerAt<TCapabilities, TKey extends PropertyKey> = TCapabilities extends Record<TKey, ResourceCapability<infer THandler>> ? THandler : never
type CapabilityReturn<THandler> = THandler extends (...arguments_: never[]) => infer TResult ? Awaited<TResult> : never
type CapabilityHandlerArgument<THandler, TIndex extends number> = THandler extends (...arguments_: infer TArguments) => unknown ? TArguments[TIndex] : never
type CapabilityRecordOf<TCapabilities> = CapabilityReturn<CapabilityHandlerAt<TCapabilities, 'list'>> extends CollectionResult<infer TRecord>
  ? TRecord : Exclude<CapabilityReturn<CapabilityHandlerAt<TCapabilities, 'detail'>>, undefined>
type CapabilityQueryOf<TCapabilities> = CapabilityHandlerArgument<CapabilityHandlerAt<TCapabilities, 'list'>, 0> extends CollectionLoadContext<infer TQuery> ? TQuery : Record<string, never>
type CapabilityCreateOf<TCapabilities> = CapabilityHandlerArgument<CapabilityHandlerAt<TCapabilities, 'create'>, 0> extends infer TValue ? TValue extends object ? TValue : Record<string, never> : Record<string, never>
type CapabilityUpdateOf<TCapabilities> = CapabilityHandlerArgument<CapabilityHandlerAt<TCapabilities, 'update'>, 1> extends infer TValue ? TValue extends object ? TValue : Record<string, never> : Record<string, never>
type CapabilityIdentityOf<TCapabilities> = CapabilityHandlerArgument<CapabilityHandlerAt<TCapabilities, 'update'>, 0> extends RecordIdentity
  ? CapabilityHandlerArgument<CapabilityHandlerAt<TCapabilities, 'update'>, 0>
  : CapabilityHandlerArgument<CapabilityHandlerAt<TCapabilities, 'delete'>, 0> extends RecordIdentity ? CapabilityHandlerArgument<CapabilityHandlerAt<TCapabilities, 'delete'>, 0> : RecordIdentityValue

function standardHandlers<
  TRecord extends object,
  TQuery extends object,
  TCreate extends object,
  TUpdate extends object,
  TIdentity extends RecordIdentity,
  const TCapabilities extends ResourceCapabilitiesDefinition<TRecord, TQuery, TCreate, TUpdate, TIdentity>,
>(capabilities: TCapabilities): Partial<StandardCapabilityHandlers<TRecord, TQuery, TCreate, TUpdate, TIdentity>> {
  return {
    list: capabilities.list?.handler,
    detail: capabilities.detail?.handler,
    create: capabilities.create?.handler,
    update: capabilities.update?.handler,
    delete: capabilities.delete?.handler,
  }
}

/**
 * Keeps a narrow manual operation object while associating backend-neutral
 * record/input metadata at compile time only. It returns the original object.
 */
export function defineResourceOperations<
  TRecord extends object,
  TQuery extends object = Record<string, never>,
  TCreate extends object = TRecord,
  TUpdate extends object = TCreate,
  TIdentity extends RecordIdentity = RecordIdentityValue,
>(): <const TOperations extends ResourceOperationContract<TRecord, TQuery, TCreate, TUpdate, TIdentity>>(
  operations: TOperations,
) => TOperations & ResourceOperationMetadata<TRecord, TQuery, TCreate, TUpdate, TIdentity>
export function defineResourceOperations() {
  return <TOperations extends object>(operations: TOperations) => operations
}

export interface ResourceSurfaceDefinition {
  /** Field order for this surface; defaults to catalog declaration order. */
  fields?: readonly string[]
}

export type AnyHandler = (...arguments_: never[]) => unknown
export type ResourceCapabilityKey = ResourceOperationKey
export type ResourceCapabilityTarget<TIdentity extends RecordIdentity = RecordIdentityValue> =
  | { name: string }
  | { name: string; params: Record<string, string | number> }
  | { name: string; params: (id: TIdentity) => Record<string, string | number> }

export interface ResourceCapability<THandler extends AnyHandler = AnyHandler, TIdentity extends RecordIdentity = RecordIdentityValue> {
  handler: THandler
  permission: string | null
  to?: ResourceCapabilityTarget<TIdentity>
  visible?: (context: { record?: Record<string, unknown>; access: AccessAdapter }) => boolean
}

type StandardCapabilityHandlers<
  TRecord extends object,
  TQuery extends object,
  TCreate extends object,
  TUpdate extends object,
  TIdentity extends RecordIdentity,
> = Required<ResourceOperations<TRecord, TQuery, TCreate, TUpdate, TIdentity>>

export type ResourceCapabilitiesDefinition<
  TRecord extends object = Record<string, unknown>,
  TQuery extends object = Record<string, unknown>,
  TCreate extends object = Record<string, unknown>,
  TUpdate extends object = TCreate,
  TIdentity extends RecordIdentity = RecordIdentityValue,
> = Partial<{ [TKey in ResourceOperationKey]: ResourceCapability<StandardCapabilityHandlers<TRecord, TQuery, TCreate, TUpdate, TIdentity>[TKey], TIdentity> }>
  & Record<string, ResourceCapability>

export type NavigableResourceCapability<TIdentity extends RecordIdentity = RecordIdentityValue> = ResourceCapability<AnyHandler, TIdentity> & {
  routeName: string
  to: RouteLocationRaw | ((id: TIdentity) => RouteLocationRaw)
}

export interface NormalizedResourceCapability<TIdentity extends RecordIdentity = RecordIdentityValue> {
  key: string
  permission: string | null
  routeName?: string
  to?: RouteLocationRaw | ((id: TIdentity) => RouteLocationRaw)
  visible?: (context: { record?: Record<string, unknown>; access: AccessAdapter }) => boolean
}

export interface RegisteredResourceCapability {
  resourceKey: string
  capability: string
  permission: string | null
  visible?: NormalizedResourceCapability['visible']
}

const capabilityRegistry = new Map<string, RegisteredResourceCapability>()

export function resourceCapabilityForRoute(name: string): RegisteredResourceCapability | undefined {
  return capabilityRegistry.get(name)
}

export function resetResourceCapabilityRegistry(): void {
  capabilityRegistry.clear()
}

function registerResourceCapability(name: string, capability: RegisteredResourceCapability): void {
  const existing = capabilityRegistry.get(name)
  if (!existing) {
    capabilityRegistry.set(name, capability)
    return
  }
  if (existing.resourceKey === capability.resourceKey && existing.capability === capability.capability && existing.permission === capability.permission && existing.visible === capability.visible) return
  throw new Error(`[is-vue-framework] Route capability conflict for "${name}": ${existing.resourceKey}.${existing.capability} and ${capability.resourceKey}.${capability.capability}.`)
}

/**
 * `TDeclaration` is the literal type of the `identity` value; every downstream
 * signature reads the identity shape it resolves to. It is inferred from the
 * definition — see `defineResource`.
 */
export interface ResourceDefinition<
  TRecord extends object = Record<string, unknown>,
  TQuery extends object = Record<string, unknown>,
  TCreate extends object = Record<string, unknown>,
  TUpdate extends object = TCreate,
  TDeclaration extends IdentityDeclarationInput<TRecord> | undefined = undefined,
  TCapabilities extends object = ResourceCapabilitiesDefinition<TRecord, TQuery, TCreate, TUpdate, ResolvedIdentity<TRecord, TDeclaration>>,
> {
  key: string
  fields: FieldCatalog<TRecord, TCreate>
  /** `['userId', 'roleId']` or `(record) => identity`; omitted means `record.id`. */
  identity?: TDeclaration
  capabilities: TCapabilities
  table?: ResourceSurfaceDefinition
  detail?: ResourceSurfaceDefinition
  form?: ResourceSurfaceDefinition & { initialData?: Partial<TCreate> }
  schemas?: ResourceSchemas<TRecord, TQuery, TCreate, TUpdate>
  validators?: ResourceValidators<TCreate, TUpdate>
}

/** Arguments for collection surface. */
export interface TableSurfaceArguments<TQuery extends object = Record<string, unknown>>
  extends TableFactoryArguments<TQuery> {}

/** Arguments for record surface. */
export interface DetailSurfaceArguments<TIdentity extends RecordIdentity = RecordIdentityValue>
  extends DetailFactoryArguments<TIdentity> {}

/** Shell-ready collection bundle: `v-bind` it onto `ListView`. */
export interface TableSurface<TRecord extends object, TQuery extends object> {
  table: TableProps<TRecord, TQuery>
  createRoute: RouteLocationRaw | undefined
  detailRoute: ((record: TRecord) => RouteLocationRaw | undefined) | undefined
  updateRoute: ((record: TRecord) => RouteLocationRaw | undefined) | undefined
  canDelete: ((record: TRecord) => boolean) | undefined
  deleteRecord: ((record: TRecord) => Promise<unknown>) | undefined
}

/** Shell-ready record bundle: `v-bind` it onto `DetailView`. */
export interface DetailSurface<TRecord extends object> {
  detail: DetailProps<TRecord>
}

export interface ResourceBase<
  TRecord extends object = Record<string, unknown>,
  TQuery extends object = Record<string, unknown>,
  TCreate extends object = Record<string, unknown>,
  TUpdate extends object = TCreate,
  TIdentity extends RecordIdentity = RecordIdentityValue,
  TCapabilities extends object = ResourceCapabilitiesDefinition<TRecord, TQuery, TCreate, TUpdate, TIdentity>,
> {
  key: string
  fields: FieldCatalog<TRecord, TCreate>
  capabilities: TCapabilities
  /** Record → identity, the direction the framework needs at runtime. */
  identity: (record: TRecord) => TIdentity
  /**
   * Record → detail route, composed from the identity extractor and
   * `actions.detail`. Absent when the resource has no detail route, so a list
   * screen never hand-writes an identity into a URL.
   */
  detailRoute?: (record: TRecord) => RouteLocationRaw
  invalidate: (args?: { id?: TIdentity }) => Promise<void>
}

export type ListCapableResource<TRecord extends object = Record<string, unknown>, TQuery extends object = Record<string, unknown>> = {
  table: (args?: TableSurfaceArguments<TQuery>) => TableSurface<TRecord, TQuery>
}
export type DetailCapableResource<TRecord extends object = Record<string, unknown>, TIdentity extends RecordIdentity = RecordIdentityValue> = {
  detail: (args: DetailSurfaceArguments<TIdentity>) => DetailSurface<TRecord>
}
type CreateForm<TCreate extends object, TRecord extends object> = {
  (): FormProps<TCreate, TRecord>
  (args: { initialData?: Partial<TCreate>; searchParameters?: Record<string, unknown>; context?: FieldContext }): FormProps<TCreate, TRecord>
}
type UpdateForm<TUpdate extends object, TRecord extends object, TIdentity extends RecordIdentity> = {
  (args: { id: TIdentity; initialData?: Partial<TUpdate>; searchParameters?: Record<string, unknown>; context?: FieldContext }): FormProps<TUpdate, TRecord>
}
type FormCapability<TCapabilities, TRecord extends object, TCreate extends object, TUpdate extends object, TIdentity extends RecordIdentity> =
  TCapabilities extends Record<'create', ResourceCapability>
    ? TCapabilities extends Record<'update', ResourceCapability>
      ? { form: CreateForm<TCreate, TRecord> & UpdateForm<TUpdate, TRecord, TIdentity> }
      : { form: CreateForm<TCreate, TRecord> }
    : TCapabilities extends Record<'update', ResourceCapability>
      ? { form: UpdateForm<TUpdate, TRecord, TIdentity> }
      : {}

type FormCapabilities<TCapabilities> =
  TCapabilities extends Record<'create', ResourceCapability>
    ? TCapabilities extends Record<'update', ResourceCapability> ? 'create-update' : 'create'
    : TCapabilities extends Record<'update', ResourceCapability> ? 'update' : never

/** Public resource surface follows literal operation keys, not runtime enumeration. */
export type Resource<
  TRecord extends object = Record<string, unknown>,
  TQuery extends object = Record<string, unknown>,
  TCreate extends object = Record<string, unknown>,
  TUpdate extends object = TCreate,
  TIdentity extends RecordIdentity = RecordIdentityValue,
  TCapabilities extends ResourceCapabilitiesDefinition<TRecord, TQuery, TCreate, TUpdate, TIdentity> = ResourceCapabilitiesDefinition<TRecord, TQuery, TCreate, TUpdate, TIdentity>,
> = ResourceBase<TRecord, TQuery, TCreate, TUpdate, TIdentity, TCapabilities>
  & (TCapabilities extends Record<'list', ResourceCapability> ? ListCapableResource<TRecord, TQuery> : {})
  & (TCapabilities extends Record<'detail', ResourceCapability> ? DetailCapableResource<TRecord, TIdentity> : {})
  & FormCapability<TCapabilities, TRecord, TCreate, TUpdate, TIdentity>
  /** Compile-time capability tag; no runtime property is emitted. */
  & { readonly __formCapabilities: FormCapabilities<TCapabilities> }
  & (TCapabilities extends Record<'delete', ResourceCapability> ? { delete: (id: TIdentity) => Promise<unknown> } : {})

const operationNames = ['list', 'detail', 'create', 'update', 'delete'] as const

function normalizeCapabilities<TIdentity extends RecordIdentity>(
  resourceKey: string,
  declarations: Record<string, ResourceCapability<AnyHandler, TIdentity>>,
): Record<string, NormalizedResourceCapability<TIdentity>> {
  const capabilities: Record<string, NormalizedResourceCapability<TIdentity>> = {}
  for (const [key, declaration] of Object.entries(declarations)) {
    const target = declaration.to
    const to = target && ('params' in target
      ? (typeof target.params === 'function'
        ? ((id: TIdentity) => ({ name: target.name, params: (target.params as (value: TIdentity) => Record<string, string | number>)(id) } as unknown as RouteLocationRaw))
        : ({ name: target.name, params: target.params } as unknown as RouteLocationRaw))
      : ({ name: target.name } as unknown as RouteLocationRaw))
    const capability: NormalizedResourceCapability<TIdentity> = { key, permission: declaration.permission, visible: declaration.visible, ...(target ? { routeName: target.name, to } : {}) }
    capabilities[key] = capability
    if (target) registerResourceCapability(target.name, { resourceKey, capability: key, permission: capability.permission, visible: capability.visible })
  }
  return capabilities
}

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
  const TCapabilities extends Record<string, ResourceCapability>,
  TRecord extends object = Extract<CapabilityRecordOf<TCapabilities>, object>,
  TQuery extends object = Extract<CapabilityQueryOf<TCapabilities>, object>,
  TCreate extends object = Extract<CapabilityCreateOf<TCapabilities>, object>,
  TUpdate extends object = Extract<CapabilityUpdateOf<TCapabilities>, object>,
  const TDeclaration extends IdentityDeclarationInput<TRecord> | undefined = undefined,
>(
  definition: ResourceDefinition<TRecord, TQuery, TCreate, TUpdate, TDeclaration, TCapabilities> & {
    capabilities: TCapabilities & ResourceCapabilitiesDefinition<TRecord, TQuery, TCreate, TUpdate, ResolvedIdentity<TRecord, TDeclaration>>
  },
): Resource<TRecord, TQuery, TCreate, TUpdate, ResolvedIdentity<TRecord, TDeclaration>, TCapabilities> {
  type TIdentity = ResolvedIdentity<TRecord, TDeclaration>
  const handlers = standardHandlers<TRecord, TQuery, TCreate, TUpdate, TIdentity, TCapabilities>(definition.capabilities)
  const capabilities = normalizeCapabilities<TIdentity>(definition.key, definition.capabilities)

  const identity = resolveIdentityExtractor<TRecord, TIdentity>(definition.identity)

  function schemaFor(operation: 'record' | 'query' | 'create' | 'update'): ValidationSchema | undefined {
    const { adapters } = useResourceRuntime()
    return selectSchema({
      resource: definition.schemas?.[operation] as ValidationSchema | undefined,
      adapter: { adapter: adapters.schemas, resourceKey: definition.key, operation },
    })
  }

  const tableProps = memoize((args: TableFactoryArguments<TQuery> | undefined) => {
    const defaultFields = useResourceRuntime().fieldDefaults.fields
    const props: TableProps<TRecord, TQuery> = {
      fields: definition.fields as never,
      namespace: args?.namespace ?? definition.key,
      searchParameters: args?.searchParameters ?? {},
      schema: schemaFor('query') as ValidationSchema<TQuery> | undefined,
    }
    if (args?.query) props.query = args.query
    if (args?.pagination !== undefined) props.pagination = args.pagination
    if (args?.reorderable) {
      props.reorderable = true
      props.rowKey = (record) => {
        const value = identity(record)
        if (typeof value !== 'string' && typeof value !== 'number') {
          throw new Error('[is-vue-framework] Reorderable resources require a primitive identity.')
        }
        return value
      }
    }
    if (handlers.list) {
      props.load = (context) => handlers.list!(context)
    }
    if (definition.table?.fields) {
      props.fields = pickFields(definition.fields, definition.table.fields, defaultFields) as never
    }
    return props
  })

  const detailProps = memoize((args: DetailFactoryArguments<TIdentity>) => {
    const defaultFields = useResourceRuntime().fieldDefaults.fields
    const props: DetailProps<TRecord> = {
      fields: (
        definition.detail?.fields
          ? pickFields(definition.fields, definition.detail.fields, defaultFields)
          : definition.fields
      ) as never,
      id: args.id,
      namespace: definition.key,
      searchParameters: args.searchParameters ?? {},
    }
    if (handlers.detail) {
      props.load = (context) => handlers.detail!(context as RecordLoadContext<TIdentity>) as never
    }
    return props
  })

  function allowed(record: TRecord, operation: 'detail' | 'update' | 'delete'): boolean {
    const { access } = useResourceRuntime().adapters
    const capability = capabilities[operation]
    const accessRecord = record as Record<string, unknown>
    return Boolean(capability && (capability.permission === null || access.allows({ operation, permission: capability.permission, record: accessRecord })) && (!capability.visible || capability.visible({ record: accessRecord, access })))
  }

  function tableSurface(args?: TableSurfaceArguments<TQuery>): TableSurface<TRecord, TQuery> {
    const data = args
    const create = capabilities.create
    const { access } = useResourceRuntime().adapters
    const createRoute = create?.to && typeof create.to !== 'function' && (create.permission === null || access.allows({ operation: 'create', permission: create.permission })) && (!create.visible || create.visible({ access })) ? create.to : undefined
    const detail = capabilities.detail
    const update = capabilities.update
    const hasDelete = Boolean(capabilities.delete && handlers.delete)
    return {
      table: tableProps(data as TableFactoryArguments<TQuery>),
      createRoute,
      detailRoute: detail?.to ? (record) => allowed(record, 'detail') ? (typeof detail.to === 'function' ? detail.to(identity(record)) : detail.to) : undefined : undefined,
      updateRoute: update?.to ? (record) => allowed(record, 'update') ? (typeof update.to === 'function' ? update.to(identity(record)) : update.to) : undefined : undefined,
      canDelete: hasDelete ? (record) => allowed(record, 'delete') : undefined,
      deleteRecord: hasDelete ? (record) => deleteResource(identity(record)) : undefined,
    }
  }

  function detailSurface(args: DetailSurfaceArguments<TIdentity>): DetailSurface<TRecord> {
    return {
      detail: detailProps(args),
    }
  }

  const form = memoize((args: { id?: TIdentity; initialData?: Partial<TCreate>; searchParameters?: Record<string, unknown>; context?: FieldContext } | undefined) => {
    const defaultFields = useResourceRuntime().fieldDefaults.fields
    const fields = (
      definition.form?.fields
        ? pickFields(definition.fields, definition.form.fields, defaultFields)
        : definition.fields
    ) as never
    const searchParameters = args?.searchParameters ?? {}
    const initialData = (args?.initialData ?? definition.form?.initialData) as Partial<TCreate> | undefined

    if (args?.id === undefined) {
      const props: FormProps<TCreate, TRecord> = {
        fields,
        searchParameters,
        namespace: `${definition.key}.create`,
        schema: schemaFor('create') as ValidationSchema<TCreate> | undefined,
        validators: definition.validators?.create as readonly FormValidator<TCreate>[] | undefined,
        context: args?.context,
        submit: async (draft) => {
          if (!handlers.create) throw new Error(`[is-vue-framework] Resource "${definition.key}" has no create capability.`)
          const result = await handlers.create(draft as TCreate)
          await invalidate()
          return result
        },
      }
      if (initialData) props.initialData = initialData
      return props
    }

    const id = args.id
    const props: FormProps<TUpdate, TRecord> = {
      fields,
      searchParameters,
      namespace: `${definition.key}.update.${identityToken(id)}`,
      schema: schemaFor('update') as ValidationSchema<TUpdate> | undefined,
      validators: definition.validators?.update as readonly FormValidator<TUpdate>[] | undefined,
      context: args?.context,
      submit: async (draft) => {
        if (!handlers.update) throw new Error(`[is-vue-framework] Resource "${definition.key}" has no update capability.`)
        const result = await handlers.update(id, draft as TUpdate)
        await invalidate({ id })
        return result
      },
    }
    if (handlers.detail) {
      props.load = (context) => handlers.detail!({ ...context, id }) as never
    }
    if (args.initialData) props.initialData = args.initialData as unknown as Partial<TUpdate>
    return props
  })

  async function invalidate(args?: { id?: TIdentity }): Promise<void> {
    const { queryClient } = useResourceRuntime()
    await invalidateResourceData(queryClient, { resource: definition.key, id: args?.id })
  }

  async function deleteResource(id: TIdentity): Promise<unknown> {
    if (!handlers.delete) throw new Error(`[is-vue-framework] Resource "${definition.key}" has no delete capability.`)
    const result = await handlers.delete(id)
    await invalidate({ id })
    return result
  }

  const detailCapability = capabilities.detail

  const resource: ResourceBase<TRecord, TQuery, TCreate, TUpdate, TIdentity, TCapabilities>
    & ListCapableResource<TRecord, TQuery>
    & DetailCapableResource<TRecord, TIdentity>
    & { form: CreateForm<TCreate, TRecord> & UpdateForm<TUpdate, TRecord, TIdentity>; delete: (id: TIdentity) => Promise<unknown> } = {
    key: definition.key,
    fields: definition.fields,
    capabilities: definition.capabilities,
    identity,
    ...(detailCapability?.to ? { detailRoute: (record: TRecord) => {
      const to = detailCapability.to!
      return typeof to === 'function' ? to(identity(record)) : to
    } } : {}),
    table: tableSurface,
    detail: detailSurface,
    form: form as CreateForm<TCreate, TRecord> & UpdateForm<TUpdate, TRecord, TIdentity>,
    delete: deleteResource,
    invalidate,
  }
  return resource as Resource<TRecord, TQuery, TCreate, TUpdate, TIdentity, TCapabilities>
}

/**
 * Turns a declaration into the record → identity extractor. A key list picks
 * exactly the declared keys; a function is used verbatim; nothing declared
 * means `record.id`.
 */
function resolveIdentityExtractor<TRecord extends object, TIdentity>(
  declaration: IdentityDeclarationInput<TRecord> | undefined,
): (record: TRecord) => TIdentity {
  if (typeof declaration === 'function') return declaration as (record: TRecord) => TIdentity
  if (Array.isArray(declaration)) {
    const keys = declaration as readonly (keyof TRecord & string)[]
    return (record: TRecord) => {
      const picked: Record<string, unknown> = {}
      for (const key of keys) picked[key] = record[key]
      return picked as TIdentity
    }
  }
  return (record: TRecord) => (record as { id: TIdentity }).id
}

/** Stable, human-readable token for an identity used inside a query namespace. */
function identityToken(id: RecordIdentity): string {
  return typeof id === 'object' ? JSON.stringify(stableValue(id)) : String(id)
}

function pickFields<TRecord extends object, TDraft extends object>(
  catalog: FieldCatalog<TRecord, TDraft>,
  keys: readonly string[],
  defaultFields: FieldCatalog = {},
): FieldCatalog<TRecord, TDraft> {
  const picked: FieldCatalog<TRecord, TDraft> = {}
  for (const key of keys) {
    const field = catalog[key]
    if (!field && !defaultFields[key]) throw new Error(`[is-vue-framework] Unknown field "${key}".`)
    picked[key] = field ?? {}
  }
  return picked
}
