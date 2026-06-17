import { describe, expect, it, vi } from 'vitest'

const localStorageMock = vi.hoisted(() => ({
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}))

vi.stubGlobal('localStorage', localStorageMock)
vi.mock('@/views/authenticated/website/website/_layouts/detail/_layouts/_layouts/_layouts/_Custom/FormMetaEditor.vue', () => ({
  default: { name: 'MockFormMetaEditor' },
}))
vi.mock('@/views/authenticated/website/website/_layouts/detail/_layouts/_layouts/_layouts/_Custom/ProductShowcaseMetaEditor.vue', () => ({
  default: { name: 'MockProductShowcaseMetaEditor' },
}))

import {
  SUPPORTED_SECTION_SCHEMA_CODES,
  buildCreateNestedSectionPayload,
  buildCreateSectionPayload,
  getAddSectionOptions,
  getSectionPanelState,
  getNestedEditorConfig,
  getSupportedEditorConfig,
  getSupportedSectionSchemaGroup,
  landingSectionBackgroundPresetColors,
  matchNestedSchemaSlotsToStructure,
  matchRootSchemaSlotsToStructure,
  matchSchemaDataToStructure,
  matchSchemaSlotsToStructure,
  supportedSectionSchemas,
} from '../schemaAdapter'

describe('section schema adapter', () => {
  it('loads all supported shared schemas from the shared package', () => {
    expect(Object.keys(supportedSectionSchemas).sort()).toEqual([...SUPPORTED_SECTION_SCHEMA_CODES].sort())
  })

  it('builds add-section options from supported schemas only', () => {
    const options = getAddSectionOptions()

    expect(options).toHaveLength(SUPPORTED_SECTION_SCHEMA_CODES.length)
    expect(options.map((option) => option.code).sort()).toEqual([...SUPPORTED_SECTION_SCHEMA_CODES].sort())
  })

  it('resolves unsupported section into read-only unsupported state', () => {
    const state = getSectionPanelState({
      name: 'Legacy Section',
      section_type_code: 'timeline-carousel',
      visible: true,
      updated_at: '2026-05-17T00:00:00.000Z',
    })

    expect(state.kind).toBe('unsupported')
    if (state.kind !== 'unsupported') throw new Error('Expected unsupported state')

    expect(state.viewModel.sectionName).toBe('Legacy Section')
    expect(state.viewModel.sectionTypeCode).toBe('timeline-carousel')
    expect(state.viewModel.visible).toBe(true)
  })

  it('matches schema slots by type and order against section detail structure', () => {
    const matches = matchSchemaSlotsToStructure('hero-banner', [
      { id: 'a', type: 'gallery', order: 1 },
      { id: 'b', type: 'gallery', order: 1 },
      { id: 'c', type: 'gallery', order: 2 },
    ])

    const banner = matches.find((slot) => slot.slotKey === 'banner')

    expect(banner?.items.map((item) => item.id)).toEqual(['a', 'b'])
    expect(matches).toHaveLength(1)
  })

  it('exposes schema-specific slot metadata and dynamic slot resolvers', () => {
    const heroBannerConfig = getSupportedEditorConfig('hero-banner')
    expect(heroBannerConfig).not.toBeNull()

    const bannerSlot = heroBannerConfig?.slots.find((slot) => slot.key === 'banner')
    expect(bannerSlot?.component).toBeUndefined()
    expect(bannerSlot?.resolveConfig).toBeUndefined()
    expect(bannerSlot?.fields).toEqual(['media_type', 'media', 'subtitle', 'title', 'description', 'cta', 'url'])
    expect(bannerSlot?.fields).toContain('media')
    expect(bannerSlot?.fieldAliases?.cta).toBe('Primary Button')

    const dataListConfig = getSupportedEditorConfig('data-list')
    const childSections = dataListConfig?.slots.find((slot) => slot.key === 'childSections')
    expect(childSections?.component).toBeUndefined()
    expect(childSections?.schema?.data.gallery.editor?.resolveConfig).toBeDefined()

    const formConfig = getSupportedEditorConfig('form')
    const formMetaSlot = formConfig?.slots.find((slot) => slot.key === 'config')
    expect(formMetaSlot?.component).toBeDefined()
  })

  it('exposes recursive slot schema and nested schema config', () => {
    const dataListConfig = getSupportedEditorConfig('data-list')
    const childSections = dataListConfig?.slots.find((slot) => slot.key === 'childSections')

    expect(childSections?.type).toBe('sectionGroup')
    expect(childSections?.order).toBe(2)
    expect(childSections?.schema?.info).toMatchObject({
      name: 'Data Item',
      description: 'Single data-list item',
    })
    expect(childSections?.schema?.meta).toMatchObject({
      fields: [],
      defaultValues: {},
    })
    expect(childSections?.schema?.data.gallery).toMatchObject({
      type: 'gallery',
      order: 1,
    })
    expect(childSections?.schema?.data.gallery.editor?.resolveConfig).toBeDefined()
  })

  it('builds nested editor config from nested schema metadata', () => {
    const dataListConfig = getSupportedEditorConfig('data-list')
    const nestedSchema = dataListConfig?.slots.find((slot) => slot.key === 'childSections')?.schema
    const nestedEditorConfig = getNestedEditorConfig(nestedSchema)

    expect(nestedEditorConfig?.meta?.fields).toEqual([])
    expect(nestedEditorConfig?.meta?.defaultValues).toEqual({})
  })

  it('matches root schema slots with path-aware context', () => {
    const matches = matchRootSchemaSlotsToStructure('data-list', [
      { id: 'content-1', type: 'content', order: 1 },
      { id: 'group-1', type: 'sectionGroup', order: 2 },
    ])

    const content = matches.find((match) => match.pathKey === 'content')
    const childSections = matches.find((match) => match.pathKey === 'childSections')

    expect(content?.items.map((item) => item.id)).toEqual(['content-1'])
    expect(content?.editor.path).toEqual(['content'])
    expect(content?.editor.fields).toEqual(['subtitle', 'title', 'description'])

    expect(childSections?.items.map((item) => item.id)).toEqual(['group-1'])
    expect(childSections?.editor.path).toEqual(['childSections'])
    expect(childSections?.editor.type).toBe('sectionGroup')
    expect(childSections?.editor.schema?.info?.name).toBe('Data Item')
    expect(childSections?.editor.schema?.meta?.defaultValues).toEqual({})
    expect(childSections?.editor.schema?.data.gallery).toMatchObject({ type: 'gallery', order: 1 })
    expect(childSections?.editor.component).toBeUndefined()
  })

  it('matches content-gallery content slots separately by order', () => {
    const matches = matchRootSchemaSlotsToStructure('content-gallery', [
      { id: 'left-content', type: 'content', order: 1 },
      { id: 'gallery-title', type: 'content', order: 2 },
      { id: 'gallery-items', type: 'gallery', order: 3 },
    ])

    const content = matches.find((match) => match.pathKey === 'content')
    const galleryHeader = matches.find((match) => match.pathKey === 'gallery_header')
    const gallery = matches.find((match) => match.pathKey === 'gallery')

    expect(content?.items.map((item) => item.id)).toEqual(['left-content'])
    expect(content?.editor.label).toBe('Main Content')
    expect(galleryHeader?.items.map((item) => item.id)).toEqual(['gallery-title'])
    expect(galleryHeader?.editor.label).toBe('Gallery Header')
    expect(gallery?.items.map((item) => item.id)).toEqual(['gallery-items'])
    expect(gallery?.editor.label).toBe('Gallery Items')
  })

  it('matches nested sectionGroup-owned schema against a child section structure', () => {
    const rootMatches = matchRootSchemaSlotsToStructure('data-list', [
      { id: 'group-1', type: 'sectionGroup', order: 2 },
    ])

    const childSections = rootMatches.find((match) => match.pathKey === 'childSections')
    if (!childSections) throw new Error('Expected childSections match')

    const nestedMatches = matchNestedSchemaSlotsToStructure({
      parentMatch: childSections,
      structure: [
        { id: 'gallery-1', type: 'gallery', order: 1 },
      ],
    })

    const gallery = nestedMatches.find((match) => match.pathKey === 'childSections.gallery')

    expect(gallery?.slotKey).toBe('gallery')
    expect(gallery?.path).toEqual(['childSections', 'gallery'])
    expect(gallery?.items.map((item) => item.id)).toEqual(['gallery-1'])
    expect(gallery?.editor.type).toBe('gallery')
    expect(gallery?.editor.label).toBe('Data')
    expect(gallery?.editor.component).toBeUndefined()
    expect(gallery?.editor.resolveConfig).toBeDefined()
  })

  it('returns no nested matches when parent editor has no nested schema', () => {
    const nestedMatches = matchNestedSchemaSlotsToStructure({
      parentMatch: {
        key: 'plainGroup',
        type: 'sectionGroup',
        order: 1,
        many: true,
        label: 'Plain Group',
        fields: [],
        path: ['plainGroup'],
        pathKey: 'plainGroup',
      },
      structure: [{ id: 'gallery-1', type: 'gallery', order: 1 }],
    })

    expect(nestedMatches).toEqual([])
  })

  it('preserves many=false and many=true behavior in generic schema data matching', () => {
    const matches = matchSchemaDataToStructure({
      schemaData: {
        singleGallery: { type: 'gallery', order: 1 },
        manyGallery: { type: 'gallery', order: 2, many: true },
      },
      structure: [
        { id: 'single-a', type: 'gallery', order: 1 },
        { id: 'single-b', type: 'gallery', order: 1 },
        { id: 'many-a', type: 'gallery', order: 2 },
        { id: 'many-b', type: 'gallery', order: 2 },
      ],
    })

    expect(matches.find((match) => match.slotKey === 'singleGallery')?.items.map((item) => item.id)).toEqual(['single-a'])
    expect(matches.find((match) => match.slotKey === 'manyGallery')?.items.map((item) => item.id)).toEqual(['many-a', 'many-b'])
  })

  it('exposes shared section meta settings to the editor config', () => {
    const contentDefaultConfig = getSupportedEditorConfig('content-default')
    expect(contentDefaultConfig?.meta?.fields?.[0]).toBe('section_background_color')
    expect(contentDefaultConfig?.meta?.fields).toContain('width_preset')
    expect(contentDefaultConfig?.meta?.inputConfig?.section_background_color?.type).toBe('color')
    expect(contentDefaultConfig?.meta?.inputConfig?.width_preset?.type).toBe('select')
    expect(contentDefaultConfig?.meta?.defaultValues?.width_preset).toBe('xl')
    const contentSlot = contentDefaultConfig?.slots.find((slot) => slot.key === 'content')
    expect(contentSlot?.fields).toEqual(['media_type', 'media', 'subtitle', 'title', 'description', 'url'])
    expect(contentSlot?.inputConfig?.media?.dependency?.fields).toEqual(['media_type'])
    expect(contentSlot?.inputConfig?.url).toEqual({
      type: 'button-config',
      bind: {
        buttonUrl: 'url',
        buttonText: 'url_text',
      },
      props: {
        textField: 'url_text',
        urlInputConfig: { type: 'url' },
      },
    })

    const dataListConfig = getSupportedEditorConfig('data-list')
    expect(dataListConfig?.meta?.fields?.[0]).toBe('section_background_color')
    expect(dataListConfig?.meta?.fields).toContain('closed_on_initial')
    expect(dataListConfig?.meta?.inputConfig?.closed_on_initial?.dependency?.fields).toEqual(['collapsible'])
    expect(dataListConfig?.meta?.fieldsType?.collapsible).toBeTruthy()
    expect(dataListConfig?.meta?.defaultValues?.type).toBe('list')
  })

  it('injects landing preset colors for section background color', () => {
    const contentDefaultConfig = getSupportedEditorConfig('content-default')
    const presetColors = contentDefaultConfig?.meta?.inputConfig?.section_background_color?.props?.presetColors

    expect(presetColors).toEqual(landingSectionBackgroundPresetColors)
    expect(presetColors?.map((preset: { id: string }) => preset.id)).toEqual([
      'primary-default',
      'primary-container',
      'secondary-default',
      'secondary-container',
      'tertiary-default',
      'tertiary-container',
      'surface-default',
      'surface-container',
      'outline-default',
      'outline-variant',
    ])
    expect(presetColors?.find((preset: { id: string }) => preset.id === 'outline-variant')?.value).toBe('#CDC9C9FF')
  })

  it('derives section groups from schema editor.group', () => {
    expect(getSupportedSectionSchemaGroup('hero-banner')).toBe('Banner')
    expect(getSupportedSectionSchemaGroup('data-list')).toBe('Utility')
  })

  it('keeps unknown section unsupported/read-only', () => {
    expect(getSupportedEditorConfig('legacy-unknown')).toBeNull()
  })

  it('builds section create payload from supported schema only and does not include default meta', () => {
    const payload = buildCreateSectionPayload({
      schemaCode: 'content-default',
      sectionGroupId: 'sg-1',
      pageTranslationId: 'pt-1',
    })

    expect(payload.section_type_code).toBe('content-default')
    expect(payload.name).toBe('Content Default')
    expect(payload.description).toBe('Single content slot section')
    expect(payload.section_group_id).toBe('sg-1')
    expect(payload.page_translation_id).toBe('pt-1')
    expect(payload).not.toHaveProperty('meta')
    expect(payload).not.toHaveProperty('config')
  })

  it('builds nested section create payload without section type code', () => {
    const payload = buildCreateNestedSectionPayload({
      sectionGroupId: 'sg-nested',
      pageTranslationId: 'pt-1',
    })

    expect(payload).toMatchObject({
      section_group_id: 'sg-nested',
      page_translation_id: 'pt-1',
    })
    expect(payload).not.toHaveProperty('section_type_code')
  })
})
