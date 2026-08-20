import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  createFrameworkQueryClient,
  registerResourceRuntime,
  resetResourceRuntimeForTests,
  resolveFields,
  resolveFrameworkAdapters,
  resolveFrameworkFieldDefaults,
  resourceActionForRoute,
} from '@southneuhof/is-vue-framework'
import { appFieldDefaults } from '@/configs/defaults'
import { incidentStatementDocumentConfigs } from './incident-statement-document-configs.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('incident statement document configs resource', () => {
  it('keeps the legacy list and form field contract', () => {
    expect(fields(incidentStatementDocumentConfigs.list().fields, 'table').map((field) => field.key)).toEqual(['name'])
    expect(fields(incidentStatementDocumentConfigs.detail({ id: '1' }).fields, 'detail').map((field) => field.key)).toEqual(['name', 'description', 'fileAttachment', 'active'])
    const formFields = fields(incidentStatementDocumentConfigs.create().fields, 'form')
    expect(formFields.map((field) => field.key)).toEqual(['name', 'description', 'fileAttachment', 'active'])
    expect(formFields.map((field) => field.label)).toEqual(['Nama', 'Deskripsi', 'Template Formulir', 'Status'])
    expect(formFields.map((field) => field.renderer)).toEqual(['text', 'rich-text', 'file', 'radio'])
    expect(formFields.find((field) => field.key === 'fileAttachment')?.props).toMatchObject({ required: true, limit: 1 })
  })

  it('maps standard CRUD to the separate incident permission family', () => {
    expect(resourceActionForRoute('master-data-incident-statement-document-configs')).toMatchObject({
      resourceKey: 'incident-statement-document-configs',
      action: 'list',
      permission: 'view-incident-statement-document-configs',
    })
    expect(resourceActionForRoute('master-data-incident-statement-document-configs-create')).toMatchObject({
      resourceKey: 'incident-statement-document-configs',
      action: 'create',
      permission: 'create-incident-statement-document-configs',
    })
    expect(incidentStatementDocumentConfigs.list().detailRoute?.({ id: 'config-1' } as never)).toEqual({
      name: 'master-data-incident-statement-document-configs-detail',
      params: { incidentStatementDocumentConfigId: 'config-1' },
    })
    expect(incidentStatementDocumentConfigs.delete({ id: 'config-1' })).toHaveProperty('run')
  })
})
