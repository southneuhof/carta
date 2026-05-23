import { describe, expect, it } from 'vitest'
import contentDefault from '../sections/content-default'
import contentGallery from '../sections/content-gallery'
import dataList from '../sections/data-list'
import heroBanner from '../sections/hero-banner'
import articleHighlights from '../sections/article-highlights'
import productCatalog from '../sections/product-catalog'
import productShowcase from '../sections/product-showcase'
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

  it('defines content-gallery meta field names', () => {
    expect(contentGallery.meta?.fields).toEqual([
      'section_background_color',
      'section_ornament_media',
      'section_ornament_offset',
      'layout_direction',
      'content_order',
      'width_preset',
      'content_align',
      'gallery_header_align',
      'url_justify',
      'button_type',
      'container_variant',
      'container_color',
      'container_radius',
      'container_radius_pattern',
      'container_padding',
      'column_ratio',
      'content_gap',
      'text_color_scheme',
      'title_size',
      'gallery_title_size',
      'gallery_display_mode',
      'gallery_media_type',
      'gallery_columns',
      'gallery_gap',
      'gallery_item_align',
      'gallery_icon_size',
      'gallery_media_radius',
      'gallery_media_aspect_ratio',
      'carousel_loop',
      'carousel_navigation_position',
      'carousel_navigation_style',
      'carousel_drag_free',
      'carousel_item_width',
      'remove_outline_on_images',
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
    expect(contentGallery.meta?.defaultValues?.container_variant).toBe('panel')
    expect(contentGallery.meta?.defaultValues?.container_radius_pattern).toBe('diagonal')
    expect(contentGallery.meta?.defaultValues?.gallery_display_mode).toBe('static')
    expect(contentGallery.meta?.defaultValues?.gallery_media_type).toBe('icon')
    expect(contentGallery.meta?.defaultValues?.gallery_columns).toBe('3')
    expect(contentGallery.meta?.defaultValues?.carousel_loop).toBe(false)
    expect(contentGallery.meta?.defaultValues?.carousel_navigation_position).toBe('bottom')
    expect(contentGallery.meta?.defaultValues?.carousel_navigation_style).toBe('arrows')
    expect(contentGallery.meta?.defaultValues?.carousel_drag_free).toBe(true)
    expect(contentGallery.meta?.defaultValues?.carousel_item_width).toBe('medium')
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

  it('uses shared container color options in content-gallery', () => {
    const options = contentGallery.meta?.editor?.inputConfig?.container_color?.props?.data || []
    const optionIds = options.map((option: any) => option.id)
    expect(optionIds).toEqual(containerColorOptions.map((option) => option.id))
  })

  it('keeps slot fields in schema', () => {
    expect(contentDefault.data.content.fields).toContain('title')
    expect(contentGallery.data.content.fields).toContain('title')
    expect(contentGallery.data.gallery_header.fields).toContain('title')
    expect(contentGallery.data.gallery.fields).toEqual(['media', 'title', 'subtitle'])
    expect(heroBanner.data.banner.fields).toContain('media')
  })

  it('defines content-gallery three-slot structure', () => {
    expect(Object.keys(contentGallery.data)).toEqual(['content', 'gallery_header', 'gallery'])
    expect(contentGallery.data.content).toMatchObject({
      type: 'content',
      order: 1,
      editor: { label: 'Main Content' },
    })
    expect(contentGallery.data.gallery_header).toMatchObject({
      type: 'content',
      order: 2,
      editor: { label: 'Gallery Header' },
    })
    expect(contentGallery.data.gallery).toMatchObject({
      type: 'gallery',
      order: 3,
      many: true,
      editor: { label: 'Gallery Items' },
    })
  })

  it('resolves content-gallery wrapper overflow from display mode', () => {
    expect(contentGallery.render?.resolveWrapper?.({
      section: {
        id: 'static-gallery',
        meta: { gallery_display_mode: 'static' },
      },
    }).overflow).toBe('hidden')
    expect(contentGallery.render?.resolveWrapper?.({
      section: {
        id: 'default-gallery',
        meta: {},
      },
    }).overflow).toBe('hidden')
    expect(contentGallery.render?.resolveWrapper?.({
      section: {
        id: 'carousel-gallery',
        meta: { gallery_display_mode: 'carousel' },
      },
    }).overflow).toBe('clip-x')
  })

  it('switches content-gallery gallery media input from section meta', () => {
    const generator = contentGallery.data.gallery.editor?.inputConfig?.media?.dependency?.inputConfig?.generator

    expect(generator?.({ meta: { gallery_media_type: 'embed' } })).toEqual({ type: 'embed' })
    expect(generator?.({ meta: { gallery_media_type: 'icon' } })).toEqual({ type: 'icon-select' })
    expect(generator?.({ meta: { gallery_media_type: 'image' } })).toEqual({ type: 'image' })
  })

  it('exports article-highlights schema with content+articles slots and articleCategory meta', () => {
    expect(sectionSchemas['article-highlights']).toBeTruthy()
    expect(Object.keys(articleHighlights.data)).toEqual(['content', 'articles'])
    expect(articleHighlights.data.content.type).toBe('content')
    expect(articleHighlights.data.content.fields).toEqual([
      'subtitle',
      'title',
      'description',
      'url',
      'url_text',
    ])
    expect(articleHighlights.data.articles).toEqual({
      type: 'resource',
      source: 'article',
      order: 2,
      many: true,
      fields: ['id', 'created_at', 'title', 'slug', 'excerpt', 'thumbnail', 'categories'],
      params: {
        strategy: 'latestPublished',
        limit: 4,
        categoryMetaField: 'articleCategory',
        categoryMatch: 'any',
      },
    })
    expect(articleHighlights.meta?.fields).toEqual([
      'section_background_color',
      'section_ornament_media',
      'section_ornament_offset',
      'articleCategory',
    ])
    expect(articleHighlights.meta?.defaultValues?.articleCategory).toBeNull()
    expect(articleHighlights.meta?.editor?.inputConfig?.articleCategory).toEqual({
      type: 'select',
      props: {
        getAPI: 'articleCategory',
        multi: true,
        clearable: true,
      },
    })
  })

  it('exports product-catalog schema with content+products slots and catalog meta', () => {
    expect(sectionSchemas['product-catalog']).toBeTruthy()
    expect(Object.keys(productCatalog.data)).toEqual(['content', 'products'])
    expect(productCatalog.data.content.type).toBe('content')
    expect(productCatalog.data.content.fields).toEqual([
      'subtitle',
      'title',
      'description',
      'url',
      'url_text',
    ])
    expect(productCatalog.data.products).toEqual({
      type: 'resource',
      source: 'product',
      order: 2,
      many: true,
      fields: ['id', 'name', 'url', 'thumbnail', 'category', 'product_category_id'],
      params: {
        limit: 8,
      },
    })
    expect(productCatalog.meta?.fields).toEqual([
      'section_background_color',
      'section_ornament_media',
      'section_ornament_offset',
      'initialLimit',
      'showSearch',
      'showCategoryTabs',
    ])
    expect(productCatalog.meta?.defaultValues?.initialLimit).toBe(8)
    expect(productCatalog.meta?.defaultValues?.showSearch).toBe(true)
    expect(productCatalog.meta?.defaultValues?.showCategoryTabs).toBe(true)
  })

  it('exports product-showcase schema with resource-only slots', () => {
    expect(sectionSchemas['product-showcase']).toBeTruthy()
    expect(Object.keys(productShowcase.data)).toEqual(['product', 'config'])
    expect(productShowcase.data.product).toEqual({
      type: 'resource',
      source: 'product',
      order: 1,
      many: false,
      fields: ['id', 'name', 'description', 'url', 'category', 'thumbnail', 'images', 'product_category_id'],
      params: {
        strategy: 'detailById',
        idMetaField: 'product_id',
      },
    })
    expect(productShowcase.data.config.type).toBe('resource')
    expect(productShowcase.data.config.source).toBe('section-meta-editor')
    expect(productShowcase.data.config.editor?.componentToken).toBe('product-showcase-meta-editor')
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

  it('defines contextual visibility for content-gallery meta controls', () => {
    const inputConfig = contentGallery.meta?.editor?.inputConfig

    expect(inputConfig?.container_color?.dependency?.visibility?.validator({ container_variant: 'plain' })).toBe(false)
    expect(inputConfig?.container_color?.dependency?.visibility?.validator({ container_variant: 'panel' })).toBe(true)
    expect(inputConfig?.container_radius_pattern?.dependency?.visibility?.validator({ container_variant: 'panel' })).toBe(true)
    expect(inputConfig?.column_ratio?.dependency?.visibility?.validator({ layout_direction: 'horizontal' })).toBe(true)
    expect(inputConfig?.column_ratio?.dependency?.visibility?.validator({ layout_direction: 'vertical' })).toBe(false)

    expect(inputConfig?.gallery_icon_size?.dependency?.visibility?.validator({ gallery_media_type: 'icon' })).toBe(true)
    expect(inputConfig?.gallery_icon_size?.dependency?.visibility?.validator({ gallery_media_type: 'image' })).toBe(false)
    expect(inputConfig?.gallery_media_radius?.dependency?.visibility?.validator({ gallery_media_type: 'image' })).toBe(true)
    expect(inputConfig?.gallery_media_aspect_ratio?.dependency?.visibility?.validator({ gallery_media_type: 'image' })).toBe(true)
    expect(inputConfig?.remove_outline_on_images?.dependency?.visibility?.validator({ gallery_media_type: 'image' })).toBe(true)
    expect(inputConfig?.gallery_columns?.dependency?.visibility?.validator({ gallery_display_mode: 'static' })).toBe(true)
    expect(inputConfig?.gallery_columns?.dependency?.visibility?.validator({ gallery_display_mode: 'carousel' })).toBe(false)
    expect(inputConfig?.carousel_loop?.dependency?.visibility?.validator({ gallery_display_mode: 'static' })).toBe(false)
    expect(inputConfig?.carousel_loop?.dependency?.visibility?.validator({ gallery_display_mode: 'carousel' })).toBe(true)
    expect(inputConfig?.carousel_drag_free?.dependency?.visibility?.validator({ gallery_display_mode: 'carousel' })).toBe(true)
    expect(inputConfig?.carousel_navigation_position?.dependency?.visibility?.validator({ gallery_display_mode: 'carousel' })).toBe(true)
    expect(inputConfig?.carousel_navigation_style?.dependency?.visibility?.validator({ gallery_display_mode: 'carousel', carousel_navigation_position: 'bottom' })).toBe(true)
    expect(inputConfig?.carousel_navigation_style?.dependency?.visibility?.validator({ gallery_display_mode: 'carousel', carousel_navigation_position: 'none' })).toBe(false)
    expect(inputConfig?.carousel_item_width?.dependency?.visibility?.validator({ gallery_display_mode: 'carousel' })).toBe(true)

    expect(inputConfig?.ornament_media?.dependency?.visibility?.validator({ ornament_enabled: true })).toBe(true)
    expect(inputConfig?.ornament_scope?.dependency?.visibility?.validator({ ornament_enabled: false })).toBe(false)
    expect(inputConfig?.ornament_layer?.dependency?.visibility?.validator({ ornament_enabled: true })).toBe(true)
    expect(inputConfig?.ornament_offset?.dependency?.visibility?.validator({ ornament_enabled: true, ornament_scope: 'container', ornament_layer: 'behind' })).toBe(true)
    expect(inputConfig?.ornament_size?.dependency?.visibility?.validator({ ornament_enabled: true, ornament_scope: 'gallery', ornament_layer: 'behind' })).toBe(true)
    expect(inputConfig?.ornament_position?.dependency?.visibility?.validator({ ornament_enabled: true, ornament_layer: 'inside' })).toBe(true)
  })

  it('narrows ornament scope options by container variant', () => {
    const generator = contentDefault.meta?.editor?.inputConfig?.ornament_scope?.dependency?.props?.generator

    expect(generator?.({ container_variant: 'plain' }).data.map((option: any) => option.id)).toEqual(['section', 'media'])
    expect(generator?.({ container_variant: 'panel' }).data.map((option: any) => option.id)).toEqual(['container', 'media'])
  })

  it('narrows content-gallery ornament scope options by container variant', () => {
    const generator = contentGallery.meta?.editor?.inputConfig?.ornament_scope?.dependency?.props?.generator

    expect(generator?.({ container_variant: 'plain' }).data.map((option: any) => option.id)).toEqual(['section', 'content', 'gallery'])
    expect(generator?.({ container_variant: 'panel' }).data.map((option: any) => option.id)).toEqual(['container', 'content', 'gallery'])
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
