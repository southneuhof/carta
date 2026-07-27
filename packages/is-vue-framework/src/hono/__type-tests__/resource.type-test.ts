import { Hono } from 'hono'
import { hc } from 'hono/client'
import type { InferRequestType, InferResponseType } from 'hono/client'
import { validator } from 'hono/validator'
import { createHonoResourceOperations } from '../resource'
import { defineResource, defineResourceOperations, type ResourceActionsDefinition, type ResourceCreateOf, type ResourceOperations, type ResourceRecordOf } from '../../resources'
import type { RecordIdentity } from '../../contracts'

const full = new Hono()
  .get('/full/list', validator('query', (value) => value as { page?: string; status?: 'active' | 'draft' }), (context) => context.json({ data: [{ id: 'r1', name: 'Admin', status: 'active' as const }], total: 1 }))
  .get('/full/detail/:id', (context) => context.json({ data: { id: context.req.param('id'), name: 'Admin', status: 'active' as const } }))
  .post('/full/create', validator('json', (value) => value as { name: string; status: 'active' | 'draft' }), (context) => context.json({ data: context.req.valid('json') }, 201))
  .patch('/full/update/:id', validator('json', (value) => value as { name: string }), (context) => context.json({ data: { id: context.req.param('id'), ...context.req.valid('json') } }))
  .delete('/full/delete/:id', (context) => context.json({ deleted: context.req.param('id') }))
  .post('/full/custom', (context) => context.json({ ok: true as const }, 200))
const partial = new Hono()
  .get('/partial/list', (context) => context.json({ data: [{ id: 'u1', name: 'User' }] }))
  .get('/partial/detail/:id', (context) => context.json({ data: { id: context.req.param('id'), name: 'User' } }))
  .patch('/partial/update/:id', validator('json', (value) => value as { name: string }), (context) => context.json({ data: { id: context.req.param('id'), ...context.req.valid('json') } }))
const readOnly = new Hono().get('/read/list', (context) => context.json({ data: [{ id: 'n1', title: 'Notice' }] }))

const fullClient = hc<typeof full>('http://example.test')
const partialClient = hc<typeof partial>('http://example.test')
const readClient = hc<typeof readOnly>('http://example.test')

fullClient.full.list.$get({ query: { page: '1', status: 'active' } })
fullClient.full.detail[':id'].$get({ param: { id: 'r1' } })
fullClient.full.create.$post({ json: { name: 'Editor', status: 'draft' } })
fullClient.full.update[':id'].$patch({ param: { id: 'r1' }, json: { name: 'Editor' } })
fullClient.full.delete[':id'].$delete({ param: { id: 'r1' } })
partialClient.partial.update[':id'].$patch({ param: { id: 'u1' }, json: { name: 'Member' } })
readClient.read.list.$get()

const fullOperations = createHonoResourceOperations(fullClient.full)
const partialOperations = createHonoResourceOperations(partialClient.partial)
const readOperations = createHonoResourceOperations(readClient.read)

fullOperations.create({ name: 'Editor', status: 'active' })
partialOperations.update('u1', { name: 'Member' })
// @ts-expect-error partial adapter exposes no create operation
partialOperations.create
// @ts-expect-error read-only adapter exposes no update operation
readOperations.update

const invalidPartialActions: ResourceActionsDefinition<RecordIdentity, Extract<keyof typeof partialOperations, 'list' | 'detail' | 'create' | 'update' | 'delete'>> = {
  // @ts-expect-error no typed create operation means no create action
  create: { permission: null, to: { name: 'partial-create' } },
}
void invalidPartialActions

const partialResource = defineResource({
  key: 'partial',
  fields: { id: { label: 'ID' }, name: { label: 'Name' } },
  operations: partialOperations,
  actions: {
    list: { permission: null, to: { name: 'partial-list' } },
    update: { permission: null, to: { name: 'partial-edit', params: (id) => ({ id }) } },
  },
})
partialResource.table()
partialResource.detail({ id: 'u1' })
partialResource.form({ id: 'u1' })
// @ts-expect-error no create form overload
partialResource.form()
// @ts-expect-error no typed delete operation means no remove surface
partialResource.remove('u1')

const readResource = defineResource({
  key: 'read',
  fields: { id: { label: 'ID' }, title: { label: 'Title' } },
  operations: readOperations,
})
readResource.table()
// @ts-expect-error read-only resource has no detail surface
readResource.detail({ id: 'n1' })
// @ts-expect-error read-only resource has no form surface
readResource.form()

interface Customer extends Record<string, unknown> {
  id: string
  name: string
}
interface CustomerCreate extends Record<string, unknown> {
  name: string
}
const customerOperations = defineResourceOperations<Customer, Record<string, never>, CustomerCreate>()({
  list: async () => ({ data: [{ id: 'c1', name: 'Ada' } satisfies Customer] }),
  create: async (input: CustomerCreate) => ({ id: 'c2', ...input }),
} satisfies ResourceOperations<Customer, Record<string, never>, CustomerCreate>)
type CustomerFromOperations = ResourceRecordOf<typeof customerOperations>
type CustomerCreateFromOperations = ResourceCreateOf<typeof customerOperations>
const customerProof: CustomerFromOperations = { id: 'c1', name: 'Ada' }
const customerCreateProof: CustomerCreateFromOperations = { name: 'Ada' }
const customers = defineResource({
  key: 'customers',
  fields: { id: { label: 'ID' }, name: { label: 'Name' } },
  operations: customerOperations,
})
customers.table()
customers.form({ initialData: { name: 'Ada' } })
// @ts-expect-error manual narrow operations have no detail surface
customers.detail({ id: 'c1' })
void [customerProof, customerCreateProof]

// @ts-expect-error partial route has no create branch
partialClient.partial.create.$post({ json: { name: 'nope' } })
// @ts-expect-error read-only route has no update branch
readClient.read.update[':id'].$patch({ param: { id: 'n1' }, json: {} })
// @ts-expect-error detail requires its param
fullClient.full.detail[':id'].$get()
// @ts-expect-error create body keeps exact status union
fullClient.full.create.$post({ json: { name: 'Editor', status: 'invalid' } })

type FullList = InferResponseType<typeof fullClient.full.list.$get, 200>
type FullCreate = InferRequestType<typeof fullClient.full.create.$post>
const fullUpdateEndpoint = fullClient.full.update[':id'].$patch
type FullUpdate = InferRequestType<typeof fullUpdateEndpoint>
type FullError = InferResponseType<typeof fullClient.full.create.$post, 422>
type FullCustom = InferResponseType<typeof fullClient.full.custom.$post, 200>

const listProof: FullList = { data: [{ id: 'r1', name: 'Admin', status: 'active' }], total: 1 }
const createProof: FullCreate = { json: { name: 'Editor', status: 'draft' } }
const updateProof: FullUpdate = { param: { id: 'r1' }, json: { name: 'Editor' } }
const customProof: FullCustom = { ok: true }
// @ts-expect-error fixture has no 422 create response
const errorProof: FullError = { error: 'bad' }

void [listProof, createProof, updateProof, customProof, errorProof]
