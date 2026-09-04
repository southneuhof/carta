import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import { assertE2eStorageTarget } from './e2e-target'

function requiredEnv(name: 'S3_ENDPOINT' | 'S3_ACCESS_KEY' | 'S3_SECRET_KEY') {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required.`)
  return value
}

async function listAllKeys(client: S3Client, bucket: string) {
  const keys: string[] = []
  let continuationToken: string | undefined
  do {
    const result = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      })
    )
    for (const object of result.Contents ?? []) {
      if (object.Key) keys.push(object.Key)
    }
    continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined
    if (result.IsTruncated && !continuationToken) throw new Error('E2E storage listing did not return a continuation token.')
  } while (continuationToken)
  return keys
}

export async function clearE2eStorage() {
  const bucket = process.env.S3_BUCKET
  assertE2eStorageTarget(bucket)
  const endpoint = requiredEnv('S3_ENDPOINT')
  const parsedEndpoint = new URL(endpoint)
  if (!['http:', 'https:'].includes(parsedEndpoint.protocol)) throw new Error('S3_ENDPOINT must use http or https.')
  const client = new S3Client({
    endpoint,
    forcePathStyle: true,
    region: 'us-east-1',
    credentials: {
      accessKeyId: requiredEnv('S3_ACCESS_KEY'),
      secretAccessKey: requiredEnv('S3_SECRET_KEY'),
    },
  })
  const keys = await listAllKeys(client, bucket)
  for (let index = 0; index < keys.length; index += 1000) {
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: keys.slice(index, index + 1000).map((Key) => ({ Key })),
        },
      })
    )
  }
  if ((await listAllKeys(client, bucket)).length) throw new Error('E2E storage bucket is not empty after clear.')
}

clearE2eStorage()
  .then(() => {
    console.log('E2E storage clear complete.')
  })
  .catch((error: unknown) => {
    throw error
  })
