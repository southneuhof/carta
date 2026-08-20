import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { incidentStatementDocumentConfigsActions } from './incident-statement-document-configs.actions'
import { incidentStatementDocumentConfigsSchema } from './incident-statement-document-configs.schema'

const activeOptions = [
  { id: true, name: 'Aktif' },
  { id: false, name: 'Tidak Aktif' },
] as const

const fields = defineFields(incidentStatementDocumentConfigsSchema, {
  name: { label: 'Nama', form: { renderer: 'text', props: { required: true } } },
  description: { label: 'Deskripsi', display: { renderer: 'html' }, form: { renderer: 'rich-text' } },
  fileAttachment: {
    label: 'Template Formulir',
    display: { renderer: 'file' },
    form: { renderer: 'file', props: { required: true, limit: 1 } },
    read: (record) => record.fileAttachment,
    write: (draft, value) => {
      const file = value as { path?: unknown }
      draft.fileAttachment = typeof file?.path === 'string' ? file.path : value
    },
  },
  active: { label: 'Status', form: { renderer: 'radio', source: activeOptions } },
})

export const incidentStatementDocumentConfigs = defineResource(incidentStatementDocumentConfigsSchema, {
  key: 'incident-statement-document-configs',
  actions: {
    list: {
      run: incidentStatementDocumentConfigsActions.list,
      fields: [fields.name],
      permission: 'view-incident-statement-document-configs',
      route: { name: 'master-data-incident-statement-document-configs' },
    },
    detail: {
      run: incidentStatementDocumentConfigsActions.detail,
      fields: [fields.name, fields.description, fields.fileAttachment, fields.active],
      permission: 'view-incident-statement-document-configs',
      route: { name: 'master-data-incident-statement-document-configs-detail', params: (id) => ({ incidentStatementDocumentConfigId: String(id) }) },
    },
    create: {
      run: incidentStatementDocumentConfigsActions.create,
      fields: [fields.name, fields.description, fields.fileAttachment, fields.active],
      permission: 'create-incident-statement-document-configs',
      route: { name: 'master-data-incident-statement-document-configs-create' },
      initialData: { active: true },
    },
    update: {
      run: incidentStatementDocumentConfigsActions.update,
      fields: [fields.name, fields.description, fields.fileAttachment, fields.active],
      permission: 'update-incident-statement-document-configs',
      route: { name: 'master-data-incident-statement-document-configs-edit', params: (id) => ({ incidentStatementDocumentConfigId: String(id) }) },
    },
    delete: { run: incidentStatementDocumentConfigsActions.delete, permission: 'delete-incident-statement-document-configs' },
  },
})

export type { IncidentStatementDocumentConfig, IncidentStatementDocumentConfigCreate, IncidentStatementDocumentConfigUpdate } from './incident-statement-document-configs.schema'
