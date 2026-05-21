import { describe, expect, it } from 'vitest'
import contentDefault from '../sections/content-default'
import dataList from '../sections/data-list'
import heroBanner from '../sections/hero-banner'
import sectionSchemas from '../index'
import { dataListFieldSets } from '../helpers/data-list-field-sets'
import { containerColorOptions } from '../helpers/container-color-options'
import { defineSectionSchema } from '../defineSectionSchema'

describe('shared section schema', () => {
  it('exports valid schemas with code and data', () => {
    for (const schema of Object.values(sectionSchemas)) {
      expect(schema.code).toBeTruthy()
      expect(schema.data).toBeTruthy()
    }
  })

  it('defines content-default meta field names', () => {
    expect(contentDefault.meta?.fields).toEqual([
      'section_background_color',
      'section_ornament_media',
      'section_ornament_offset',
      'layout_direction',
      'content_order',
      'width_preset',
      'content_align',
      'url_justify',
      'button_type',
      'container_variant',
      'container_color',
      'container_radius',
      'container_padding',
      'column_ratio',
      'content_gap',
      'media_aspect_ratio',
      'media_radius',
      'remove_outline_on_images',
      'text_color_scheme',
      'title_size',
      'ornament_enabled',
      'ornament_media',
      'ornament_scope',
      'ornament_layer',
      'ornament_offset',
      'ornament_size',
      'ornament_position',
      'remove_margin',
    ])
  })

  it('defines data-list meta field names', () => {
    expect(dataList.meta?.fields?.[0]).toBe('section_background_color')
    expect(dataList.meta?.fields).toContain('closed_on_initial')
  })

  it('does not apply common meta fields to nested schemas', () => {
    expect(dataList.data.childSections.schema?.meta?.fields).toEqual([])
  })

  it('keeps meta field names available through readSectionSchemas registry', () => {
    expect(sectionSchemas['content-default']?.meta?.fields).toContain('width_preset')
    expect(sectionSchemas['data-list']?.meta?.fields).toContain('closed_on_initial')
  })

  it('keeps default values in schema meta', () => {
    expect(contentDefault.meta?.defaultValues?.section_background_color).toBe('')
    expect(contentDefault.meta?.defaultValues?.section_ornament_media).toBe('')
    expect(contentDefault.meta?.defaultValues?.section_ornament_offset).toBe('md')
    expect(contentDefault.meta?.defaultValues?.width_preset).toBe('xl')
    expect(contentDefault.meta?.defaultValues?.container_variant).toBe('plain')
    expect(contentDefault.meta?.defaultValues?.layout_direction).toBe('horizontal')
    expect(contentDefault.meta?.defaultValues?.media_radius).toBe('lg')
    expect(contentDefault.meta?.defaultValues?.ornament_enabled).toBe(false)
    expect(contentDefault.meta?.defaultValues?.ornament_offset).toBe('md')
    expect(dataList.meta?.defaultValues?.type).toBe('list')
  })

  it('registers common meta editor input config', () => {
    expect(contentDefault.meta?.editor?.inputConfig?.section_background_color?.type).toBe('text')
    expect(contentDefault.meta?.editor?.inputConfig?.section_ornament_media?.type).toBe('image')
    expect(contentDefault.meta?.editor?.inputConfig?.section_ornament_offset?.type).toBe('select')
  })

  it('uses shared container color options in content-default', () => {
    const options = contentDefault.meta?.editor?.inputConfig?.container_color?.props?.data || []
    const optionIds = options.map((option: any) => option.id)
    expect(optionIds).toEqual(containerColorOptions.map((option) => option.id))
  })

  it('keeps slot fields in schema', () => {
    expect(contentDefault.data.content.fields).toContain('title')
    expect(heroBanner.data.banner.fields).toContain('media')
  })

  it('reuses field-set contract across hero-banner and nested data-list gallery', () => {
    expect(dataList.data.childSections.schema?.data.gallery.editor?.resolveConfig).toBeTypeOf('function')
    expect(dataList.data.childSections.schema?.data.gallery.fieldSets).toEqual(dataListFieldSets)
  })

  it('stores editor config under schema editor nodes', () => {
    expect(contentDefault.meta?.editor?.inputConfig?.width_preset?.type).toBe('select')
    expect(contentDefault.meta?.editor?.inputConfig?.container_variant?.type).toBe('select')
    expect(contentDefault.meta?.editor?.inputConfig?.ornament_enabled?.type).toBe('checkbox')
    expect(contentDefault.meta?.editor?.inputConfig?.ornament_media?.type).toBe('image')
    expect(contentDefault.data.content.editor?.label).toBe('Main Content')
    expect(dataList.data.childSections.schema?.data.gallery.editor?.resolveConfig).toBeTypeOf('function')
  })

  it('defines contextual visibility for content-default meta controls', () => {
    const inputConfig = contentDefault.meta?.editor?.inputConfig

    expect(inputConfig?.container_color?.dependency?.visibility?.validator({ container_variant: 'plain' })).toBe(false)
    expect(inputConfig?.container_color?.dependency?.visibility?.validator({ container_variant: 'panel' })).toBe(true)
    expect(inputConfig?.container_radius?.dependency?.visibility?.validator({ container_variant: 'panel' })).toBe(true)
    expect(inputConfig?.container_padding?.dependency?.visibility?.validator({ container_variant: 'panel' })).toBe(true)
    expect(inputConfig?.text_color_scheme?.dependency?.visibility?.validator({ container_variant: 'panel' })).toBe(true)

    expect(inputConfig?.column_ratio?.dependency?.visibility?.validator({ layout_direction: 'horizontal' })).toBe(true)
    expect(inputConfig?.column_ratio?.dependency?.visibility?.validator({ layout_direction: 'vertical' })).toBe(false)

    expect(inputConfig?.ornament_media?.dependency?.visibility?.validator({ ornament_enabled: true })).toBe(true)
    expect(inputConfig?.ornament_scope?.dependency?.visibility?.validator({ ornament_enabled: false })).toBe(false)
    expect(inputConfig?.ornament_layer?.dependency?.visibility?.validator({ ornament_enabled: true })).toBe(true)
    expect(inputConfig?.ornament_offset?.dependency?.visibility?.validator({ ornament_enabled: true, ornament_scope: 'container', ornament_layer: 'behind' })).toBe(true)
    expect(inputConfig?.ornament_offset?.dependency?.visibility?.validator({ ornament_enabled: true, ornament_scope: 'media', ornament_layer: 'behind' })).toBe(false)
    expect(inputConfig?.ornament_offset?.dependency?.visibility?.validator({ ornament_enabled: true, ornament_scope: 'container', ornament_layer: 'inside' })).toBe(false)
    expect(inputConfig?.ornament_size?.dependency?.visibility?.validator({ ornament_enabled: true, ornament_scope: 'container', ornament_layer: 'inside' })).toBe(true)
    expect(inputConfig?.ornament_size?.dependency?.visibility?.validator({ ornament_enabled: true, ornament_scope: 'media', ornament_layer: 'behind' })).toBe(true)
    expect(inputConfig?.ornament_size?.dependency?.visibility?.validator({ ornament_enabled: true, ornament_scope: 'container', ornament_layer: 'behind' })).toBe(false)
    expect(inputConfig?.ornament_position?.dependency?.visibility?.validator({ ornament_enabled: true, ornament_layer: 'inside' })).toBe(true)
    expect(inputConfig?.ornament_position?.dependency?.visibility?.validator({ ornament_enabled: true, ornament_layer: 'behind' })).toBe(false)
  })

  it('narrows ornament scope options by container variant', () => {
    const generator = contentDefault.meta?.editor?.inputConfig?.ornament_scope?.dependency?.props?.generator

    expect(generator?.({ container_variant: 'plain' }).data.map((option: any) => option.id)).toEqual(['section', 'media'])
    expect(generator?.({ container_variant: 'panel' }).data.map((option: any) => option.id)).toEqual(['container', 'media'])
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
    const typedMetaField: ContentDefaultMetaField = 'container_variant'
    expect(typedMetaField).toBe('container_variant')

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

  it('throws when a schema redeclares common meta fields', () => {
    expect(() => defineSectionSchema({
      code: 'invalid-common-meta-duplicate',
      meta: {
        fields: ['section_background_color'] as const,
      },
      data: {},
    })).toThrow(/Duplicate common meta field/)
  })

})
