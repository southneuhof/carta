import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import { permitAttachmentsSchema } from './permit-attachment.schema'

const api = createHonoResourceActions(rpc['permit-attachment'], dataAdapter)

const activeOptions = [
  { id: true, name: 'Aktif' },
  { id: false, name: 'Tidak Aktif' },
] as const

const fields = defineFields(permitAttachmentsSchema, {
  name: { label: 'Nama', form: { renderer: 'text', props: { required: true } } },
  description: { label: 'Deskripsi', form: { renderer: 'textarea' } },
  active: { label: 'Status', form: { renderer: 'radio', source: activeOptions } },
})

export const permitAttachments = defineResource(permitAttachmentsSchema, {
  key: 'permit-attachment',
  actions: {
    list: {
      run: api.list,
      fields: [fields.name, fields.description, fields.active],
      permission: 'view-permit-attachment',
      route: { name: 'master-data-permit-attachment' },
    },
    detail: {
      run: api.detail,
      fields: [fields.name, fields.description, fields.active],
      permission: 'view-permit-attachment',
      route: { name: 'master-data-permit-attachment-detail', params: (id) => ({ permitAttachmentId: String(id) }) },
    },
    create: {
      run: api.create,
      fields: [fields.name, fields.description, fields.active],
      permission: 'create-permit-attachment',
      route: { name: 'master-data-permit-attachment-create' },
      initialData: { active: true },
    },
    update: {
      run: api.update,
      fields: [fields.name, fields.description, fields.active],
      permission: 'update-permit-attachment',
      route: { name: 'master-data-permit-attachment-edit', params: (id) => ({ permitAttachmentId: String(id) }) },
    },
    delete: { run: api.delete, permission: 'delete-permit-attachment' },
  },
})

export type { PermitAttachment, PermitAttachmentCreate, PermitAttachmentUpdate } from './permit-attachment.schema'
