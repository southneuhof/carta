import { describe, expect, it, vi } from 'vitest'
import { defaultFileInputUpload, defaultImageInputUpload, defaultImageURLResolver, defaultOnSubmit, defaultTableGetData, getTableFieldTypes } from '../../runtimeDefaults'

describe('runtime defaults', () => {
  it('uses supplied table runtime', async () => {
    const getData = vi.fn(async () => ({ data: [{ id: 1 }], total: 1, totalPage: 1 }))
    await expect(defaultTableGetData('users', { page: 1 }, { getData })).resolves.toEqual({ data: [{ id: 1 }], total: 1, totalPage: 1 })
    expect(getData).toHaveBeenCalledWith('users', { page: 1 })
  })

  it('reads supplied renderer map', () => {
    const image = () => null
    expect(getTableFieldTypes({ fieldTypes: { image } }).image).toBe(image)
  })

  it('throws when required runtime capability is missing', async () => {
    await expect(defaultTableGetData('users', undefined, {})).rejects.toThrow('Missing runtime capability: table.getData')
  })

  it('uses supplied form runtime', async () => {
    const onSubmit = vi.fn(async () => ({ ok: true }))
    await expect(defaultOnSubmit({ payload: {}, method: 'post', targetAPI: 'users', type: 'create' }, { onSubmit })).resolves.toEqual({ ok: true })
  })

  it('prefers file-manager upload runtime', async () => {
    const uploadFile = vi.fn(async () => ({ url: '/file' }))
    const legacy = vi.fn()
    const file = new File(['file'], 'file.txt')
    await expect(defaultFileInputUpload(file, 'docs', undefined, { fileManager: { uploadFile }, fileInput: { fileUpload: legacy } })).resolves.toEqual({ url: '/file' })
    expect(legacy).not.toHaveBeenCalled()
  })

  it('keeps image URL pure fallback', () => {
    expect(defaultImageURLResolver({ url: 'https://example.test/a.jpg' })).toEqual({ imageURL: 'https://example.test/a.jpg', thumbnailURL: 'https://example.test/a.jpg' })
  })

  it('uses supplied image runtime', async () => {
    const fileUpload = vi.fn(async () => ({ url: '/image' }))
    const file = new File(['image'], 'image.png')
    await expect(defaultImageInputUpload(file, undefined, undefined, { imageInput: { fileUpload } })).resolves.toEqual({ url: '/image' })
  })
})
