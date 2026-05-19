import { describe, expect, it } from 'vitest'
import contentDefault from '../sections/content-default'
import dataList from '../sections/data-list'
import heroBanner from '../sections/hero-banner'
import sectionSchemas from '../index'
import { dataListFieldSets } from '../helpers/data-list-field-sets'

describe('shared section schema', () => {
  it('exports valid schemas with code and data', () => {
    for (const schema of Object.values(sectionSchemas)) {
      expect(schema.code).toBeTruthy()
      expect(schema.data).toBeTruthy()
    }
  })

  it('defines content-default meta field names', () => {
    expect(contentDefault.meta?.fields).toEqual([
      'remove_margin',
      'remove_outline_on_images',
      'content_align',
      'url_justify',
      'layout_direction',
      'width_preset',
      'content_order',
      'button_type',
    ])
  })

  it('defines data-list meta field names', () => {
    expect(dataList.meta?.fields).toContain('closed_on_initial')
  })

  it('keeps meta field names available through readSectionSchemas registry', () => {
    expect(sectionSchemas['content-default']?.meta?.fields).toContain('width_preset')
    expect(sectionSchemas['data-list']?.meta?.fields).toContain('closed_on_initial')
  })

  it('keeps default values in schema meta', () => {
    expect(contentDefault.meta?.defaultValues?.width_preset).toBe('md')
    expect(dataList.meta?.defaultValues?.type).toBe('list')
  })

  it('keeps slot fields in schema', () => {
    expect(contentDefault.data.content.fields).toContain('title')
    expect(heroBanner.data.banner.fields).toContain('media')
  })

  it('reuses field-set contract across hero-banner and nested data-list gallery', () => {
    expect(heroBanner.data.projectCategory.fieldSets).toEqual(dataListFieldSets)
    expect(dataList.data.childSections.schema?.data.gallery.fieldSets).toEqual(dataListFieldSets)
  })

  it('stores editor config under schema editor nodes', () => {
    expect(contentDefault.meta?.editor?.inputConfig?.width_preset?.type).toBe('select')
    expect(contentDefault.data.content.editor?.label).toBe('Main Content')
    expect(dataList.data.childSections.schema?.data.gallery.editor?.resolveConfig).toBeTypeOf('function')
  })

  it('does not import vue or app-local modules in section schema files', async () => {
    const modules = import.meta.glob('../sections/**/*.ts', { as: 'raw', eager: true }) as Record<string, string>
    for (const source of Object.values(modules)) {
      expect(source).not.toMatch(/from\s+['\"]vue['\"]/)
      expect(source).not.toMatch(/from\s+['\"]@\//)
      expect(source).not.toMatch(/from\s+['\"].*apps\//)
    }
  })

  it('preserves literal typing for meta and slot fields', () => {
    type ContentDefaultMetaField = typeof contentDefault.meta.fields[number]
    const typedMetaField: ContentDefaultMetaField = 'width_preset'
    expect(typedMetaField).toBe('width_preset')

    type ContentDefaultSlotField = NonNullable<typeof contentDefault.data.content.fields>[number]
    const typedSlotField: ContentDefaultSlotField = 'title'
    expect(typedSlotField).toBe('title')

    // @ts-expect-error invalid meta field
    const invalidMetaField: ContentDefaultMetaField = 'not_a_meta_field'
    expect(invalidMetaField).toBe('not_a_meta_field')

    // @ts-expect-error invalid slot field
    const invalidSlotField: ContentDefaultSlotField = 'not_a_field'
    expect(invalidSlotField).toBe('not_a_field')
  })
})
