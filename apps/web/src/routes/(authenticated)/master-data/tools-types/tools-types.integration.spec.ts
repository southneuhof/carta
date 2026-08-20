import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { navigation } from '@/manifest/navigation'

const router = createRouter({ history: createMemoryHistory(), routes })

describe('Jenis Alat Berat & Alat Ukur/Uji route integration', () => {
  it('registers the standard route tree and navigation entry', () => {
    expect(router.resolve('/master-data/tools-types').name).toBe('master-data-tools-types')
    expect(router.resolve('/master-data/tools-types/create').name).toBe('master-data-tools-types-create')
    expect(router.resolve('/master-data/tools-types/record-1/detail').name).toBe('master-data-tools-types-detail')
    expect(router.resolve('/master-data/tools-types/record-1/edit').name).toBe('master-data-tools-types-edit')

    const masterData = navigation.find((module) => module.name === 'master-data')
    expect(masterData?.routes).toContainEqual({
      to: { name: 'master-data-tools-types' },
      permission: 'view-tools-types',
      title: 'Jenis Alat Berat & Alat Ukur/Uji',
      icon: 'folder',
    })
  })
})

