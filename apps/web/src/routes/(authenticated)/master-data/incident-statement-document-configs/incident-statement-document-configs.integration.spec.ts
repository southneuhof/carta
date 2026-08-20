import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { navigation } from '@/manifest/navigation'

const router = createRouter({ history: createMemoryHistory(), routes })

describe('incident statement document configs route integration', () => {
  it('registers standard CRUD routes and the HSSE navigation entry', () => {
    expect(router.resolve('/master-data/incident-statement-document-configs').name).toBe('master-data-incident-statement-document-configs')
    expect(router.resolve('/master-data/incident-statement-document-configs/create').name).toBe('master-data-incident-statement-document-configs-create')
    expect(router.resolve('/master-data/incident-statement-document-configs/config-1/detail').name).toBe('master-data-incident-statement-document-configs-detail')
    expect(router.resolve('/master-data/incident-statement-document-configs/config-1/edit').name).toBe('master-data-incident-statement-document-configs-edit')

    const masterData = navigation.find((module) => module.name === 'master-data')
    expect(masterData?.routes).toContainEqual({
      to: { name: 'master-data-incident-statement-document-configs' },
      permission: 'view-incident-statement-document-configs',
      title: 'Dokumen Pernyataan Insiden',
      icon: 'folder',
    })
  })
})
