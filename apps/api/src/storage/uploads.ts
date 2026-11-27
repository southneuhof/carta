import { randomUUID } from 'node:crypto'
import type { Context } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { HttpError, notFound, validationError } from '@southneuhof/sprindle'
import type { z } from 'zod/v4'
import { deleteObject, getObjectBytes, putObject } from './s3'

export type UploadFormat = 'png' | 'jpg' | 'webp' | 'pdf'

export type ValidatedUpload = {
  field: string
  extension: UploadFormat
  contentType: string
  bytes: Buffer
  size: number
}

export type MultipartFileRule = {
  allow: readonly UploadFormat[]
  maxCount?: number
  maxBytes?: number
  required?: boolean
  message?: string
}

export type ReadMultipartOptions<
  TSchema extends z.ZodType,
  TFiles extends Record<string, MultipartFileRule>,
> = {
  schema: TSchema
  files: TFiles
  dataField?: string
  maxTotalBytes?: number
}

export type MultipartResult<
  TSchema extends z.ZodType,
  TFiles extends Record<string, MultipartFileRule>,
> = {
  data: z.output<TSchema>
  files: { [K in keyof TFiles]: ValidatedUpload[] }
}

const DEFAULT_MAX_FILE_BYTES = 5 * 1024 * 1024
const DEFAULT_DATA_OVERHEAD_BYTES = 256 * 1024

const CONTENT_TYPES: Record<UploadFormat, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  pdf: 'application/pdf',
}

function detectUploadFormat(bytes: Buffer): UploadFormat | undefined {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'png'
  }
  if (bytes.length >= 3 && bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return 'jpg'
  }
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp'
  }
  if (bytes.length >= 5 && bytes.toString('ascii', 0, 5) === '%PDF-') {
    return 'pdf'
  }
  return undefined
}

function defaultMaxTotalBytes(rules: Record<string, MultipartFileRule>): number {
  let total = DEFAULT_DATA_OVERHEAD_BYTES
  for (const rule of Object.values(rules)) {
    const count = rule.maxCount ?? 1
    const size = rule.maxBytes ?? DEFAULT_MAX_FILE_BYTES
    total += count * size
  }
  return total
}

function isFileEntry(value: unknown): value is File {
  return typeof value === 'object' && value !== null && 'arrayBuffer' in value && 'size' in value && typeof (value as File).arrayBuffer === 'function'
}

export async function readMultipart<
  TSchema extends z.ZodType,
  TFiles extends Record<string, MultipartFileRule>,
>(
  c: Context,
  options: ReadMultipartOptions<TSchema, TFiles>,
): Promise<MultipartResult<TSchema, TFiles>> {
  const maxSize = options.maxTotalBytes ?? defaultMaxTotalBytes(options.files)
  const enforceLimit = bodyLimit({
    maxSize,
    onError: () => {
      throw new HttpError(413, 'payload_too_large', 'The upload is too large.')
    },
  })
  await enforceLimit(c, async () => {})

  let form: FormData
  try {
    form = await c.req.formData()
  } catch {
    throw validationError('Send the payload and files as multipart form data.')
  }

  const dataField = options.dataField ?? 'data'
  let rawData: unknown
  try {
    const raw = form.get(dataField)
    if (typeof raw !== 'string') throw new Error()
    rawData = JSON.parse(raw)
  } catch {
    throw validationError([{ field: dataField, message: 'The form data is missing or invalid.' }])
  }

  const data = options.schema.parse(rawData)
  const validatedFiles = {} as { [K in keyof TFiles]: ValidatedUpload[] }

  for (const [field, rule] of Object.entries(options.files) as Array<[keyof TFiles & string, MultipartFileRule]>) {
    const entries = form.getAll(field)
    const maxCount = rule.maxCount ?? 1
    const maxBytes = rule.maxBytes ?? DEFAULT_MAX_FILE_BYTES
    if (rule.required && entries.length === 0) {
      throw validationError([{ field, message: rule.message ?? `Attach a file for ${field}.` }])
    }
    if (entries.length > maxCount) {
      throw validationError([{ field, message: rule.message ?? `Attach at most ${maxCount} file${maxCount === 1 ? '' : 's'}.` }])
    }

    const uploads: ValidatedUpload[] = []
    for (const entry of entries) {
      if (!isFileEntry(entry) || entry.size <= 0 || entry.size > maxBytes) {
        throw validationError([{ field, message: rule.message ?? `Each file must be ${Math.round(maxBytes / (1024 * 1024))} MB or smaller.` }])
      }
      const bytes = Buffer.from(await entry.arrayBuffer())
      const format = detectUploadFormat(bytes)
      if (!format || !rule.allow.includes(format)) {
        throw validationError([{ field, message: rule.message ?? `Unsupported file type. Allowed: ${rule.allow.join(', ')}.` }])
      }
      uploads.push({
        field,
        extension: format,
        contentType: CONTENT_TYPES[format],
        bytes,
        size: bytes.length,
      })
    }
    validatedFiles[field] = uploads
  }

  return { data, files: validatedFiles }
}

export async function withUploadedObjects<
  TFiles extends Record<string, readonly ValidatedUpload[]>,
  TResult,
>(
  files: TFiles,
  options: {
    prefix: string
    save: (keys: { [K in keyof TFiles]: string[] }) => Promise<TResult>
  },
): Promise<TResult> {
  const prefix = options.prefix.replace(/^\/+|\/+$/g, '')
  if (!prefix) throw new Error('Upload prefix is required.')
  const uploadedKeys: string[] = []
  const keysByField = {} as { [K in keyof TFiles]: string[] }

  try {
    for (const [field, entries] of Object.entries(files) as Array<[keyof TFiles & string, readonly ValidatedUpload[]]>) {
      const fieldKeys: string[] = []
      for (const file of entries) {
        const key = `${prefix}/${randomUUID()}.${file.extension}`
        await putObject(key, file.bytes, file.contentType)
        uploadedKeys.push(key)
        fieldKeys.push(key)
      }
      keysByField[field] = fieldKeys
    }
    return await options.save(keysByField)
  } catch (error) {
    if (uploadedKeys.length > 0) {
      await Promise.allSettled(uploadedKeys.map((key) => deleteObject(key)))
    }
    throw error
  }
}

function isMissingObjectError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const record = error as { name?: string; Code?: string; $metadata?: { httpStatusCode?: number } }
  return record.name === 'NoSuchKey' || record.Code === 'NoSuchKey' || record.$metadata?.httpStatusCode === 404
}

export async function streamStoredObject(
  key: string | undefined,
  options: { visibility: 'public' | 'private'; cacheControl?: string },
): Promise<Response> {
  if (!key) throw notFound()
  const extension = key.split('.').pop()?.toLowerCase() as UploadFormat | undefined
  if (!extension || !(extension in CONTENT_TYPES)) throw notFound()

  let bytes: Uint8Array
  try {
    bytes = await getObjectBytes(key)
  } catch (error) {
    if (isMissingObjectError(error)) throw notFound()
    throw error
  }

  const cacheControl = options.cacheControl ?? (options.visibility === 'public' ? 'public, max-age=3600' : 'private, no-store')
  return new Response(Buffer.from(bytes), {
    headers: {
      'Content-Type': CONTENT_TYPES[extension],
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': cacheControl,
    },
  })
}
