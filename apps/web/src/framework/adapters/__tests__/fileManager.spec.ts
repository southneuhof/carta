import { describe, expect, it, vi } from 'vitest'
import { canonicalAsset, fileManagerOptions } from '../fileManager'

const { listFiles, uploadFile, deleteFile, fileUrl } = vi.hoisted(() => ({
  listFiles: vi.fn(),
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  fileUrl: vi.fn((key: string) => `https://api.test/files/object?key=${encodeURIComponent(key)}`),
}))
vi.mock('../storage', () => ({ deleteFile, fileUrl, listFiles, uploadFile }))

describe('file manager value adapter', () => {
  it('round trips backend aliases through canonical persisted input assets', async () => {
    const managed = canonicalAsset({
      path: 'uploads/a.png',
      filename: 'a.png',
      content_type: 'image/png',
      updated_at: '2026-07-29T00:00:00.000Z',
      url: 'https://api.test/files/object?key=uploads%2Fa.png',
      size: 12,
    })
    const model = await fileManagerOptions.values.toModel(managed)
    expect(model).toEqual({
      kind: 'file',
      path: 'uploads/a.png',
      url: 'https://api.test/files/object?key=uploads%2Fa.png',
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

  it('lists S3 assets through the app storage adapter', async () => {
    const signal = new AbortController().signal
    listFiles.mockResolvedValueOnce([{ id: 'uploads/report.txt', parentId: 'uploads/', kind: 'file', name: 'report.txt', mimeType: 'text/plain', size: 12 }])

    await expect(fileManagerOptions.operations.list({ parentId: 'uploads/', signal })).resolves.toMatchObject({
      data: [{ id: 'uploads/report.txt', name: 'report.txt', previewUrl: 'https://api.test/files/object?key=uploads%2Freport.txt' }],
      meta: { total: 1, totalPage: 1 },
    })
    expect(listFiles).toHaveBeenCalledWith('uploads/', signal)
  })

  it('deletes S3 assets through the app storage adapter', async () => {
    await fileManagerOptions.operations.remove?.({ id: 'uploads/report.txt' })

    expect(deleteFile).toHaveBeenCalledTimes(1)
    expect(deleteFile).toHaveBeenCalledWith('uploads/report.txt', undefined)
  })
})
