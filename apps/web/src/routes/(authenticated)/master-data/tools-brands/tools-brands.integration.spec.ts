import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { navigation } from '@/manifest/navigation'

const router = createRouter({ history: createMemoryHistory(), routes })

describe('Merk Alat Berat & Alat Ukur/Uji route integration', () => {
  it('registers the standard route tree and navigation entry', () => {
    expect(router.resolve('/master-data/tools-brands').name).toBe('master-data-tools-brands')
    expect(router.resolve('/master-data/tools-brands/create').name).toBe('master-data-tools-brands-create')
    expect(router.resolve('/master-data/tools-brands/record-1/detail').name).toBe('master-data-tools-brands-detail')
    expect(router.resolve('/master-data/tools-brands/record-1/edit').name).toBe('master-data-tools-brands-edit')

    const masterData = navigation.find((module) => module.name === 'master-data')
    expect(masterData?.routes).toContainEqual({
      to: { name: 'master-data-tools-brands' },
      permission: 'view-tools-brands',
      title: 'Merk Alat Berat & Alat Ukur/Uji',
      icon: 'folder',
    })
  })
})

