import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { navigation } from '@/manifest/navigation'

const router = createRouter({ history: createMemoryHistory(), routes })

describe('Karyawan Terlibat Simulasi Tanggap Darurat route integration', () => {
  it('registers the standard route tree and navigation entry', () => {
    expect(router.resolve('/master-data/emergency-simulation-employees').name).toBe('master-data-emergency-simulation-employees')
    expect(router.resolve('/master-data/emergency-simulation-employees/create').name).toBe('master-data-emergency-simulation-employees-create')
    expect(router.resolve('/master-data/emergency-simulation-employees/record-1/detail').name).toBe('master-data-emergency-simulation-employees-detail')
    expect(router.resolve('/master-data/emergency-simulation-employees/record-1/edit').name).toBe('master-data-emergency-simulation-employees-edit')

    const masterData = navigation.find((module) => module.name === 'master-data')
    expect(masterData?.routes).toContainEqual({
      to: { name: 'master-data-emergency-simulation-employees' },
      permission: 'view-emergency-simulation-employees',
      title: 'Karyawan Terlibat',
      icon: 'folder',
    })
  })
})
