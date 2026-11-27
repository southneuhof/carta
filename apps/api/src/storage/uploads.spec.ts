import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Hono } from 'hono'
import { HttpError } from '@southneuhof/sprindle'
import { z } from 'zod/v4'
import { onError } from '../unique-violation'

const { putObjectMock, deleteObjectMock, getObjectBytesMock } = vi.hoisted(() => ({
  putObjectMock: vi.fn(),
  deleteObjectMock: vi.fn(),
  getObjectBytesMock: vi.fn(),
}))

vi.mock('./s3', () => ({
  putObject: putObjectMock,
  deleteObject: deleteObjectMock,
  getObjectBytes: getObjectBytesMock,
}))

import { readMultipart, streamStoredObject, withUploadedObjects } from './uploads'

const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00])
const JPG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
const PDF_BYTES = Buffer.from('%PDF-1.7\n')

describe('storage/uploads', () => {
  beforeEach(() => {
    putObjectMock.mockReset()
    deleteObjectMock.mockReset()
    getObjectBytesMock.mockReset()
  })

  it('parses multipart JSON and magic-byte verified files and rejects spoofed or excessive uploads', async () => {
    const app = new Hono()
    app.onError(onError)
    app.post('/upload', async (c) => {
      const result = await readMultipart(c, {
        schema: z.object({ title: z.string().min(1) }),
        files: {
          photos: { allow: ['png', 'jpg'], maxCount: 2, maxBytes: 1024 },
          signature: { allow: ['png'], required: true, maxCount: 1, maxBytes: 1024, message: 'Draw a signature.' },
        },
      })
      return c.json({
        title: result.data.title,
        photoFormats: result.files.photos.map((file) => file.extension),
        signatureFormat: result.files.signature[0]?.extension,
      })
    })

    const validForm = new FormData()
    validForm.set('data', JSON.stringify({ title: 'Valve leak' }))
    validForm.append('photos', new File([PNG_BYTES], 'a.png', { type: 'image/png' }))
    validForm.append('photos', new File([JPG_BYTES], 'b.jpg', { type: 'image/jpeg' }))
    validForm.set('signature', new File([PNG_BYTES], 'sig.png', { type: 'image/png' }))
    const ok = await app.request('/upload', { method: 'POST', body: validForm })
    expect(ok.status).toBe(200)
    await expect(ok.json()).resolves.toEqual({
      title: 'Valve leak',
      photoFormats: ['png', 'jpg'],
      signatureFormat: 'png',
    })

    const spoofedForm = new FormData()
    spoofedForm.set('data', JSON.stringify({ title: 'Spoofed' }))
    spoofedForm.append('photos', new File([PDF_BYTES], 'fake.png', { type: 'image/png' }))
    spoofedForm.set('signature', new File([PNG_BYTES], 'sig.png', { type: 'image/png' }))
    const spoofed = await app.request('/upload', { method: 'POST', body: spoofedForm })
    expect(spoofed.status).toBe(400)
    await expect(spoofed.json()).resolves.toMatchObject({
      error: 'validation_error',
      issues: [{ field: 'photos' }],
    })

    const missingSignature = new FormData()
    missingSignature.set('data', JSON.stringify({ title: 'Unsigned' }))
    const unsigned = await app.request('/upload', { method: 'POST', body: missingSignature })
    expect(unsigned.status).toBe(400)
    await expect(unsigned.json()).resolves.toMatchObject({
      error: 'validation_error',
      issues: [{ field: 'signature', message: 'Draw a signature.' }],
    })
  })

  it('uploads staged files under the prefix and deletes all uploaded objects when save throws', async () => {
    putObjectMock.mockResolvedValue(undefined)
    deleteObjectMock.mockResolvedValue(undefined)
    const files = {
      photos: [
        { field: 'photos', extension: 'png' as const, contentType: 'image/png', bytes: PNG_BYTES, size: PNG_BYTES.length },
        { field: 'photos', extension: 'jpg' as const, contentType: 'image/jpeg', bytes: JPG_BYTES, size: JPG_BYTES.length },
      ],
      signature: [
        { field: 'signature', extension: 'png' as const, contentType: 'image/png', bytes: PNG_BYTES, size: PNG_BYTES.length },
      ],
    }

    const saved = await withUploadedObjects(files, {
      prefix: '/field-ops/',
      save: async (keys) => ({ id: 'ins-1', keys }),
    })
    expect(saved.keys.photos).toHaveLength(2)
    expect(saved.keys.photos[0]).toMatch(/^field-ops\/[0-9a-f-]+\.png$/)
    expect(saved.keys.photos[1]).toMatch(/^field-ops\/[0-9a-f-]+\.jpg$/)
    expect(saved.keys.signature[0]).toMatch(/^field-ops\/[0-9a-f-]+\.png$/)
    expect(putObjectMock).toHaveBeenCalledTimes(3)
    expect(deleteObjectMock).not.toHaveBeenCalled()

    putObjectMock.mockClear()
    const uploadedOnFailure: string[] = []
    putObjectMock.mockImplementation(async (key: string) => {
      uploadedOnFailure.push(key)
    })

    await expect(
      withUploadedObjects(files, {
        prefix: 'field-ops',
        save: async () => {
          throw new HttpError(409, 'invalid_transition', 'Stale record.')
        },
      }),
    ).rejects.toMatchObject({ status: 409, code: 'invalid_transition' })

    expect(deleteObjectMock).toHaveBeenCalledTimes(3)
    expect(deleteObjectMock.mock.calls.map(([key]) => key)).toEqual(uploadedOnFailure)
  })

  it('streams stored objects with nosniff and visibility-matched caching and rejects missing keys', async () => {
    getObjectBytesMock.mockResolvedValueOnce(PNG_BYTES)
    const publicResponse = await streamStoredObject('field-ops/photo.png', { visibility: 'public' })
    expect(publicResponse.status).toBe(200)
    expect(publicResponse.headers.get('Content-Type')).toBe('image/png')
    expect(publicResponse.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(publicResponse.headers.get('Cache-Control')).toBe('public, max-age=3600')
    expect(Buffer.from(await publicResponse.arrayBuffer())).toEqual(PNG_BYTES)

    getObjectBytesMock.mockResolvedValueOnce(PDF_BYTES)
    const privateResponse = await streamStoredObject('field-ops/doc.pdf', { visibility: 'private' })
    expect(privateResponse.headers.get('Content-Type')).toBe('application/pdf')
    expect(privateResponse.headers.get('Cache-Control')).toBe('private, no-store')

    getObjectBytesMock.mockRejectedValueOnce(Object.assign(new Error('missing'), { name: 'NoSuchKey' }))
    await expect(streamStoredObject('field-ops/missing.png', { visibility: 'private' })).rejects.toMatchObject({ status: 404 })
    await expect(streamStoredObject('field-ops/script.html', { visibility: 'private' })).rejects.toMatchObject({ status: 404 })
  })
})
