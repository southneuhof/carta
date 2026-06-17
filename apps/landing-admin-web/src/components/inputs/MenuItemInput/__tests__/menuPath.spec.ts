import { describe, expect, it, vi } from 'vitest'
import { buildMenuPathFromSelectedItems, createEmptyMenuPathSelection, initializeMenuPathSelection, isInternalWebsitePath } from '../menuPath'

describe('menuPath helpers', () => {
  it('creates an empty selection state', () => {
    expect(createEmptyMenuPathSelection()).toEqual({
      selectedItems: [undefined, undefined, undefined],
      currentSelectedIds: [undefined, undefined, undefined],
    })
  })

  it('builds a slash-prefixed path from selected items', () => {
    expect(
      buildMenuPathFromSelectedItems([
        { id: 'm1', slug: 'parent', name: 'Parent' },
        { id: 'm2', slug: 'child', name: 'Child' },
        undefined,
      ]),
    ).toBe('/parent/child')
  })

  it('recognizes internal website paths', () => {
    expect(isInternalWebsitePath('/products')).toBe(true)
    expect(isInternalWebsitePath('https://example.com')).toBe(false)
    expect(isInternalWebsitePath(undefined)).toBe(false)
  })

  it('initializes selection from a valid internal path', async () => {
    const fetchMenuItemsAtLevel = vi.fn(async ({ level, parent_id }: { level: number; parent_id?: string }) => {
      if (level === 1) return [{ id: 'm1', slug: 'parent', name: 'Parent' }]
      if (level === 2 && parent_id === 'm1') return [{ id: 'm2', slug: 'child', name: 'Child' }]
      return []
    })

    const selection = await initializeMenuPathSelection('/parent/child', fetchMenuItemsAtLevel)

    expect(fetchMenuItemsAtLevel).toHaveBeenCalledTimes(2)
    expect(selection.selectedItems[0]?.slug).toBe('parent')
    expect(selection.selectedItems[1]?.slug).toBe('child')
    expect(selection.currentSelectedIds).toEqual(['m1', 'm2', undefined])
  })

  it('leaves selection empty for manual/external values', async () => {
    const fetchMenuItemsAtLevel = vi.fn()

    const selection = await initializeMenuPathSelection('mailto:test@example.com', fetchMenuItemsAtLevel)

    expect(fetchMenuItemsAtLevel).not.toHaveBeenCalled()
    expect(selection).toEqual(createEmptyMenuPathSelection())
  })
})
