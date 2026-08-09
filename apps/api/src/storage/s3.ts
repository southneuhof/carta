import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const PRESIGNED_URL_EXPIRES_IN = 15 * 60

type Storage = {
  bucket: string
  client: S3Client
}

type PresignedUploadInput = {
  key: string
  contentType: string
}

let storage: Storage | undefined

function requiredEnv(name: 'S3_ENDPOINT' | 'S3_BUCKET' | 'S3_ACCESS_KEY' | 'S3_SECRET_KEY') {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required.`)
  return value
}

function getStorage(): Storage {
  if (storage) return storage

  const endpoint = requiredEnv('S3_ENDPOINT')
  const parsedEndpoint = new URL(endpoint)
  if (!['http:', 'https:'].includes(parsedEndpoint.protocol)) {
    throw new Error('S3_ENDPOINT must use http or https.')
  }

  storage = {
    bucket: requiredEnv('S3_BUCKET'),
    client: new S3Client({
      endpoint,
      forcePathStyle: true,
      region: 'us-east-1',
      credentials: {
        accessKeyId: requiredEnv('S3_ACCESS_KEY'),
        secretAccessKey: requiredEnv('S3_SECRET_KEY'),
      },
    }),
  }
  return storage
}

export async function createPresignedUpload({ key, contentType }: PresignedUploadInput) {
  const { bucket, client } = getStorage()
  const url = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn: PRESIGNED_URL_EXPIRES_IN },
  )

  return { url, expiresIn: PRESIGNED_URL_EXPIRES_IN }
}

export async function createPresignedDownload(key: string) {
  const { bucket, client } = getStorage()
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: PRESIGNED_URL_EXPIRES_IN },
  )

  return { url, expiresIn: PRESIGNED_URL_EXPIRES_IN }
}

export async function listObjects(prefix: string) {
  const { bucket, client } = getStorage()
  return client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, Delimiter: '/' }))
}

export async function deleteObject(key: string) {
  const { bucket, client } = getStorage()
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}
