import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { navigation } from '@/manifest/navigation'

const router = createRouter({ history: createMemoryHistory(), routes })

describe('Regulasi & Perundangan HSSE route integration', () => {
  it('registers the route and navigation entry', () => {
    expect(router.resolve('/master-data/law-reference-items').name).toBe('master-data-law-reference-items')

    const masterData = navigation.find((module) => module.name === 'master-data')
    expect(masterData?.routes).toContainEqual({ separator: 'Undang-Undang' })
    expect(masterData?.routes).toContainEqual({
      to: { name: 'master-data-law-reference-items' },
      permission: 'view-law-reference-items',
      title: 'Regulasi & Perundangan HSSE',
      icon: 'folder',
    })
  })
})
