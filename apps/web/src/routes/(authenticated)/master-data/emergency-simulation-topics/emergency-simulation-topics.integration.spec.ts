import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { navigation } from '@/manifest/navigation'

const router = createRouter({ history: createMemoryHistory(), routes })

describe('Topik Simulasi Tanggap Darurat route integration', () => {
  it('registers the standard route tree and navigation entry', () => {
    expect(router.resolve('/master-data/emergency-simulation-topics').name).toBe('master-data-emergency-simulation-topics')
    expect(router.resolve('/master-data/emergency-simulation-topics/create').name).toBe('master-data-emergency-simulation-topics-create')
    expect(router.resolve('/master-data/emergency-simulation-topics/record-1/detail').name).toBe('master-data-emergency-simulation-topics-detail')
    expect(router.resolve('/master-data/emergency-simulation-topics/record-1/edit').name).toBe('master-data-emergency-simulation-topics-edit')

    const masterData = navigation.find((module) => module.name === 'master-data')
    expect(masterData?.routes).toContainEqual({
      to: { name: 'master-data-emergency-simulation-topics' },
      permission: 'view-emergency-simulation-topics',
      title: 'Topik Simulasi Tanggap Darurat',
      icon: 'folder',
    })
  })
})
