import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteFile, fileUrl, listFiles, uploadFile } from '../storage'

const { post, get, remove } = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  remove: vi.fn(),
}))
vi.mock('../../rpc', () => ({
  apiUrl: 'https://api.test/',
  rpc: { files: { 'presigned-url': { $post: post }, $get: get, object: { $delete: remove } } },
}))

const originalFetch = globalThis.fetch
const originalXMLHttpRequest = globalThis.XMLHttpRequest
const fetchMock = vi.fn()

function jsonResponse(payload: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: vi.fn().mockResolvedValue(payload) }
}

describe('web S3 storage adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.fetch = fetchMock as typeof fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    globalThis.XMLHttpRequest = originalXMLHttpRequest
  })

  it('requests a signed URL, sends signed headers directly, and returns a stable URL', async () => {
    const file = new File(['x'], 'report.txt', { type: 'text/plain' })
    const signal = new AbortController().signal
    post.mockResolvedValueOnce(
      jsonResponse({
        data: {
          key: 'uploads/report.txt',
          uploadUrl: 'https://minio.test/upload',
          downloadUrl: 'https://api.test/files/object?key=uploads%2Freport.txt',
          method: 'PUT',
          headers: { 'Content-Type': 'text/plain' },
        },
      })
    )
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200 })

    await expect(uploadFile(file, { signal })).resolves.toMatchObject({
      key: 'uploads/report.txt',
      url: 'https://api.test/files/object?key=uploads%2Freport.txt',
      file,
    })
    expect(post).toHaveBeenCalledWith({ json: { filename: 'report.txt', contentType: 'text/plain', size: 1 } }, { init: { signal } })
    expect(fetchMock).toHaveBeenCalledWith('https://minio.test/upload', {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: file,
      signal,
    })
  })

  it('uses XHR for progress and sends the signed header', async () => {
    const file = new File(['x'], 'report.txt', { type: 'text/plain' })
    post.mockResolvedValueOnce(
      jsonResponse({
        data: {
          key: 'uploads/report.txt',
          uploadUrl: 'https://minio.test/upload',
          downloadUrl: 'https://api.test/files/object?key=uploads%2Freport.txt',
          method: 'PUT',
          headers: { 'Content-Type': 'text/plain' },
        },
      })
    )
    let xhr!: FakeXMLHttpRequest
    class TestXMLHttpRequest extends FakeXMLHttpRequest {
      constructor() {
        super()
        xhr = this
      }
    }
    globalThis.XMLHttpRequest = TestXMLHttpRequest as unknown as typeof XMLHttpRequest
    const progress = vi.fn()
    const pending = uploadFile(file, { onProgress: progress })

    await vi.waitFor(() => expect(xhr).toBeDefined())
    xhr.triggerProgress(1, 1)
    xhr.status = 200
    xhr.trigger('load')
    await pending

    expect(xhr.open).toHaveBeenCalledWith('PUT', 'https://minio.test/upload')
    expect(xhr.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'text/plain')
    expect(progress).toHaveBeenLastCalledWith({ loaded: file.size, total: file.size })
  })

  it('uses RPC for list and delete control calls', async () => {
    const signal = new AbortController().signal
    get.mockResolvedValueOnce(jsonResponse({ data: [{ id: 'uploads/report.txt' }] }))
    remove.mockResolvedValueOnce(jsonResponse({ ok: true }))

    await expect(listFiles('uploads/', signal)).resolves.toEqual([{ id: 'uploads/report.txt' }])
    await deleteFile('uploads/report.txt', signal)

    expect(get).toHaveBeenCalledWith({ query: { prefix: 'uploads/' } }, { init: { signal } })
    expect(remove).toHaveBeenCalledWith({ json: { key: 'uploads/report.txt' } }, { init: { signal } })
  })

  it('builds stable API URLs from object keys', () => {
    expect(fileUrl('uploads/report.txt')).toBe('https://api.test/files/object?key=uploads%2Freport.txt')
  })
})

class FakeXMLHttpRequest {
  upload = {
    addEventListener: vi.fn((type: string, listener: (event: ProgressEvent) => void) => {
      this.uploadListeners.set(type, listener)
    }),
  }
  status = 0
  body: BodyInit | null = null
  private listeners = new Map<string, (event: Event) => void>()
  private uploadListeners = new Map<string, (event: ProgressEvent) => void>()

  open = vi.fn()
  setRequestHeader = vi.fn()
  addEventListener(type: string, listener: (event: Event) => void) {
    this.listeners.set(type, listener)
  }
  send(body: BodyInit | null) {
    this.body = body
  }
  abort() {
    this.trigger('abort')
  }
  trigger(type: string) {
    this.listeners.get(type)?.(new Event(type))
  }
  triggerProgress(loaded: number, total: number) {
    this.uploadListeners.get('progress')?.({ loaded, total, lengthComputable: true } as ProgressEvent)
  }
}
