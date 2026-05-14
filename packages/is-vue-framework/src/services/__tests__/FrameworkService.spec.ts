import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FrameworkService } from '../FrameworkService'
import { Apostle } from '@southneuhof/apostle'

class TestService extends FrameworkService {}

describe('FrameworkService', () => {
  let service: FrameworkService
  let fetchImpl: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchImpl = vi.fn(async (url: string) => {
      if (String(url).includes('/presigned-url')) {
        return new Response(JSON.stringify({ upload_url: 'https://upload.example/file', file_path: 'abc/file.txt' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      if (String(url).includes('/register-file')) {
        return new Response(JSON.stringify({ url: 'https://cdn.example/abc/file.txt' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    service = new TestService({
      baseURL: 'https://api.test/',
      apostle: new Apostle({
        fetchImpl,
        baseURL: 'https://api.test/',
        config: { inferResponseBodyContentType: true, defaultResponseType: 'json' },
      }),
    })
  })

  it('list calls users/list', async () => {
    await service.list('users')
    expect(fetchImpl.mock.calls[0][0]).toContain('users/list')
  })

  it('detail calls users/1/show', async () => {
    await service.detail('users', 1)
    expect(fetchImpl.mock.calls[0][0]).toContain('users/1/show')
  })

  it('create/update/remove/dataset route suffixes', async () => {
    await service.create('users', { a: 1 })
    await service.update('users', { a: 1 })
    await service.remove('users', { id: 1 })
    await service.dataset('roles')

    expect(fetchImpl.mock.calls[0][0]).toContain('users/create')
    expect(fetchImpl.mock.calls[1][0]).toContain('users/update')
    expect(fetchImpl.mock.calls[2][0]).toContain('users/delete')
    expect(fetchImpl.mock.calls[3][0]).toContain('roles/dataset')
  })

  it('?custom path bypasses suffix behavior', async () => {
    await service.list('users?custom')
    expect(fetchImpl.mock.calls[0][0]).toContain('users')
    expect(fetchImpl.mock.calls[0][0]).not.toContain('/list')
  })

  it('exportExcel downloads blob with parsed filename', async () => {
    const click = vi.fn()
    ;(URL as any).createObjectURL = vi.fn(() => 'blob:123')
    ;(URL as any).revokeObjectURL = vi.fn(() => {})
    vi.spyOn(document, 'createElement').mockImplementation(
      () => ({ target: '', href: '', download: '', click } as unknown as HTMLAnchorElement)
    )

    fetchImpl.mockResolvedValueOnce(
      new Response('file', {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': "attachment; filename*=UTF-8''report.xlsx",
        },
      })
    )

    await service.exportExcel('users', 'fallback.xlsx')
    expect(click).toHaveBeenCalled()
    expect((URL as any).createObjectURL).toHaveBeenCalled()
    expect((URL as any).revokeObjectURL).toHaveBeenCalled()
  })

  it('downloadFile uses fallback filename if header missing', async () => {
    const anchor = { target: '', href: '', download: '', click: vi.fn() } as unknown as HTMLAnchorElement
    ;(URL as any).createObjectURL = vi.fn(() => 'blob:123')
    ;(URL as any).revokeObjectURL = vi.fn(() => {})
    vi.spyOn(document, 'createElement').mockImplementation(() => anchor)

    fetchImpl.mockResolvedValueOnce(new Response('file', { status: 200 }))

    await service.downloadFile('asset/file', 'fallback.txt')
    expect(anchor.download).toBe('fallback.txt')
  })

  it('fileUpload presigns, uploads to absolute URL, and registers', async () => {
    const result = await service.fileUpload(new File(['abc'], 'a.txt', { type: 'text/plain' }))
    expect(result.success).toBe(true)

    const urls = fetchImpl.mock.calls.map((call) => String(call[0]))
    expect(urls.some((u) => u.includes('/presigned-url'))).toBe(true)
    expect(urls.some((u) => u === 'https://upload.example/file')).toBe(true)
    expect(urls.some((u) => u.includes('/register-file'))).toBe(true)
  })

  it('onError is skipped when bypassErrorToast is true', async () => {
    const onError = vi.fn()
    const localService = new TestService({
      baseURL: 'https://api.test/',
      onError,
      apostle: new Apostle({
        baseURL: 'https://api.test/',
        fetchImpl: vi.fn(async () => new Response('err', { status: 500 })),
        config: { inferResponseBodyContentType: true, defaultResponseType: 'json' },
      }),
    })

    await expect(localService.get('x', undefined, { bypassErrorToast: true })).rejects.toBeDefined()
    expect(onError).toHaveBeenCalledWith(expect.anything(), { bypassErrorToast: true })
  })
})
