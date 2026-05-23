export type FileAssetValue = {
  type: 'file' | 'folder'
  path: string
  data: string
  url: string
  filename: string
  size: number
  content_type: string
  updated_at?: string
  [key: string]: any
}

function toStoredAssetPath(value: unknown): string {
  if (typeof value !== 'string') return ''
  const input = value.trim()
  if (!input) return ''

  if (input.startsWith('/storage/')) return input

  try {
    const parsed = new URL(input)
    if (parsed.pathname.startsWith('/storage/')) return parsed.pathname
  } catch {
    return input
  }

  return input
}

function inferFilename(path: string, fallback = ''): string {
  const value = path || fallback
  return value.split('/').filter(Boolean).pop() || fallback
}

function inferContentType(filename: string, fallback = 'application/octet-stream'): string {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.svg')) return 'image/svg+xml'
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.txt')) return 'text/plain'
  return fallback
}

export function normalizeFileAssetValue(input: unknown): FileAssetValue | null {
  if (!input) return null

  const record = typeof input === 'string'
    ? { path: input, data: input, url: input }
    : (input as Record<string, any>)

  const rawData = typeof record.data === 'object' && record.data
    ? record.data
    : undefined
  const rawPath = record.path ?? rawData?.path ?? record.data ?? record.url ?? ''
  const path = toStoredAssetPath(rawPath)

  if (!path) return null

  const filename = String(record.filename ?? record.name ?? rawData?.filename ?? rawData?.name ?? inferFilename(path))
  const contentType = String(record.content_type ?? record.contentType ?? record.mime ?? record.type_mime ?? rawData?.content_type ?? rawData?.contentType ?? inferContentType(filename))
  const type = record.type === 'folder' || contentType === 'inode/directory' ? 'folder' : 'file'
  const url = String(record.url ?? rawData?.url ?? path)
  const sizeValue = Number(record.size ?? rawData?.size ?? 0)

  return {
    ...record,
    type,
    path,
    data: path,
    url,
    filename,
    size: Number.isFinite(sizeValue) ? sizeValue : 0,
    content_type: contentType,
    updated_at: record.updated_at ?? record.updatedAt ?? rawData?.updated_at ?? rawData?.updatedAt,
  }
}

export function normalizeFileAssetValues(input: unknown): FileAssetValue[] {
  const values = Array.isArray(input) ? input : [input]
  return values.map((item) => normalizeFileAssetValue(item)).filter((item): item is FileAssetValue => Boolean(item))
}

export function isImageAssetValue(input: unknown): boolean {
  return normalizeFileAssetValue(input)?.content_type.startsWith('image/') ?? false
}
