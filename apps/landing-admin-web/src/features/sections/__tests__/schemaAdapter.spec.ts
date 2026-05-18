import { describe, expect, it } from 'vitest'
import {
  SUPPORTED_SECTION_SCHEMA_CODES,
  buildCreateSectionPayload,
  getAddSectionOptions,
  getSectionPanelState,
  getSupportedEditorConfig,
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
    expect(childSections?.component).toBeDefined()
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
