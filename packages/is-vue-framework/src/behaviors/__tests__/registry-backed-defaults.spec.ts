import { beforeEach, describe, expect, it, vi } from 'vitest'
import { configureFrameworkBehaviors, resetFrameworkBehaviorsForTests } from '@southneuhof/is-vue-framework/adapters/behaviors'
import { defaultTableGetData } from '../table'
import { defaultOnSubmit } from '../form'
import { defaultFileInputUpload } from '../fileInput'
import { defaultImageInputUpload, defaultImageURLResolver } from '../imageInput'

describe('registry-backed framework defaults', () => {
  beforeEach(() => {
    resetFrameworkBehaviorsForTests()
  })

  it('uses registered table behavior', async () => {
    const getData = vi.fn(async () => ({ data: [{ id: 1 }], total: 1, totalPage: 1 }))
    configureFrameworkBehaviors({ table: { getData } })

    await expect(defaultTableGetData('users', { page: 1 })).resolves.toEqual({ data: [{ id: 1 }], total: 1, totalPage: 1 })
    expect(getData).toHaveBeenCalledWith('users', { page: 1 })
  })

  it('throws when required table behavior is missing', async () => {
    await expect(defaultTableGetData('users')).rejects.toThrow('Missing behavior: table.getData')
  })

  it('uses registered form submit behavior', async () => {
    const onSubmit = vi.fn(async () => ({ ok: true }))
    configureFrameworkBehaviors({ form: { onSubmit } })

    await expect(defaultOnSubmit({ payload: { a: 1 }, method: 'post', targetAPI: 'users', type: 'create' })).resolves.toEqual({ ok: true })
    expect(onSubmit).toHaveBeenCalledWith({ payload: { a: 1 }, method: 'post', targetAPI: 'users', type: 'create' })
  })

  it('prefers registered file-manager upload behavior for file input uploads', async () => {
    const file = new File(['file'], 'document.pdf', { type: 'application/pdf' })
    const onUploadProgress = vi.fn()
    const uploadFile = vi.fn(async () => ({ url: '/document.pdf' }))
    const legacyUpload = vi.fn(async () => ({ url: '/legacy.pdf' }))
    configureFrameworkBehaviors({ fileManager: { uploadFile }, fileInput: { fileUpload: legacyUpload } })

    await expect(defaultFileInputUpload(file, 'documents', onUploadProgress)).resolves.toEqual({ url: '/document.pdf' })
    expect(uploadFile).toHaveBeenCalledWith(file, 'documents', onUploadProgress)
    expect(legacyUpload).not.toHaveBeenCalled()
  })

  it('falls back to registered legacy file input upload behavior', async () => {
    const file = new File(['file'], 'document.pdf', { type: 'application/pdf' })
    const fileUpload = vi.fn(async () => ({ url: '/legacy.pdf' }))
    configureFrameworkBehaviors({ fileInput: { fileUpload } })

    await expect(defaultFileInputUpload(file)).resolves.toEqual({ url: '/legacy.pdf' })
  })

  it('throws when required file input upload behavior is missing', async () => {
    const file = new File(['file'], 'document.pdf', { type: 'application/pdf' })

    await expect(defaultFileInputUpload(file)).rejects.toThrow('Missing behavior: fileManager.uploadFile or fileInput.fileUpload')
  })

  it('prefers registered file-manager upload behavior for image input uploads', async () => {
    const file = new File(['image'], 'image.png', { type: 'image/png' })
    const onUploadProgress = vi.fn()
    const uploadFile = vi.fn(async () => ({ url: '/image.png' }))
    const legacyUpload = vi.fn(async () => ({ url: '/legacy.png' }))
    configureFrameworkBehaviors({ fileManager: { uploadFile }, imageInput: { fileUpload: legacyUpload } })

    await expect(defaultImageInputUpload(file, 'images', onUploadProgress)).resolves.toEqual({ url: '/image.png' })
    expect(uploadFile).toHaveBeenCalledWith(file, 'images', onUploadProgress)
    expect(legacyUpload).not.toHaveBeenCalled()
  })

  it('falls back to registered legacy image input upload behavior', async () => {
    const file = new File(['image'], 'image.png', { type: 'image/png' })
    const fileUpload = vi.fn(async () => ({ url: '/legacy.png' }))
    configureFrameworkBehaviors({ imageInput: { fileUpload } })

    await expect(defaultImageInputUpload(file)).resolves.toEqual({ url: '/legacy.png' })
  })

  it('throws when required image input upload behavior is missing', async () => {
    const file = new File(['image'], 'image.png', { type: 'image/png' })

    await expect(defaultImageInputUpload(file)).rejects.toThrow('Missing behavior: fileManager.uploadFile or imageInput.fileUpload')
  })

  it('defaults image URL resolver to object contract url field', () => {
    expect(defaultImageURLResolver({ path: '/storage/public/a.jpg', data: '/storage/public/a.jpg', url: 'https://landing.example.com/storage/public/a.jpg' })).toEqual({
      imageURL: 'https://landing.example.com/storage/public/a.jpg',
      thumbnailURL: 'https://landing.example.com/storage/public/a.jpg',
    })
  })
})
