import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { navigation } from '@/manifest/navigation'

const router = createRouter({ history: createMemoryHistory(), routes })

describe('Faktor Kecelakaan route integration', () => {
  it('registers the standard route tree and navigation entry', () => {
    expect(router.resolve('/master-data/toll-causes-accidents').name).toBe('master-data-toll-causes-accidents')
    expect(router.resolve('/master-data/toll-causes-accidents/create').name).toBe('master-data-toll-causes-accidents-create')
    expect(router.resolve('/master-data/toll-causes-accidents/record-1/detail').name).toBe('master-data-toll-causes-accidents-detail')
    expect(router.resolve('/master-data/toll-causes-accidents/record-1/edit').name).toBe('master-data-toll-causes-accidents-edit')

    const masterData = navigation.find((module) => module.name === 'master-data')
    expect(masterData?.routes).toContainEqual({ separator: 'Road Traffic Safety' })
    expect(masterData?.routes).toContainEqual({
      to: { name: 'master-data-toll-causes-accidents' },
      permission: 'view-toll-causes-accidents',
      title: 'Faktor Kecelakaan',
      icon: 'folder',
    })
  })
})
