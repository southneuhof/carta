import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ send: vi.fn() }))

vi.mock('@aws-sdk/client-s3', () => {
  class Command {
    input: unknown
    constructor(input: unknown) {
      this.input = input
    }
  }
  return {
    CopyObjectCommand: Command,
    DeleteObjectCommand: Command,
    GetObjectCommand: Command,
    ListObjectsV2Command: Command,
    PutObjectCommand: Command,
    S3Client: class {
      send = mocks.send
    },
  }
})

vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: vi.fn() }))

const { copyObject, createPresignedUpload, deleteObject, getObjectBytes, putObject } = await import('./s3')

describe('S3 storage owner', () => {
  beforeAll(() => {
    process.env.S3_ENDPOINT = 'http://s3.test'
    process.env.S3_BUCKET = 'test-bucket'
    process.env.S3_ACCESS_KEY = 'test-access'
    process.env.S3_SECRET_KEY = 'test-secret'
  })

  beforeEach(() => mocks.send.mockReset())

  it('puts the supplied object in the configured bucket', async () => {
    const body = Buffer.from('pdf')
    await putObject('uploads/certificate.pdf', body, 'application/pdf')

    expect(mocks.send).toHaveBeenCalledTimes(1)
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({
      input: {
        Bucket: 'test-bucket',
        Key: 'uploads/certificate.pdf',
        Body: body,
        ContentType: 'application/pdf',
      },
    }))
  })

  it('exposes copy support for link-scoped upload promotion', () => {
    expect(copyObject).toBeTypeOf('function')
    expect(createPresignedUpload).toBeTypeOf('function')
    expect(deleteObject).toBeTypeOf('function')
  })

  it('reads stored object bytes', async () => {
    const bytes = new Uint8Array([1, 2, 3])
    mocks.send.mockResolvedValueOnce({ Body: { transformToByteArray: vi.fn().mockResolvedValue(bytes) } })
    await expect(getObjectBytes('uploads/import.xlsx')).resolves.toEqual(bytes)
  })
})
