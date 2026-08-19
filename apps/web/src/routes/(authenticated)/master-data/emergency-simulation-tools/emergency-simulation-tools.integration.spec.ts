import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { navigation } from '@/manifest/navigation'

const router = createRouter({ history: createMemoryHistory(), routes })

describe('Perlengkapan Tanggap Darurat route integration', () => {
  it('registers the standard route tree and navigation entry', () => {
    expect(router.resolve('/master-data/emergency-simulation-tools').name).toBe('master-data-emergency-simulation-tools')
    expect(router.resolve('/master-data/emergency-simulation-tools/create').name).toBe('master-data-emergency-simulation-tools-create')
    expect(router.resolve('/master-data/emergency-simulation-tools/record-1/detail').name).toBe('master-data-emergency-simulation-tools-detail')
    expect(router.resolve('/master-data/emergency-simulation-tools/record-1/edit').name).toBe('master-data-emergency-simulation-tools-edit')

    const masterData = navigation.find((module) => module.name === 'master-data')
    expect(masterData?.routes).toContainEqual({
      to: { name: 'master-data-emergency-simulation-tools' },
      permission: 'view-emergency-simulation-tools',
      title: 'Perlengkapan Tanggap Darurat',
      icon: 'folder',
    })
  })
})

