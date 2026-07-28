/*
 * Compile-only proof for Plan 003.
 *
 * Run:
 *   pnpm exec tsc --strict --noEmit --skipLibCheck --lib ES2022,DOM \
 *     plans/proofs/003-capability-inference.type-test.ts
 *
 * This proves that one capabilities map can:
 * - retain literal standard and custom keys;
 * - enforce the five standard handler signatures;
 * - infer record/query/create/update/identity types from wrapped handlers;
 * - project a precisely typed standard-handler view without `any` or casts;
 * - expose resource surfaces only for standard keys that actually exist.
 */

type MaybePromise<T> = T | Promise<T>
type Identity = string | number | Record<string, string | number>
type CollectionContext<TQuery extends object> = {
  query: TQuery
  searchParameters: Record<string, unknown>
}
type RecordContext<TIdentity extends Identity> = {
  id: TIdentity
  searchParameters: Record<string, unknown>
}
type CollectionResult<TRecord extends object> = { data: TRecord[] }

type AnyHandler = (...arguments_: never[]) => unknown

type Capability<THandler extends AnyHandler = AnyHandler> = {
  handler: THandler
  permission: string | null
  to?: { name: string }
  visible?: () => boolean
}

type StandardHandlers<
  TRecord extends object,
  TQuery extends object,
  TCreate extends object,
  TUpdate extends object,
  TIdentity extends Identity,
> = {
  list: (context: CollectionContext<TQuery>) => MaybePromise<CollectionResult<TRecord>>
  detail: (context: RecordContext<TIdentity>) => MaybePromise<TRecord | undefined>
  create: (input: TCreate) => MaybePromise<TRecord>
  update: (id: TIdentity, input: TUpdate) => MaybePromise<TRecord>
  delete: (id: TIdentity) => MaybePromise<unknown>
}

type StandardCapabilities<
  TRecord extends object,
  TQuery extends object,
  TCreate extends object,
  TUpdate extends object,
  TIdentity extends Identity,
> = Partial<{
  [TKey in keyof StandardHandlers<TRecord, TQuery, TCreate, TUpdate, TIdentity>]:
    Capability<StandardHandlers<TRecord, TQuery, TCreate, TUpdate, TIdentity>[TKey]>
}> & Record<string, Capability>

type HandlerAt<TCapabilities, TKey extends PropertyKey> =
  TCapabilities extends Record<TKey, Capability<infer THandler>> ? THandler : never

type AwaitedReturn<THandler> =
  THandler extends (...arguments_: never[]) => infer TResult ? Awaited<TResult> : never

type ArgumentAt<THandler, TIndex extends number> =
  THandler extends (...arguments_: infer TArguments) => unknown ? TArguments[TIndex] : never

type RecordFromCapabilities<TCapabilities> =
  AwaitedReturn<HandlerAt<TCapabilities, 'list'>> extends CollectionResult<infer TRecord>
    ? TRecord
    : Exclude<AwaitedReturn<HandlerAt<TCapabilities, 'detail'>>, undefined> extends infer TRecord
      ? TRecord extends object
        ? TRecord
        : AwaitedReturn<HandlerAt<TCapabilities, 'create'>> extends infer TCreateRecord
          ? TCreateRecord extends object ? TCreateRecord : never
          : never
      : never

type QueryFromCapabilities<TCapabilities> =
  ArgumentAt<HandlerAt<TCapabilities, 'list'>, 0> extends CollectionContext<infer TQuery>
    ? TQuery
    : Record<string, never>

type CreateFromCapabilities<TCapabilities> =
  ArgumentAt<HandlerAt<TCapabilities, 'create'>, 0> extends infer TCreate
    ? TCreate extends object ? TCreate : Record<string, never>
    : Record<string, never>

type UpdateFromCapabilities<TCapabilities> =
  ArgumentAt<HandlerAt<TCapabilities, 'update'>, 1> extends infer TUpdate
    ? TUpdate extends object ? TUpdate : Record<string, never>
    : Record<string, never>

type IdentityFromCapabilities<TCapabilities> =
  ArgumentAt<HandlerAt<TCapabilities, 'update'>, 0> extends infer TIdentity
    ? TIdentity extends Identity
      ? TIdentity
      : ArgumentAt<HandlerAt<TCapabilities, 'delete'>, 0> extends infer TDeleteIdentity
        ? TDeleteIdentity extends Identity ? TDeleteIdentity : string
        : string
    : string

type StandardKeys<TCapabilities> =
  Extract<keyof TCapabilities, keyof StandardHandlers<object, object, object, object, Identity>>

type ResourceSurface<TCapabilities> =
  { capabilities: TCapabilities }
  & ('list' extends StandardKeys<TCapabilities> ? { table(): void } : {})
  & ('detail' extends StandardKeys<TCapabilities> ? { detail(): void } : {})
  & ('create' extends StandardKeys<TCapabilities> ? { createForm(): void } : {})
  & ('update' extends StandardKeys<TCapabilities> ? { updateForm(): void } : {})
  & ('delete' extends StandardKeys<TCapabilities> ? { delete(id: IdentityFromCapabilities<TCapabilities>): void } : {})

/*
 * The implementation consumes this view. Because TCapabilities is constrained
 * by StandardCapabilities, every standard property has its exact signature.
 * Custom keys remain available on the original literal map.
 */
function standardHandlers<
  TRecord extends object,
  TQuery extends object,
  TCreate extends object,
  TUpdate extends object,
  TIdentity extends Identity,
  const TCapabilities extends StandardCapabilities<TRecord, TQuery, TCreate, TUpdate, TIdentity>,
>(capabilities: TCapabilities) {
  return {
    list: capabilities.list?.handler,
    detail: capabilities.detail?.handler,
    create: capabilities.create?.handler,
    update: capabilities.update?.handler,
    delete: capabilities.delete?.handler,
  }
}

function defineResource<const TCapabilities extends Record<string, Capability>>(
  definition: {
    capabilities: TCapabilities & StandardCapabilities<
      RecordFromCapabilities<TCapabilities>,
      QueryFromCapabilities<TCapabilities>,
      CreateFromCapabilities<TCapabilities>,
      UpdateFromCapabilities<TCapabilities>,
      IdentityFromCapabilities<TCapabilities>
    >
  },
): ResourceSurface<TCapabilities> {
  /*
   * A real implementation calls a generic implementation helper whose type
   * parameters are the five extracted aliases. This proof call exercises the
   * same standard-capability constraint and requires no cast.
   */
  standardHandlers<
    RecordFromCapabilities<TCapabilities>,
    QueryFromCapabilities<TCapabilities>,
    CreateFromCapabilities<TCapabilities>,
    UpdateFromCapabilities<TCapabilities>,
    IdentityFromCapabilities<TCapabilities>,
    TCapabilities
  >(definition.capabilities)

  return { capabilities: definition.capabilities } as ResourceSurface<TCapabilities>
}

type Role = { id: string; name: string }
type RoleQuery = { page?: number }
type RoleCreate = { name: string }
type RoleUpdate = { name?: string }

const roleHandlers = {
  list: async (_context: CollectionContext<RoleQuery>): Promise<CollectionResult<Role>> => ({
    data: [{ id: '1', name: 'Admin' }],
  }),
  detail: async ({ id: _id }: RecordContext<string>): Promise<Role | undefined> => ({
    id: '1',
    name: 'Admin',
  }),
  create: async (input: RoleCreate): Promise<Role> => ({ id: '2', ...input }),
  update: async (id: string, input: RoleUpdate): Promise<Role> => ({
    id,
    name: input.name ?? 'Admin',
  }),
  delete: async (_id: string): Promise<void> => undefined,
  verify: async (_id: string, _decision: 'approved' | 'rejected'): Promise<void> => undefined,
}

const roles = defineResource({
  capabilities: {
    list: { handler: roleHandlers.list, permission: 'roles.list', to: { name: 'roles' } },
    detail: { handler: roleHandlers.detail, permission: 'roles.detail', to: { name: 'role-detail' } },
    create: { handler: roleHandlers.create, permission: 'roles.create', to: { name: 'role-create' } },
    update: { handler: roleHandlers.update, permission: 'roles.update', to: { name: 'role-update' } },
    delete: { handler: roleHandlers.delete, permission: 'roles.delete' },
    verify: { handler: roleHandlers.verify, permission: 'roles.verify' },
  },
})

roles.table()
roles.detail()
roles.createForm()
roles.updateForm()
roles.delete('1')
roles.capabilities.verify.handler('1', 'approved')
// @ts-expect-error exact custom handler input is preserved.
roles.capabilities.verify.handler('1', 'unknown')
// @ts-expect-error exact create input is preserved.
roles.capabilities.create.handler({})

const readOnly = defineResource({
  capabilities: {
    list: { handler: roleHandlers.list, permission: 'roles.list' },
  },
})

readOnly.table()
// @ts-expect-error no detail capability means no detail surface.
readOnly.detail()
// @ts-expect-error no create capability means no create surface.
readOnly.createForm()
// @ts-expect-error no delete capability means no delete surface.
readOnly.delete('1')

const invalid = defineResource({
  capabilities: {
    list: {
      // @ts-expect-error list must return a collection result, not one record.
      handler: async (_context: CollectionContext<RoleQuery>): Promise<Role> => ({ id: '1', name: 'Admin' }),
      permission: 'roles.list',
    },
  },
})

void invalid
