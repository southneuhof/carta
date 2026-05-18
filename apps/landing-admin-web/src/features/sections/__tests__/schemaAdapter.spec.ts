import { describe, expect, it } from 'vitest'
import {
  SUPPORTED_SECTION_SCHEMA_CODES,
  buildCreateSectionPayload,
  getAddSectionOptions,
  getSectionPanelState,
  getSupportedEditorConfig,
  matchNestedSchemaSlotsToStructure,
  matchRootSchemaSlotsToStructure,
  matchSchemaDataToStructure,
  matchSchemaSlotsToStructure,
  supportedSectionSchemas,
} from '../schemaAdapter'

describe('section schema adapter', () => {
  it('loads exactly the 5 supported shared schemas', () => {
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
      { id: 'd', type: 'gallery', order: 3 },
      { id: 'e', type: 'content', order: 1 },
    ])

    const banner = matches.find((slot) => slot.slotKey === 'banner')
    const quickAccess = matches.find((slot) => slot.slotKey === 'quickAccess')
    const projectCategory = matches.find((slot) => slot.slotKey === 'projectCategory')

    expect(banner?.items.map((item) => item.id)).toEqual(['a', 'b'])
    expect(quickAccess?.items.map((item) => item.id)).toEqual(['c'])
    expect(projectCategory?.items.map((item) => item.id)).toEqual(['d'])
  })

  it('exposes schema-specific slot metadata and custom editor components', () => {
    const heroBannerConfig = getSupportedEditorConfig('hero-banner')
    expect(heroBannerConfig).not.toBeNull()

    const projectCategorySlot = heroBannerConfig?.slots.find((slot) => slot.key === 'projectCategory')
    expect(projectCategorySlot?.component).toBeDefined()

    const dataListConfig = getSupportedEditorConfig('data-list')
    const childSections = dataListConfig?.slots.find((slot) => slot.key === 'childSections')
    expect(childSections?.component).toBeUndefined()
    expect(childSections?.slots?.gallery?.component).toBeDefined()
  })

  it('exposes recursive slot schema and nested overlay config', () => {
    const dataListConfig = getSupportedEditorConfig('data-list')
    const childSections = dataListConfig?.slots.find((slot) => slot.key === 'childSections')

    expect(childSections?.type).toBe('sectionGroup')
    expect(childSections?.order).toBe(2)
    expect(childSections?.data?.gallery).toMatchObject({
      type: 'gallery',
      order: 1,
    })
    expect(childSections?.slots?.gallery?.component).toBeDefined()
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
    expect(childSections?.editor.data?.gallery).toMatchObject({ type: 'gallery', order: 1 })
    expect(childSections?.editor.slots?.gallery?.component).toBeDefined()
    expect(childSections?.editor.component).toBeUndefined()
  })

  it('matches nested sectionGroup-owned schema data against a child section structure', () => {
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
    expect(gallery?.editor.component).toBeDefined()
  })

  it('does not match nested custom gallery overlay against a non-gallery runtime item', () => {
    const rootMatches = matchRootSchemaSlotsToStructure('data-list', [
      { id: 'group-1', type: 'sectionGroup', order: 2 },
    ])

    const childSections = rootMatches.find((match) => match.pathKey === 'childSections')
    if (!childSections) throw new Error('Expected childSections match')

    const nestedMatches = matchNestedSchemaSlotsToStructure({
      parentMatch: childSections,
      structure: [
        { id: 'wrong-1', type: 'sectionGroup', order: 1 },
      ],
    })

    const gallery = nestedMatches.find((match) => match.pathKey === 'childSections.gallery')

    expect(gallery?.items).toEqual([])
    expect(gallery?.editor.component).toBeDefined()
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
    expect(contentDefaultConfig?.meta?.fields).toContain('width_preset')
    expect(contentDefaultConfig?.meta?.inputConfig?.width_preset?.type).toBe('select')
    expect(contentDefaultConfig?.meta?.defaultValues?.width_preset).toBe('md')
    const contentSlot = contentDefaultConfig?.slots.find((slot) => slot.key === 'content')
    expect(contentSlot?.fields).toEqual(['media_type', 'media', 'attachment', 'subtitle', 'title', 'description', 'url', 'url_text'])
    expect(contentSlot?.inputConfig?.media?.dependency?.fields).toEqual(['media_type'])

    const dataListConfig = getSupportedEditorConfig('data-list')
    expect(dataListConfig?.meta?.fields).toContain('closed_on_initial')
    expect(dataListConfig?.meta?.inputConfig?.closed_on_initial?.dependency?.fields).toEqual(['collapsible'])
    expect(dataListConfig?.meta?.defaultValues?.type).toBe('list')
  })

  it('keeps unknown section unsupported/read-only', () => {
    expect(getSupportedEditorConfig('legacy-unknown')).toBeNull()
  })

  it('builds section create payload from supported schema only', () => {
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
    expect(payload.meta).toMatchObject({ width_preset: 'md' })
    expect(payload).not.toHaveProperty('config')
  })
})
