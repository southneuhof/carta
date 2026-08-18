import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { itpActions } from './itp.actions'
import { itpSchema, itpTypeOptions } from './itp.schema'

function writeImagePath(draft: Record<string, unknown>, value: unknown) {
  const file = value && typeof value === 'object' ? value as { path?: unknown } : undefined
  draft.imgDocumentation = typeof file?.path === 'string' ? file.path : typeof value === 'string' ? value : undefined
}

const fields = defineFields(itpSchema, {
  type: { label: 'Type', form: { renderer: 'radio', source: itpTypeOptions, props: { required: true } } },
  criteria: { label: 'Criteria', form: { renderer: 'text' } },
  procedureCode: { label: 'Procedure Code', form: { renderer: 'text' } },
  specification: { label: 'Specification', form: { renderer: 'textarea' } },
  method: { label: 'Method', form: { renderer: 'textarea' } },
  frequency: { label: 'Frequency', form: { renderer: 'number', props: { required: true, min: 1, step: 1 } } },
  inspectors: { label: 'Inspectors', form: { span: 12 } },
  imgDocumentation: { label: 'Documentation Image', form: { renderer: 'image', props: { limit: 1 } }, write: writeImagePath },
  description: { label: 'Description', form: { renderer: 'textarea' } },
})

const formFields = [
  fields.type,
  fields.criteria,
  fields.procedureCode,
  fields.specification,
  fields.method,
  fields.frequency,
  fields.inspectors,
  fields.imgDocumentation,
  fields.description,
] as const

export const itp = defineResource(itpSchema, {
  key: 'inspection-test-plans',
  actions: {
    detail: { run: itpActions.detail, fields: formFields, permission: null },
    create: { run: itpActions.create, fields: formFields, permission: null },
    update: { run: itpActions.update, fields: formFields, permission: null },
    delete: { run: itpActions.delete, permission: null },
    loadTemplate: { run: itpActions.loadTemplate },
    loadTree: { run: itpActions.loadTree },
  },
})

export const itpFormFields = formFields
