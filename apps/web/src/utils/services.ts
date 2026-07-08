import router from '../router'
import { modules } from '@/stores/modules'
import { storage } from '@southneuhof/utilities/storage'
import { useColorPreference } from '@/stores/colorpreference'
import { permissions } from '@/stores/permissions'
import { toast } from 'vue-sonner'
import { getCurrentHashRouteForRedirect, savePostLoginRedirect } from './post-login-redirect'

type ServiceRequestOptions = {
  bypassErrorToast?: boolean
  responseType?: 'arrayBuffer' | 'blob' | 'formData' | 'json' | 'text' | 'raw'
  init?: RequestInit
}

const apiUrl = (() => {
  const raw = import.meta.env.VITE_API_URL || ''
  return raw && !raw.endsWith('/') ? `${raw}/` : raw
})()

function extractErrorMessage(error: any): string {
  return String(error?.message?.message || error?.message || error?.error || error?.statusText || 'Terjadi kesalahan')
}

function parseURL(url: string, prefix: string = '', suffix: string = '') {
  if (url.endsWith('?custom')) return url.slice(0, -7)
  return `${prefix}${url}${suffix}`
}

function buildURL(path: string, query?: Record<string, any>) {
  const url = new URL(path, apiUrl)
  for (const [key, value] of Object.entries(query || {})) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) value.forEach((item) => url.searchParams.append(key, String(item)))
    else url.searchParams.set(key, String(value))
  }
  return url.toString()
}

async function parseResponse(response: Response, responseType?: ServiceRequestOptions['responseType']) {
  if (responseType === 'raw') return response
  const type = responseType || (response.headers.get('Content-Type')?.includes('application/json') ? 'json' : 'text')
  return response[type === 'json' ? 'json' : type]()
}

async function notifyLogoutToServer(token: string) {
  try {
    await fetch(`${apiUrl}logout`, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
        Authorization: `Bearer ${token}`,
      },
      keepalive: true,
    })
  } catch (_) {}
}

function shouldRedirectToSintaOn401(): boolean {
  const profile = storage.localStorage.get('profile') || {}
  return profile?.is_sso === true || String(profile?.login_method || '').toLowerCase() === 'sso'
}

class AppServices {
  // ponytail: local bridge for legacy endpoints; delete as routes move to Hono RPC.
  private async request(method: string, path: string, body?: unknown, query?: Record<string, any>, options?: ServiceRequestOptions) {
    const token = storage.cookie.get('token')
    const headers = new Headers({
      Accept: 'application/json, text/plain, */*',
      ...(options?.init?.headers as Record<string, string> | undefined),
    })
    const isObjectBody = body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)
    if (isObjectBody) headers.set('Content-Type', 'application/json')
    if (token) headers.set('Authorization', `Bearer ${token}`)

    const response = await fetch(buildURL(path, query), {
      ...options?.init,
      method,
      headers,
      body: body == null ? undefined : isObjectBody ? JSON.stringify(body) : (body as BodyInit),
    })

    if (!response.ok) {
      const error = await parseResponse(response).catch(() => ({ status: response.status, statusText: response.statusText }))
      if (response.status === 401) this.signOut(false, { onUnauthorized: true })
      if (!options?.bypassErrorToast) toast.error(extractErrorMessage(error))
      throw error
    }

    return parseResponse(response, options?.responseType)
  }

  get(path: string, query?: Record<string, any>, options?: ServiceRequestOptions) {
    return this.request('GET', path, undefined, query, options)
  }

  post(path: string, data?: any, options?: ServiceRequestOptions) {
    return this.request('POST', path, data, undefined, options)
  }

  put(path: string, data?: any, options?: ServiceRequestOptions) {
    return this.request('PUT', path, data, undefined, options)
  }

  patch(path: string, data?: any, options?: ServiceRequestOptions) {
    return this.request('PATCH', path, data, undefined, options)
  }

  del(path: string, data?: any, options?: ServiceRequestOptions) {
    return this.request('DELETE', path, data, undefined, options)
  }

  raw(path: string, query?: Record<string, any>, options?: ServiceRequestOptions): Promise<Response> {
    return this.get(path, query, { ...options, responseType: 'raw' }) as Promise<Response>
  }

  list(path: string, query?: Record<string, any>, options?: ServiceRequestOptions) {
    return this.get(parseURL(path, '', '/list'), query, options)
  }

  detail(path: string, identity?: string | number | Array<string | number>, query?: Record<string, any>, options?: ServiceRequestOptions) {
    const segments = identity == null ? [] : Array.isArray(identity) ? identity : [identity]
    const identityPath = segments.map((segment) => encodeURIComponent(String(segment))).join('/')
    return this.get(parseURL(path, '', `${identityPath ? `/${identityPath}` : ''}/show`), query, options)
  }

  create(path: string, data?: any, query?: Record<string, any>, options?: ServiceRequestOptions) {
    return this.request('POST', parseURL(path, '', '/create'), data, query, options)
  }

  update(path: string, data?: any, query?: Record<string, any>, options?: ServiceRequestOptions) {
    return this.request('PUT', parseURL(path, '', '/update'), data, query, options)
  }

  delete(path: string, data?: any, options?: ServiceRequestOptions) {
    return this.del(parseURL(path, '', '/delete'), data, options)
  }

  remove(path: string, data?: any, options?: ServiceRequestOptions) {
    return this.delete(path, data, options)
  }

  dataset(path: string, query?: Record<string, any>, options?: ServiceRequestOptions) {
    return this.get(parseURL(path, '', '/dataset'), query, options)
  }

  async exportExcel(path: string, fallbackFilename: string, query?: Record<string, any>, options?: ServiceRequestOptions) {
    return this.downloadResponse(await this.raw(parseURL(path, '', '/export-excel'), query, options), fallbackFilename)
  }

  async downloadFile(path: string, filename: string, query?: Record<string, any>, options?: ServiceRequestOptions) {
    return this.downloadResponse(await this.raw(path, query, options), filename)
  }

  async fileUpload(file: File, directory: string = '', _onUploadProgress?: (progress: { loaded: number; total: number }) => void, options?: ServiceRequestOptions) {
    const presignResponse = await this.post('presigned-url', { dir: directory, filename: file.name, content_type: file.type }, options)
    const { upload_url, file_path } = presignResponse
    await fetch(upload_url, { method: 'PUT', body: file })
    const register = await this.post('register-file', { path: file_path, size: file.size }, options)
    return { success: true, path: file_path, data: file_path, url: register.url }
  }

  upload(file: File, directory: string = '', onUploadProgress?: (progress: { loaded: number; total: number }) => void, options?: ServiceRequestOptions) {
    return this.fileUpload(file, directory, onUploadProgress, options)
  }

  fileUploadNoAuth(file: Blob, _onUploadProgress?: (progress: { loaded: number; total: number }) => void, options?: ServiceRequestOptions) {
    const formData = new FormData()
    formData.append('file', file)
    return this.post('no-auth/upload', formData, options)
  }

  progress(method: string, path: string, payload: Record<string, any>, onUploadProgress?: (progress: { loaded: number; total: number }) => void, options?: ServiceRequestOptions) {
    void onUploadProgress
    return this.request(method.toUpperCase(), path, payload, undefined, options)
  }

  signOut(notifyServer: boolean = true, options?: { onUnauthorized?: boolean }) {
    const token = storage.cookie.get('token')
    const isSsoUser = shouldRedirectToSintaOn401()

    if (notifyServer && token) void notifyLogoutToServer(token)

    const redirectToSinta = isSsoUser && (Boolean(options?.onUnauthorized) || notifyServer)
    if (redirectToSinta && options?.onUnauthorized) {
      const currentRoute = getCurrentHashRouteForRedirect()
      if (currentRoute) savePostLoginRedirect(currentRoute)
    }

    const colorPreference = useColorPreference().value
    storage.localStorage.clear()
    storage.cookie.clear()
    if (colorPreference) useColorPreference().set(colorPreference)
    modules().clear()
    permissions().clear()

    if (redirectToSinta) {
      window.location.href = 'https://sinta.adhi.co.id'
      return
    }

    router.push({ name: 'login', force: true })
  }

  private async downloadResponse(response: Response, fallbackFilename: string) {
    const blob = await response.blob()
    const disposition = response.headers.get('Content-Disposition')
    const filename = disposition?.match(/filename="?([^"]+)"?/)?.[1] || fallbackFilename
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }
}

const services = new AppServices()

export default services
