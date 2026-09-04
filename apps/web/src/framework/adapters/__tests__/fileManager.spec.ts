import { describe, expect, it, vi } from 'vitest'
import { canonicalAsset, fileManagerOptions } from '../fileManager'

const { listFiles, uploadFile, deleteFile } = vi.hoisted(() => ({
  listFiles: vi.fn(),
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
}))
vi.mock('../storage', () => ({ deleteFile, listFiles, uploadFile }))

const asset = {
  kind: 'file' as const,
  id: 'uploads/a.png',
  url: 'https://api.test/files/object?key=uploads%2Fa.png',
  name: 'a.png',
  mimeType: 'image/png',
  size: 12,
  updatedAt: '2026-07-29T00:00:00.000Z',
}

describe('file manager value adapter', () => {
  it('round trips an exact API asset without aliases', async () => {
    const managed = canonicalAsset(asset)
    const model = await fileManagerOptions.values.toModel(managed)
    expect(model).toEqual(asset)
    await expect(fileManagerOptions.values.fromModel(model)).resolves.toMatchObject({
      kind: 'file',
      id: asset.id,
      url: asset.url,
      name: 'a.png',
      mimeType: 'image/png',
    })
    expect(() => canonicalAsset({ path: asset.id } as never)).toThrow()
  })

  it('lists API assets through the app storage adapter', async () => {
    const signal = new AbortController().signal
    listFiles.mockResolvedValueOnce([asset])

    await expect(fileManagerOptions.operations.list({ parentId: 'uploads/', signal })).resolves.toMatchObject({
      data: [{ id: asset.id, name: 'a.png', previewUrl: asset.url }],
      meta: { total: 1, totalPage: 1 },
    })
    expect(listFiles).toHaveBeenCalledWith('uploads/', signal)
  })

  it('returns an uploaded API asset and keeps folders out of model values', async () => {
    uploadFile.mockResolvedValueOnce(asset)
    const uploaded = await fileManagerOptions.operations.upload?.(new File(['x'], 'a.png'), { parentId: 'uploads/' })
    expect(uploaded).toMatchObject({ id: asset.id, previewUrl: asset.url })
    await expect(fileManagerOptions.values.toModel({ kind: 'folder', id: 'uploads/folder/', name: 'folder' })).rejects.toThrow()
  })

  it('deletes S3 assets through the app storage adapter', async () => {
    await fileManagerOptions.operations.remove?.({ id: asset.id })

    expect(deleteFile).toHaveBeenCalledTimes(1)
    expect(deleteFile).toHaveBeenCalledWith(asset.id, undefined)
  })
})
