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
import type { ViewControl } from '../components/views/controls'
import { standardControls, type ControlsArguments } from './controls'
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
  list?: (context: CollectionLoadContext<TQuery>) => MaybePromise<unknown>
  detail?: (context: RecordLoadContext<TIdentity>) => MaybePromise<unknown>
  create?: (input: TCreate) => MaybePromise<unknown>
  update?: (id: TIdentity, input: TUpdate) => MaybePromise<unknown>
  delete?: (id: TIdentity) => MaybePromise<unknown>
  /** Declared so `TRecord` stays meaningful for consumers of this interface. */
  readonly __record?: TRecord
}

export interface ResourceSurfaceDefinition {
  /** Field order for this surface; defaults to catalog declaration order. */
  fields?: readonly string[]
}

export type ResourceActionKey = 'list' | 'detail' | 'create' | 'update' | 'delete'
export type ResourceActionTarget<TIdentity extends RecordIdentity = RecordIdentityValue> =
  | { name: string }
  | { name: string; params: (id: TIdentity) => Record<string, string | number> }

export interface ResourceActionDefinition<TIdentity extends RecordIdentity = RecordIdentityValue> {
  permission: string | null
  to?: ResourceActionTarget<TIdentity>
  visible?: (context: { record?: Record<string, unknown>; access: AccessAdapter }) => boolean
}

export type ResourceActionsDefinition<TIdentity extends RecordIdentity = RecordIdentityValue> = Partial<
  Record<ResourceActionKey, ResourceActionDefinition<TIdentity>>
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
> {
  key: string
  fields: FieldCatalog<TRecord, TCreate>
  /** `['userId', 'roleId']` or `(record) => identity`; omitted means `record.id`. */
  identity?: TDeclaration
  operations?: ResourceOperations<TRecord, TQuery, TCreate, TUpdate, ResolvedIdentity<TRecord, TDeclaration>>
  table?: ResourceSurfaceDefinition
  detail?: ResourceSurfaceDefinition
  form?: ResourceSurfaceDefinition & { initialData?: Partial<TCreate> }
  schemas?: ResourceSchemas<TRecord, TQuery, TCreate, TUpdate>
  actions?: ResourceActionsDefinition<ResolvedIdentity<TRecord, TDeclaration>>
}

export interface ResourceCapabilities {
  list: boolean
  detail: boolean
  create: boolean
  update: boolean
  delete: boolean
}

/** Arguments for the collection surface: table data plus its control block. */
export interface TableSurfaceArguments<TQuery extends object = Record<string, unknown>>
  extends TableFactoryArguments<TQuery> {
  controls?: ControlsArguments
}

/** Arguments for the record surface. Delete appears only with a handler. */
export interface DetailSurfaceArguments<TIdentity extends RecordIdentity = RecordIdentityValue>
  extends DetailFactoryArguments<TIdentity> {
  onDelete?: () => void
  /** The loaded record, when the access policy is record-dependent. */
  record?: Record<string, unknown>
  controls?: ControlsArguments
}

/** Shell-ready collection bundle: `v-bind` it onto `ListView`. */
export interface TableSurface<TRecord extends object, TQuery extends object> {
  table: TableProps<TRecord, TQuery>
  controls: ViewControl[]
}

/** Shell-ready record bundle: `v-bind` it onto `DetailView`. */
export interface DetailSurface<TRecord extends object> {
  detail: DetailProps<TRecord>
  controls: ViewControl[]
}

export interface Resource<
  TRecord extends object = Record<string, unknown>,
  TQuery extends object = Record<string, unknown>,
  TCreate extends object = Record<string, unknown>,
  TUpdate extends object = TCreate,
  TIdentity extends RecordIdentity = RecordIdentityValue,
> {
  key: string
  fields: FieldCatalog<TRecord, TCreate>
  actions: Partial<Record<ResourceActionKey, ResourceAction<TIdentity>>>
  capabilities: ResourceCapabilities
  /** Record → identity, the direction the framework needs at runtime. */
  identity: (record: TRecord) => TIdentity
  /**
   * Record → detail href, composed from the identity extractor and
   * `actions.detail`. Absent when the resource has no detail route, so a list
   * screen never hand-writes an identity into a URL.
   */
  rowLink?: (record: TRecord) => RouteLocationRaw
  table: (args?: TableSurfaceArguments<TQuery>) => TableSurface<TRecord, TQuery>
  detail: (args: DetailSurfaceArguments<TIdentity>) => DetailSurface<TRecord>
  form: {
    (): FormProps<TCreate>
    (args: { initialData?: Partial<TCreate>; searchParameters?: Record<string, unknown> }): FormProps<TCreate>
    (args: { id: TIdentity; initialData?: Partial<TUpdate>; searchParameters?: Record<string, unknown> }): FormProps<TUpdate>
  }
  remove: (id: TIdentity) => Promise<unknown>
  invalidate: (args?: { id?: TIdentity }) => Promise<void>
}

const operationNames = ['list', 'detail', 'create', 'update', 'delete'] as const

function normalizeActions<TIdentity extends RecordIdentity>(
  resourceKey: string,
  declarations: ResourceActionsDefinition<TIdentity> | undefined,
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
>(
  definition: ResourceDefinition<TRecord, TQuery, TCreate, TUpdate, TDeclaration>,
): Resource<TRecord, TQuery, TCreate, TUpdate, ResolvedIdentity<TRecord, TDeclaration>> {
  type TIdentity = ResolvedIdentity<TRecord, TDeclaration>
  const operations = definition.operations ?? {}
  const actions = normalizeActions(definition.key, definition.actions as ResourceActionsDefinition<TIdentity> | undefined)

  const capabilities: ResourceCapabilities = {
    list: Boolean(operations.list),
    detail: Boolean(operations.detail),
    create: Boolean(operations.create),
    update: Boolean(operations.update),
    delete: Boolean(operations.delete),
  }

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

  /**
   * The control projection reads only what the resource already declares, plus
   * the runtime access adapter. Controls are rebuilt per call — the props they
   * ride with stay memoized, so table state does not reset — because a bundle
   * closes over route-supplied handlers that must not outlive their component.
   */
  function controlContext() {
    const { adapters } = useResourceRuntime()
    return { key: definition.key, capabilities, actions, access: adapters.access }
  }

  function tableSurface(args?: TableSurfaceArguments<TQuery>): TableSurface<TRecord, TQuery> {
    const { controls, ...data } = args ?? {}
    return {
      table: tableProps(data as TableFactoryArguments<TQuery>),
      controls: standardControls({ ...controlContext(), surface: 'list', controls }),
    }
  }

  function detailSurface(args: DetailSurfaceArguments<TIdentity>): DetailSurface<TRecord> {
    const { controls, onDelete, record, ...data } = args
    return {
      detail: detailProps(data as DetailFactoryArguments<TIdentity>),
      controls: standardControls({
        ...controlContext(),
        surface: 'detail',
        id: args.id,
        record,
        onDelete,
        controls,
      }),
    }
  }

  const form = memoize((args: { id?: TIdentity; initialData?: Partial<TCreate>; searchParameters?: Record<string, unknown> } | undefined) => {
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

  return {
    key: definition.key,
    fields: definition.fields,
    actions,
    capabilities,
    identity,
    ...(detailAction?.to ? { rowLink: (record: TRecord) => {
      const to = detailAction.to!
      return typeof to === 'function' ? to(identity(record)) : to
    } } : {}),
    table: tableSurface,
    detail: detailSurface,
    form: form as Resource<TRecord, TQuery, TCreate, TUpdate, TIdentity>['form'],
    remove,
    invalidate,
  }
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
