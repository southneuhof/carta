import { defineFields, defineResource } from '../../index'

type Role = { id: string; name: string }
const fields = defineFields<Role>()({ name: { label: 'Name' } })
const roles = defineResource({
  key: 'roles',
  fields,
  capabilities: {
    list: { handler: async () => ({ data: [{ id: '1', name: 'Admin' }] }), permission: 'roles.list' },
    detail: { handler: async ({ id }) => ({ id: String(id), name: 'Admin' }), permission: 'roles.detail', to: { name: 'roles-detail', params: (id) => ({ id }) } },
  },
})
void roles.table()
void roles.detail({ id: '1' })
// @ts-expect-error no create capability means no form surface.
roles.form()
