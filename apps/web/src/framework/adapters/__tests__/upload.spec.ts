import { describe, expect, it, vi } from 'vitest'

const fileUpload = vi.fn()
vi.mock('@/utils/services', () => ({ default: { fileUpload } }))

const { inputUpload, toInputAssetModel } = await import('../upload')

describe('input upload adapter', () => {
  it('forwards destination, progress, and AbortSignal; returns strict model', async () => {
    fileUpload.mockResolvedValue({ path: '/files/a.txt', url: 'https://cdn/a.txt' })
    const signal = new AbortController().signal
    const progress = vi.fn()
    const file = new File(['x'], 'a.txt', { type: 'text/plain' })
    const result = await inputUpload(file, { destination: 'documents', signal, onProgress: progress })
    expect(fileUpload).toHaveBeenCalledWith(file, 'documents', expect.any(Function), { init: { signal } })
    const relay = fileUpload.mock.calls[0][2]
    relay({ loaded: 1, total: 1 })
    expect(progress).toHaveBeenCalledWith({ loaded: 1, total: 1 })
    expect(toInputAssetModel(result)).toEqual({ kind: 'file', path: '/files/a.txt', url: 'https://cdn/a.txt', name: 'a.txt', size: 1, mimeType: 'text/plain' })
  })

  it('rejects malformed response', async () => {
    fileUpload.mockResolvedValue({ path: '' })
    await expect(inputUpload(new File(['x'], 'a.txt'), {})).rejects.toThrow('path and url')
  })
})
