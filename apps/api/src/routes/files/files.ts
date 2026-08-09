import { randomUUID } from 'node:crypto'
import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import type { ModelRuntimeContext } from '@southneuhof/sprindle/model'
import type { TypedResponse } from 'hono'
import { z } from 'zod/v4'
import {
  createPresignedDownload,
  createPresignedUpload,
  deleteObject,
  listObjects,
} from '../../storage/s3'

// ponytail: fixed proof limit; make configurable when product limits vary.
const MAX_UPLOAD_SIZE = 25 * 1024 * 1024

const presignedUploadSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(127).regex(/^[^/\s]+\/[^/\s]+$/),
  size: z.number().int().positive().max(MAX_UPLOAD_SIZE),
})

const objectKeySchema = z.string().regex(/^uploads\/[a-z0-9-]+(?:\.[a-z0-9]{1,16})?$/)
const prefixSchema = z.string().regex(/^uploads(?:\/[a-zA-Z0-9._-]+)*\/$/)

type FileRecord = {
  id: string
  parentId: string | null
  kind: 'file' | 'folder'
  name: string
  mimeType?: string
  size?: number
  updatedAt?: string
  url?: string
}

type PresignedUploadInput = { json: z.input<typeof presignedUploadSchema> }
type PresignedUploadOutput = TypedResponse<{
  data: {
    key: string
    uploadUrl: string
    downloadUrl: string
    method: 'PUT'
    headers: { 'Content-Type': string }
    expiresIn: number
  }
}, 200, 'json'>
type FileListInput = { query: { prefix?: string } }
type FileListOutput = TypedResponse<{ data: FileRecord[]; meta: { total: number; totalPage: number } }, 200, 'json'>
const deleteObjectSchema = z.object({ key: objectKeySchema })
type DeleteObjectInput = { json: z.input<typeof deleteObjectSchema> }
type DeleteObjectOutput = TypedResponse<{ ok: true }, 200, 'json'>

function objectKey(filename: string) {
  const extension = filename.match(/\.([a-zA-Z0-9]{1,16})$/)?.[1]?.toLowerCase()
  return `uploads/${randomUUID()}${extension ? `.${extension}` : ''}`
}

function objectUrl(requestUrl: string, key: string) {
  const url = new URL('/files/object', requestUrl)
  url.searchParams.set('key', key)
  return url.toString()
}

function fileName(key: string, prefix: string) {
  return key.slice(prefix.length).replace(/\/$/, '').split('/').pop() || key
}

// ponytail: infer common list MIME types from extensions; use HeadObject metadata when exact filtering matters.
function mimeType(key: string) {
  const extension = key.split('.').pop()?.toLowerCase()
  return {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    txt: 'text/plain',
  }[extension ?? '']
}

export const listFilesRoute = defineRoute<FileListOutput, ModelRuntimeContext, 'get', '/files', FileListInput>({
  path: '/files',
  method: 'get',
  authorize: [authenticated()],
  action: async ({ c }) => {
    const prefix = prefixSchema.parse(c.req.query('prefix') || 'uploads/')
    const result = await listObjects(prefix)
    const folders: FileRecord[] = (result.CommonPrefixes ?? [])
      .flatMap(({ Prefix }) => Prefix ? [{
        id: Prefix,
        parentId: prefix,
        kind: 'folder' as const,
        name: fileName(Prefix, prefix),
      }] : [])
    const files: FileRecord[] = (result.Contents ?? [])
      .flatMap((item) => item.Key && item.Key !== prefix ? [{
        id: item.Key,
        parentId: prefix,
        kind: 'file' as const,
        name: fileName(item.Key, prefix),
        mimeType: mimeType(item.Key),
        size: item.Size,
        updatedAt: item.LastModified?.toISOString(),
        url: objectUrl(c.req.url, item.Key),
      }] : [])

    const data = [...folders, ...files]
    return c.json({ data, meta: { total: data.length, totalPage: 1 } })
  },
})

export const presignedUploadRoute = defineRoute<PresignedUploadOutput, ModelRuntimeContext, 'post', '/files/presigned-url', PresignedUploadInput>({
  path: '/files/presigned-url',
  method: 'post',
  authorize: [authenticated()],
  action: async (args) => {
    const input = presignedUploadSchema.parse(await args.c.req.json().catch(() => ({})))
    const key = objectKey(input.filename)
    const signed = await createPresignedUpload({ key, contentType: input.contentType })

    return args.c.json({
      data: {
        key,
        uploadUrl: signed.url,
        downloadUrl: objectUrl(args.c.req.url, key),
        method: 'PUT',
        headers: { 'Content-Type': input.contentType },
        expiresIn: signed.expiresIn,
      },
    })
  },
})

export const fileObjectRoute = defineRoute({
  path: '/files/object',
  method: 'get',
  authorize: [authenticated()],
  action: async ({ c }) => {
    const key = objectKeySchema.parse(c.req.query('key'))
    const signed = await createPresignedDownload(key)
    return c.redirect(signed.url)
  },
})

export const deleteFileRoute = defineRoute<DeleteObjectOutput, ModelRuntimeContext, 'delete', '/files/object', DeleteObjectInput>({
  path: '/files/object',
  method: 'delete',
  authorize: [authenticated()],
  action: async ({ c }) => {
    const input = deleteObjectSchema.parse(await c.req.json().catch(() => ({})))
    await deleteObject(input.key)
    return c.json({ ok: true })
  },
})

export default { listFilesRoute, presignedUploadRoute, fileObjectRoute, deleteFileRoute }
