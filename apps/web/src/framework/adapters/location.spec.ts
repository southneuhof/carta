import { describe, expect, it, vi } from 'vitest'
import { locationOperations } from './location'

describe('locationOperations', () => {
  it('returns an empty apiKey and empty autocomplete results for openstreetmap when VITE_GEOAPIFY_API_KEY is unset', async () => {
    vi.stubEnv('VITE_GEOAPIFY_API_KEY', '')
    try {
      await expect(locationOperations.mapConfig({ mapProvider: 'openstreetmap' })).resolves.toEqual({ apiKey: '' })
      await expect(locationOperations.autocomplete({ input: 'East gate', mapProvider: 'openstreetmap' })).resolves.toEqual([])
    } finally {
      vi.unstubAllEnvs()
    }
  })
})
