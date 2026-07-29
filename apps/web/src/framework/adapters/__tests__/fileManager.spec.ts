import { describe, expect, it, vi } from 'vitest'
import { canonicalAsset, fileManagerOptions } from '../fileManager'

vi.mock('@/utils/services', () => ({ default: {} }))

describe('file manager value adapter', () => {
  it('round trips backend aliases through canonical persisted input assets', async () => {
    const managed = canonicalAsset({
      path: '/storage/public/a.png',
      filename: 'a.png',
      content_type: 'image/png',
      updated_at: '2026-07-29T00:00:00.000Z',
      url: 'https://cdn.test/a.png',
      size: 12,
    })
    const model = await fileManagerOptions.values.toModel(managed)
    expect(model).toEqual({
      kind: 'file',
      path: '/storage/public/a.png',
      url: 'https://cdn.test/a.png',
      name: 'a.png',
      size: 12,
      mimeType: 'image/png',
      updatedAt: '2026-07-29T00:00:00.000Z',
    })
    await expect(fileManagerOptions.values.fromModel(model)).resolves.toMatchObject({
      kind: 'file',
      name: 'a.png',
      mimeType: 'image/png',
    })
  })
})
