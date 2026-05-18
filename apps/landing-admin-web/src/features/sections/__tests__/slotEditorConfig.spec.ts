import { describe, expect, it, vi } from 'vitest'
import { resolveSlotEditorConfig, type ContentSlotEditorConfig } from '@/features/sections/slotEditorConfig'

describe('resolveSlotEditorConfig', () => {
  const ctx = {
    slot: { key: 'gallery', type: 'gallery' as const, order: 1, many: false },
    sectionData: { id: 'section-1' },
    parentSectionData: { id: 'section-parent' },
    rootSectionData: { id: 'section-root' },
  }

  it('returns static config unchanged', () => {
    const config: ContentSlotEditorConfig = { fields: ['title'] }
    expect(resolveSlotEditorConfig(config, ctx)).toBe(config)
  })

  it('merges resolved config over base config', () => {
    const config: ContentSlotEditorConfig = {
      fields: ['title'],
      fieldAliases: { title: 'Title' },
      resolveConfig: () => ({ fields: ['description'] }),
    }
    const resolved = resolveSlotEditorConfig(config, ctx)
    expect(resolved?.fields).toEqual(['description'])
    expect(resolved?.fieldAliases).toEqual({ title: 'Title' })
  })

  it('passes full context to resolver', () => {
    const resolver = vi.fn(() => ({ fields: ['title'] }))
    resolveSlotEditorConfig({ resolveConfig: resolver }, ctx)
    expect(resolver).toHaveBeenCalledWith(ctx)
  })

  it('ignores nested resolveConfig from resolver output', () => {
    const nested = vi.fn(() => ({ fields: ['other'] }))
    const base = vi.fn(() => ({ fields: ['title'], resolveConfig: nested }))
    const resolved = resolveSlotEditorConfig({ resolveConfig: base } as ContentSlotEditorConfig, ctx)
    expect(resolved?.fields).toEqual(['title'])
    expect(resolved?.resolveConfig).toBe(base)
  })
})
