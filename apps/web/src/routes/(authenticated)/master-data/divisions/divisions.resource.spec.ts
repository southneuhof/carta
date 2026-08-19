import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { appFieldDefaults } from '@/configs/defaults'
import {
  createFrameworkQueryClient,
  registerResourceRuntime,
  resetResourceRuntimeForTests,
  resolveFields,
  resolveFrameworkAdapters,
  resolveFrameworkFieldDefaults,
} from '@southneuhof/is-vue-framework'
import { businessCategories } from '../business-categories/business-categories.resource'
import { divisions } from './divisions.resource'

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('divisions resource', () => {
  it('uses the business category resource for its parent lookup', () => {
    expect(fields(divisions.create().fields, 'form').find((field) => field.key === 'businessCategoryId')).toMatchObject({ renderer: 'lookup', source: businessCategories })
  })

  it('renders the related business category name in the table', () => {
    const field = fields(divisions.list().fields, 'table').find((candidate) => candidate.key === 'businessCategory')!
    expect(field.read?.({ businessCategory: { name: 'Business' } } as never, {})).toBe('Business')
    expect(fields(divisions.list().fields, 'table').map((candidate) => candidate.key)).not.toContain('businessCategoryId')
  })

  it('keeps the required parent field in the create form', () => {
    expect(fields(divisions.create().fields, 'form').map((field) => field.key)).toContain('businessCategoryId')
  })

  it('uses the existing image input and file display renderer for the logo', () => {
    expect(fields(divisions.create().fields, 'form').find((field) => field.key === 'imgThumbnail')).toMatchObject({ renderer: 'image' })
    expect(fields(divisions.detail({ id: '1' }).fields, 'detail').find((field) => field.key === 'imgThumbnail')).toMatchObject({ renderer: 'file' })
  })
})
