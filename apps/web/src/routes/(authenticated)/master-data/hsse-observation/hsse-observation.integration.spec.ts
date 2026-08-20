import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { navigation } from '@/manifest/navigation'

const router = createRouter({ history: createMemoryHistory(), routes })

describe('HSSE observation route integration', () => {
  it('registers the standard nested route tree and navigation entries', () => {
    expect(router.resolve('/master-data/hsse-observation').name).toBe('master-data-hsse-observation')
    expect(router.resolve('/master-data/hsse-observation/create').name).toBe('master-data-hsse-observation-create')
    expect(router.resolve('/master-data/hsse-observation/type-1/detail').name).toBe('master-data-hsse-observation-detail')
    expect(router.resolve('/master-data/hsse-observation/type-1/detail/categories').name).toBe('master-data-hsse-observation-detail-categories')
    expect(router.resolve('/master-data/hsse-observation/type-1/detail/categories/category-1/detail').name).toBe('master-data-hsse-observation-detail-categories-detail')
    expect(router.resolve('/master-data/hsse-observation/type-1/detail/categories/category-1/detail/causes').name).toBe('master-data-hsse-observation-detail-categories-detail-causes')
    expect(router.resolve('/master-data/hsse-observation/type-1/detail/categories/category-1/detail/causes/cause-1/detail').name).toBe(
      'master-data-hsse-observation-detail-categories-detail-causes-detail'
    )

    const masterData = navigation.find((module) => module.name === 'master-data')
    expect(masterData?.routes).toContainEqual({ separator: 'HSSE' })
    expect(masterData?.routes).toContainEqual({ to: { name: 'master-data-hsse-observation' }, permission: 'view-hsse-observation', title: 'Kriteria Temuan Observation', icon: 'folder' })
    expect(masterData?.routes).toContainEqual({
      to: { name: 'master-data-incident-statement-document-configs' },
      permission: 'view-incident-statement-document-configs',
      title: 'Dokumen Pernyataan Insiden',
      icon: 'folder',
    })
  })
})
