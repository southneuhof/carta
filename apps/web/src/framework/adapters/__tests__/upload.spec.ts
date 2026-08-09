import { describe, expect, it, vi } from 'vitest'

const uploadFile = vi.fn()
vi.mock('../storage', () => ({ uploadFile }))

const { inputUpload, toInputAssetModel } = await import('../upload')

describe('input upload adapter', () => {
  it('forwards progress and AbortSignal; returns strict model', async () => {
    const signal = new AbortController().signal
    const progress = vi.fn()
    const file = new File(['x'], 'a.txt', { type: 'text/plain' })
    uploadFile.mockResolvedValue({ key: 'uploads/a.txt', url: 'https://api.test/files/object?key=uploads%2Fa.txt', file })
    const result = await inputUpload(file, { destination: 'documents', signal, onProgress: progress })
    expect(uploadFile).toHaveBeenCalledWith(file, { signal, onProgress: progress })
    uploadFile.mock.calls[0][1].onProgress({ loaded: 1, total: 1 })
    expect(progress).toHaveBeenCalledWith({ loaded: 1, total: 1 })
    expect(toInputAssetModel(result)).toEqual({ kind: 'file', path: 'uploads/a.txt', url: 'https://api.test/files/object?key=uploads%2Fa.txt', name: 'a.txt', size: 1, mimeType: 'text/plain' })
  })

  it('rejects malformed response', async () => {
    uploadFile.mockResolvedValue({ key: '', url: '', file: new File(['x'], 'a.txt') })
    await expect(inputUpload(new File(['x'], 'a.txt'), {})).rejects.toThrow('path and url')
  })
})
