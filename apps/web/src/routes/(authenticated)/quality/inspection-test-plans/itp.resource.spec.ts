import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { appFieldDefaults } from '@/configs/defaults'
import { createFrameworkQueryClient, registerResourceRuntime, resetResourceRuntimeForTests, resolveFields, resolveFrameworkAdapters, resolveFrameworkFieldDefaults } from '@southneuhof/is-vue-framework'
import { itp } from './itp.resource'
import { itpTypeOptions } from './itp.schema'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown) {
  return resolveFields({ fields: value as never, surface: 'form', defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('ITP resource', () => {
  it('keeps the approved create and update field order', () => {
    const expected = ['type', 'criteria', 'procedureCode', 'specification', 'method', 'frequency', 'inspectors', 'imgDocumentation', 'description']
    expect(fields(itp.create().fields).map((field) => field.key)).toEqual(expected)
    expect(fields(itp.update({ id: 'itp-1' }).fields).map((field) => field.key)).toEqual(expected)
  })

  it('uses the standard field renderers and type options', () => {
    const formFields = fields(itp.create().fields)
    expect(formFields.find((field) => field.key === 'type')).toMatchObject({ renderer: 'radio', source: itpTypeOptions, props: { required: true } })
    expect(formFields.find((field) => field.key === 'frequency')).toMatchObject({ renderer: 'number', props: { required: true, min: 1, step: 1 } })
    expect(formFields.find((field) => field.key === 'criteria')).toMatchObject({ renderer: 'text' })
    expect(formFields.find((field) => field.key === 'specification')).toMatchObject({ renderer: 'textarea' })
    expect(formFields.find((field) => field.key === 'method')).toMatchObject({ renderer: 'textarea' })
    expect(formFields.find((field) => field.key === 'imgDocumentation')).toMatchObject({ renderer: 'image', props: { limit: 1 } })
    expect(formFields.find((field) => field.key === 'description')).toMatchObject({ renderer: 'textarea' })
    expect(itpTypeOptions).toEqual([
      { id: 'material', name: 'Material' },
      { id: 'process', name: 'Process' },
      { id: 'product', name: 'Product' },
    ])
    expect(formFields.map((field) => field.key)).not.toContain('material')
    expect(formFields.map((field) => field.key)).not.toContain('product')
  })

  it('maps the retained image path from the upload model', () => {
    const image = fields(itp.create().fields).find((field) => field.key === 'imgDocumentation')!
    const draft: Record<string, unknown> = {}
    image.write?.(draft, { path: 'uploads/itp/image.jpg' }, {})
    expect(draft.imgDocumentation).toBe('uploads/itp/image.jpg')
    image.write?.(draft, 'uploads/itp/other.jpg', {})
    expect(draft.imgDocumentation).toBe('uploads/itp/other.jpg')
  })
})
