import type { UploadContext, UploadProgress } from '@southneuhof/is-vue-framework'
import { apiUrl, rpc } from '../rpc'

type SignedUpload = {
  key: string
  uploadUrl: string
  downloadUrl: string
  method: 'PUT'
  headers: Record<string, string>
}

export type StoredFile = {
  id: string
  parentId: string | null
  kind: 'file' | 'folder'
  name: string
  mimeType?: string
  size?: number
  updatedAt?: string
  url?: string
}

function responseMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback
  const record = payload as Record<string, unknown>
  const message = typeof record.message === 'string' ? record.message : typeof record.error === 'string' ? record.error : undefined
  return message ? message.slice(0, 200) : fallback
}

async function presign(file: File, signal?: AbortSignal): Promise<SignedUpload> {
  const response = await rpc.files['presigned-url'].$post(
    {
      json: {
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
      },
    },
    { init: { signal } }
  )
  const payload = await response.json().catch(() => undefined)
  if (!response.ok) throw new Error(responseMessage(payload, 'File upload could not be prepared.'))

  const data = payload && typeof payload === 'object' && 'data' in payload ? payload.data : undefined
  if (!data || typeof data !== 'object') throw new Error('File upload configuration is invalid.')
  const signed = data as Record<string, unknown>
  if (
    typeof signed.key !== 'string' ||
    !signed.key ||
    typeof signed.uploadUrl !== 'string' ||
    !signed.uploadUrl ||
    typeof signed.downloadUrl !== 'string' ||
    !signed.downloadUrl ||
    signed.method !== 'PUT' ||
    !signed.headers ||
    typeof signed.headers !== 'object' ||
    Array.isArray(signed.headers) ||
    !Object.values(signed.headers).every((value) => typeof value === 'string')
  )
    throw new Error('File upload configuration is invalid.')

  return {
    key: signed.key,
    uploadUrl: signed.uploadUrl,
    downloadUrl: signed.downloadUrl,
    method: 'PUT',
    headers: signed.headers as Record<string, string>,
  }
}

function uploadWithFetch(file: File, signed: SignedUpload, signal?: AbortSignal) {
  return fetch(signed.uploadUrl, {
    method: signed.method,
    headers: signed.headers,
    body: file,
    signal,
  })
    .then((response) => {
      if (!response.ok) throw new Error(`Direct file upload failed (status ${response.status}).`)
    })
    .catch((error) => {
      if (error instanceof Error && (error.message.startsWith('Direct file upload failed') || error.name === 'AbortError')) throw error
      throw new Error('Direct file upload failed due to a network error.')
    })
}

function uploadWithProgress(file: File, signed: SignedUpload, signal: AbortSignal | undefined, onProgress: (progress: UploadProgress) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    let settled = false
    const cleanup = () => signal?.removeEventListener('abort', abort)
    const fail = (error: Error) => {
      if (settled) return
      settled = true
      cleanup()
      reject(error)
    }
    const succeed = () => {
      if (settled) return
      settled = true
      cleanup()
      onProgress({ loaded: file.size, total: file.size })
      resolve()
    }
    const abort = () => xhr.abort()

    if (signal?.aborted) {
      fail(new Error('Direct file upload was aborted.'))
      return
    }
    signal?.addEventListener('abort', abort, { once: true })
    xhr.upload.addEventListener('progress', (event) => {
      const total = event.lengthComputable && event.total > 0 ? event.total : file.size
      onProgress({ loaded: Math.min(event.loaded, total), total })
    })
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) succeed()
      else fail(new Error(`Direct file upload failed (status ${xhr.status}).`))
    })
    xhr.addEventListener('error', () => fail(new Error('Direct file upload failed due to a network error.')))
    xhr.addEventListener('abort', () => fail(new Error('Direct file upload was aborted.')))
    xhr.addEventListener('timeout', () => fail(new Error('Direct file upload timed out.')))

    try {
      xhr.open(signed.method, signed.uploadUrl)
      for (const [name, value] of Object.entries(signed.headers)) xhr.setRequestHeader(name, value)
      xhr.send(file)
    } catch {
      fail(new Error('Direct file upload could not be started.'))
    }
  })
}

export async function uploadFile(file: File, context: UploadContext = {}) {
  // ponytail: the API owns one uploads prefix; add destinations when storage partitions exist.
  const signed = await presign(file, context.signal)
  if (context.onProgress) await uploadWithProgress(file, signed, context.signal, context.onProgress)
  else await uploadWithFetch(file, signed, context.signal)
  return { key: signed.key, url: signed.downloadUrl, file }
}

export async function listFiles(prefix: string, signal?: AbortSignal): Promise<StoredFile[]> {
  const response = await rpc.files.$get({ query: { prefix } }, { init: { signal } })
  const payload = await response.json().catch(() => undefined)
  if (!response.ok) throw new Error(responseMessage(payload, 'Files could not be loaded.'))
  const data = payload && typeof payload === 'object' && 'data' in payload ? payload.data : undefined
  if (!Array.isArray(data)) throw new Error('File list response is invalid.')
  return data as StoredFile[]
}

export async function deleteFile(key: string, signal?: AbortSignal) {
  const response = await rpc.files.object.$delete({ json: { key } }, { init: { signal } })
  const payload = await response.json().catch(() => undefined)
  if (!response.ok) throw new Error(responseMessage(payload, 'File could not be deleted.'))
}

export function fileUrl(key: string) {
  const base = apiUrl || (typeof window === 'undefined' ? 'http://localhost/' : window.location.origin)
  const url = new URL('files/object', base)
  url.searchParams.set('key', key)
  return url.toString()
}
