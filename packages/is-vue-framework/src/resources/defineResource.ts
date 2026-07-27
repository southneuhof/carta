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
  FormProps,
  MaybePromise,
  RecordIdentity,
  RecordIdentityValue,
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

export type ResourceActionKey = ResourceOperationKey
export type ResourceActionTarget<TIdentity extends RecordIdentity = RecordIdentityValue> =
  | { name: string }
  | { name: string; params: (id: TIdentity) => Record<string, string | number> }

export interface ResourceActionDefinition<TIdentity extends RecordIdentity = RecordIdentityValue> {
  permission: string | null
  to?: ResourceActionTarget<TIdentity>
  visible?: (context: { record?: Record<string, unknown>; access: AccessAdapter }) => boolean
}

export type ResourceActionsDefinition<
  TIdentity extends RecordIdentity = RecordIdentityValue,
  TKey extends ResourceActionKey = ResourceActionKey,
> = Partial<
  Record<TKey, ResourceActionDefinition<TIdentity>>
>

export type NavigableResourceAction<TIdentity extends RecordIdentity = RecordIdentityValue> = ResourceAction<TIdentity> & {
  routeName: string
  to: RouteLocationRaw | ((id: TIdentity) => RouteLocationRaw)
}

export interface ResourceAction<TIdentity extends RecordIdentity = RecordIdentityValue> {
  key: ResourceActionKey
  permission: string | null
  routeName?: string
  to?: RouteLocationRaw | ((id: TIdentity) => RouteLocationRaw)
  visible?: (context: { record?: Record<string, unknown>; access: AccessAdapter }) => boolean
}

export interface RegisteredResourceAction {
  resourceKey: string
  action: ResourceActionKey
  permission: string | null
  visible?: ResourceAction['visible']
}

const actionRegistry = new Map<string, RegisteredResourceAction>()

export function resourceActionForRoute(name: string): RegisteredResourceAction | undefined {
  return actionRegistry.get(name)
}

export function resetResourceActionRegistry(): void {
  actionRegistry.clear()
}

function registerResourceAction(name: string, action: RegisteredResourceAction): void {
  const existing = actionRegistry.get(name)
  if (!existing) {
    actionRegistry.set(name, action)
    return
  }
  if (existing.resourceKey === action.resourceKey && existing.action === action.action && existing.permission === action.permission && existing.visible === action.visible) return
  throw new Error(`[is-vue-framework] Route action conflict for "${name}": ${existing.resourceKey}.${existing.action} and ${action.resourceKey}.${action.action}.`)
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
  TOperations extends object = ResourceOperations<TRecord, TQuery, TCreate, TUpdate, ResolvedIdentity<TRecord, TDeclaration>>,
> {
  key: string
  fields: FieldCatalog<TRecord, TCreate>
  /** `['userId', 'roleId']` or `(record) => identity`; omitted means `record.id`. */
  identity?: TDeclaration
  operations?: TOperations
  table?: ResourceSurfaceDefinition
  detail?: ResourceSurfaceDefinition
  form?: ResourceSurfaceDefinition & { initialData?: Partial<TCreate> }
  schemas?: ResourceSchemas<TRecord, TQuery, TCreate, TUpdate>
  actions?: ResourceActionsDefinition<ResolvedIdentity<TRecord, TDeclaration>, ResourceOperationKeys<TOperations>>
}

/** Arguments for collection surface. `onDelete` enables generated row deletion. */
export interface TableSurfaceArguments<TQuery extends object = Record<string, unknown>>
  extends TableFactoryArguments<TQuery> {
  /** Confirmation and feedback remain route-owned. */
  onDelete?: (record: object) => void
}

/** Arguments for record surface. */
export interface DetailSurfaceArguments<TIdentity extends RecordIdentity = RecordIdentityValue>
  extends DetailFactoryArguments<TIdentity> {}

/** Per-record table actions. Page actions belong in route-owned view slots. */
export type RowAction =
  | { key: 'detail' | 'update'; label: string; to: RouteLocationRaw }
  | { key: 'delete'; label: string; onSelect: () => void }

/** Shell-ready collection bundle: `v-bind` it onto `ListView`. */
export interface TableSurface<TRecord extends object, TQuery extends object> {
  table: TableProps<TRecord, TQuery>
  /** Available per-record actions, already filtered through resource access policy. */
  rowControls: ((record: TRecord) => RowAction[]) | undefined
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
  TOperationKey extends ResourceActionKey = ResourceActionKey,
> {
  key: string
  fields: FieldCatalog<TRecord, TCreate>
  actions: Partial<Record<TOperationKey, ResourceAction<TIdentity>>>
  /** Record → identity, the direction the framework needs at runtime. */
  identity: (record: TRecord) => TIdentity
  /**
   * Record → detail href, composed from the identity extractor and
   * `actions.detail`. Absent when the resource has no detail route, so a list
   * screen never hand-writes an identity into a URL.
   */
  rowLink?: (record: TRecord) => RouteLocationRaw
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
  (args: { initialData?: Partial<TCreate>; searchParameters?: Record<string, unknown> }): FormProps<TCreate, TRecord>
}
type UpdateForm<TUpdate extends object, TRecord extends object, TIdentity extends RecordIdentity> = {
  (args: { id: TIdentity; initialData?: Partial<TUpdate>; searchParameters?: Record<string, unknown> }): FormProps<TUpdate, TRecord>
}
type FormCapability<TOperations, TRecord extends object, TCreate extends object, TUpdate extends object, TIdentity extends RecordIdentity> =
  'create' extends ResourceOperationKeys<TOperations>
    ? 'update' extends ResourceOperationKeys<TOperations>
      ? { form: CreateForm<TCreate, TRecord> & UpdateForm<TUpdate, TRecord, TIdentity> }
      : { form: CreateForm<TCreate, TRecord> }
    : 'update' extends ResourceOperationKeys<TOperations>
      ? { form: UpdateForm<TUpdate, TRecord, TIdentity> }
      : {}

type FormCapabilities<TOperations> =
  'create' extends ResourceOperationKeys<TOperations>
    ? 'update' extends ResourceOperationKeys<TOperations> ? 'create-update' : 'create'
    : 'update' extends ResourceOperationKeys<TOperations> ? 'update' : never

/** Public resource surface follows literal operation keys, not runtime enumeration. */
export type Resource<
  TRecord extends object = Record<string, unknown>,
  TQuery extends object = Record<string, unknown>,
  TCreate extends object = Record<string, unknown>,
  TUpdate extends object = TCreate,
  TIdentity extends RecordIdentity = RecordIdentityValue,
  TOperations extends object = ResourceOperations<TRecord, TQuery, TCreate, TUpdate, TIdentity>,
> = ResourceBase<TRecord, TQuery, TCreate, TUpdate, TIdentity, ResourceOperationKeys<TOperations>>
  & ('list' extends ResourceOperationKeys<TOperations> ? ListCapableResource<TRecord, TQuery> : {})
  & ('detail' extends ResourceOperationKeys<TOperations> ? DetailCapableResource<TRecord, TIdentity> : {})
  & FormCapability<TOperations, TRecord, TCreate, TUpdate, TIdentity>
  /** Compile-time capability tag; no runtime property is emitted. */
  & { readonly __formCapabilities: FormCapabilities<TOperations> }
  & ('delete' extends ResourceOperationKeys<TOperations> ? { remove: (id: TIdentity) => Promise<unknown> } : {})

const operationNames = ['list', 'detail', 'create', 'update', 'delete'] as const

function normalizeActions<TIdentity extends RecordIdentity>(
  resourceKey: string,
  declarations: ResourceActionsDefinition<TIdentity, ResourceActionKey> | undefined,
): Partial<Record<ResourceActionKey, ResourceAction<TIdentity>>> {
  const actions: Partial<Record<ResourceActionKey, ResourceAction<TIdentity>>> = {}
  for (const key of operationNames) {
    const declaration = declarations?.[key]
    if (!declaration) continue
    const target = declaration.to
    const to = target && ('params' in target
      ? ((id: TIdentity) => ({ name: target.name, params: target.params(id) } as unknown as RouteLocationRaw))
      : ({ name: target.name } as unknown as RouteLocationRaw))
    const action: ResourceAction<TIdentity> = { key, permission: declaration.permission, visible: declaration.visible, ...(target ? { routeName: target.name, to } : {}) }
    actions[key] = action
    if (target) registerResourceAction(target.name, { resourceKey, action: key, permission: action.permission, visible: action.visible })
  }
  return actions
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

/** Prefer this overload for inferred, narrow operation objects (including Hono). */
export function defineResource<
  const TOperations extends { readonly __record: object },
  TRecord extends object = Extract<ResourceRecordOf<TOperations>, object>,
  TQuery extends object = Extract<ResourceQueryOf<TOperations>, object>,
  TCreate extends object = Extract<ResourceCreateOf<TOperations>, object>,
  TUpdate extends object = Extract<ResourceUpdateOf<TOperations>, object>,
  const TDeclaration extends IdentityDeclarationInput<TRecord> | undefined = undefined,
>(
  definition: ResourceDefinition<TRecord, TQuery, TCreate, TUpdate, TDeclaration, TOperations>,
): Resource<TRecord, TQuery, TCreate, TUpdate, ResolvedIdentity<TRecord, TDeclaration>, TOperations>

/** Explicit generic spelling remains available for existing manual resources. */
export function defineResource<
  TRecord extends object = Record<string, unknown>,
  TQuery extends object = Record<string, unknown>,
  TCreate extends object = Record<string, unknown>,
  TUpdate extends object = TCreate,
  const TDeclaration extends IdentityDeclarationInput<TRecord> | undefined = undefined,
  const TOperations extends ResourceOperationContract<TRecord, TQuery, TCreate, TUpdate, ResolvedIdentity<TRecord, TDeclaration>> = ResourceOperations<TRecord, TQuery, TCreate, TUpdate, ResolvedIdentity<TRecord, TDeclaration>>,
>(
  definition: ResourceDefinition<TRecord, TQuery, TCreate, TUpdate, TDeclaration, TOperations>,
): Resource<TRecord, TQuery, TCreate, TUpdate, ResolvedIdentity<TRecord, TDeclaration>, TOperations>

/**
 * `TDeclaration` is inferred from the `identity` value — a `const` type
 * parameter keeps a key list's literal types — and resolves the identity shape
 * every operation, route builder, and factory then speaks. A call site that
 * spells earlier type arguments explicitly must spell this one too, because
 * TypeScript falls back to defaults rather than inference for a partially
 * supplied type-argument list.
 */
export function defineResource<
  TRecord extends object = Record<string, unknown>,
  TQuery extends object = Record<string, unknown>,
  TCreate extends object = Record<string, unknown>,
  TUpdate extends object = TCreate,
  const TDeclaration extends IdentityDeclarationInput<TRecord> | undefined = undefined,
  const TOperations extends ResourceOperationContract<TRecord, TQuery, TCreate, TUpdate, ResolvedIdentity<TRecord, TDeclaration>> = ResourceOperations<TRecord, TQuery, TCreate, TUpdate, ResolvedIdentity<TRecord, TDeclaration>>,
>(
  definition: ResourceDefinition<TRecord, TQuery, TCreate, TUpdate, TDeclaration, TOperations>,
): Resource<TRecord, TQuery, TCreate, TUpdate, ResolvedIdentity<TRecord, TDeclaration>, TOperations> {
  type TIdentity = ResolvedIdentity<TRecord, TDeclaration>
  const operations: ResourceOperations<TRecord, TQuery, TCreate, TUpdate, TIdentity> = definition.operations ?? {}
  const actions = normalizeActions(definition.key, definition.actions as ResourceActionsDefinition<TIdentity, ResourceActionKey> | undefined)

  const identity = resolveIdentityExtractor<TRecord, TIdentity>(definition.identity)

  function schemaFor(operation: 'record' | 'query' | 'create' | 'update'): ValidationSchema | undefined {
    const { adapters } = useResourceRuntime()
    return selectSchema({
      resource: definition.schemas?.[operation] as ValidationSchema | undefined,
      adapter: { adapter: adapters.schemas, resourceKey: definition.key, operation },
    })
  }

  const tableProps = memoize((args: TableFactoryArguments<TQuery> | undefined) => {
    const props: TableProps<TRecord, TQuery> = {
      fields: definition.fields as never,
      namespace: args?.namespace ?? definition.key,
      searchParameters: args?.searchParameters ?? {},
      schema: schemaFor('query') as ValidationSchema<TQuery> | undefined,
    }
    if (args?.query) props.query = args.query
    if (args?.pagination !== undefined) props.pagination = args.pagination
    if (operations.list) {
      props.load = (context) => operations.list!(context) as MaybePromise<CollectionResult<TRecord>>
    }
    if (definition.table?.fields) props.fields = pickFields(definition.fields, definition.table.fields) as never
    return props
  })

  const detailProps = memoize((args: DetailFactoryArguments<TIdentity>) => {
    const props: DetailProps<TRecord> = {
      fields: (definition.detail?.fields ? pickFields(definition.fields, definition.detail.fields) : definition.fields) as never,
      id: args.id,
      namespace: definition.key,
      searchParameters: args.searchParameters ?? {},
    }
    if (operations.detail) {
      props.load = (context) => operations.detail!(context as RecordLoadContext<TIdentity>) as never
    }
    return props
  })

  function rowActions(record: TRecord, onDelete?: (record: object) => void): RowAction[] {
    const { access } = useResourceRuntime().adapters
    const id = identity(record)
    const allowed = (operation: 'detail' | 'update' | 'delete') => {
      const action = actions[operation]
      const accessRecord = record as Record<string, unknown>
      return Boolean(action && (action.permission === null || access.allows({ operation, permission: action.permission, record: accessRecord })) && (!action.visible || action.visible({ record: accessRecord, access })))
    }
    const result: RowAction[] = []
    const detail = actions.detail
    if (detail?.to && allowed('detail')) result.push({ key: 'detail', label: 'Detail', to: typeof detail.to === 'function' ? detail.to(id) : detail.to })
    const update = actions.update
    if (update?.to && allowed('update')) result.push({ key: 'update', label: 'Ubah', to: typeof update.to === 'function' ? update.to(id) : update.to })
    if (actions.delete && onDelete && allowed('delete')) result.push({ key: 'delete', label: 'Hapus', onSelect: () => onDelete(record) })
    return result
  }

  function tableSurface(args?: TableSurfaceArguments<TQuery>): TableSurface<TRecord, TQuery> {
    const { onDelete, ...data } = args ?? {}
    const hasRowControls = Boolean(actions.detail?.to || actions.update?.to || (actions.delete && onDelete))
    return {
      table: tableProps(data as TableFactoryArguments<TQuery>),
      rowControls: hasRowControls
        ? (record: TRecord) => rowActions(record, onDelete)
        : undefined,
    }
  }

  function detailSurface(args: DetailSurfaceArguments<TIdentity>): DetailSurface<TRecord> {
    return {
      detail: detailProps(args),
    }
  }

  const form = memoize((args: { id?: TIdentity; initialData?: Partial<TCreate>; searchParameters?: Record<string, unknown> } | undefined) => {
    const fields = (definition.form?.fields ? pickFields(definition.fields, definition.form.fields) : definition.fields) as never
    const searchParameters = args?.searchParameters ?? {}
    const initialData = (args?.initialData ?? definition.form?.initialData) as Partial<TCreate> | undefined

    if (args?.id === undefined) {
      const props: FormProps<TCreate, TRecord> = {
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
    const props: FormProps<TUpdate, TRecord> = {
      fields,
      searchParameters,
      namespace: `${definition.key}.update.${identityToken(id)}`,
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

  async function invalidate(args?: { id?: TIdentity }): Promise<void> {
    const { queryClient } = useResourceRuntime()
    await invalidateResourceData(queryClient, { resource: definition.key, id: args?.id })
  }

  async function remove(id: TIdentity): Promise<unknown> {
    if (!operations.delete) throw new Error(`[is-vue-framework] Resource "${definition.key}" has no delete behavior.`)
    const result = await operations.delete(id)
    await invalidate({ id })
    return result
  }

  const detailAction = actions.detail

  const resource: ResourceBase<TRecord, TQuery, TCreate, TUpdate, TIdentity, ResourceOperationKeys<TOperations>>
    & ListCapableResource<TRecord, TQuery>
    & DetailCapableResource<TRecord, TIdentity>
    & { form: CreateForm<TCreate, TRecord> & UpdateForm<TUpdate, TRecord, TIdentity>; remove: (id: TIdentity) => Promise<unknown> } = {
    key: definition.key,
    fields: definition.fields,
    actions,
    identity,
    ...(detailAction?.to ? { rowLink: (record: TRecord) => {
      const to = detailAction.to!
      return typeof to === 'function' ? to(identity(record)) : to
    } } : {}),
    table: tableSurface,
    detail: detailSurface,
    form: form as CreateForm<TCreate, TRecord> & UpdateForm<TUpdate, TRecord, TIdentity>,
    remove,
    invalidate,
  }
  return resource as typeof resource & Pick<Resource<TRecord, TQuery, TCreate, TUpdate, TIdentity, TOperations>, '__formCapabilities'>
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
): FieldCatalog<TRecord, TDraft> {
  const picked: FieldCatalog<TRecord, TDraft> = {}
  for (const key of keys) {
    const field = catalog[key]
    if (!field) throw new Error(`[is-vue-framework] Unknown field "${key}".`)
    picked[key] = field
  }
  return picked
}
