import config from '@/config'
import router from '../router'
import { modules } from '@/stores/modules'
import { storage } from '@southneuhof/utilities/storage'
import { useColorPreference } from '@/stores/colorpreference'
import { permissions } from '@/stores/permissions'
import { toast } from 'vue-sonner'
import { getCurrentHashRouteForRedirect, savePostLoginRedirect } from './post-login-redirect'
import { FrameworkService, type ServiceRequestOptions } from '@southneuhof/is-vue-framework/services'

function extractErrorMessage(error: any): string {
  return String(error?.message?.message || error?.message || error?.error || error?.statusText || 'Terjadi kesalahan')
}

function toStoredAssetPath(value: string): string {
  if (typeof value !== 'string') return ''
  const input = value.trim()
  if (!input) return ''

  if (/^\/storage\//.test(input)) {
    return input
  }

  try {
    const parsed = new URL(input)
    if (parsed.pathname.startsWith('/storage/')) {
      return parsed.pathname
    }
  } catch {
    return input
  }

  return input
}

function toPublicAssetUrl(path: string, baseUrl?: string): string {
  if (!path) return ''
  if (!baseUrl) return path
  try {
    return new URL(path, baseUrl).toString()
  } catch {
    return path
  }
}

async function notifyLogoutToServer(token: string) {
  try {
    await fetch(`${config.apiUrl}logout`, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
        Authorization: `Bearer ${token}`,
      },
      keepalive: true,
    })
  } catch (_) {}
}

class AppServices extends FrameworkService {
  constructor() {
    super({
      baseURL: config.apiUrl,
      defaultHeaders: {
        Accept: 'application/json, text/plain, */*',
      },
      getToken: () => storage.cookie.get('token'),
      onUnauthorized: async () => {
        this.signOut(false, { onUnauthorized: true })
      },
      onError: (error, options) => {
        if (!options?.bypassErrorToast) {
          toast.error(extractErrorMessage(error))
        }
      },
      extractErrorMessage,
    })
  }

  signOut(notifyServer: boolean = true, options?: { onUnauthorized?: boolean }) {
    const token = storage.cookie.get('token')

    if (notifyServer && token) {
      void notifyLogoutToServer(token)
    }

    const colorPreference = useColorPreference().value
    storage.localStorage.clear()
    storage.cookie.clear()
    if (colorPreference) useColorPreference().set(colorPreference)
    modules().clear()
    permissions().clear()

    router.push({ name: 'login', force: true })
  }

  protected override extractErrorMessage(error: any): string {
    return extractErrorMessage(error)
  }

  override async fileUpload(
    file: File,
    _directory: string = '',
    _onUploadProgress?: (progress: { loaded: number; total: number }) => void,
    options?: ServiceRequestOptions
  ): Promise<any> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await this.post('upload/public', formData, options)
      const path =
        typeof response === 'string'
          ? toStoredAssetPath(response)
          : toStoredAssetPath(response?.path ?? response?.data?.path ?? response?.data ?? response?.url ?? '')

      const url =
        typeof response === 'object' && typeof response?.url === 'string'
          ? response.url
          : toPublicAssetUrl(path, config.apiUrl)

      return {
        success: true,
        path,
        data: path,
        url,
        filename: file.name,
      }
    } catch (error) {
      console.error(error)
      return { success: false }
    }
  }

  override dataset(path: string, query?: Record<string, any>, options?: ServiceRequestOptions): Promise<any> {
    return this.list(path, query, options)
  }

  // delete(url: string, data: object, options?: ServiceRequestOptions) {
  //   return this.remove(url, data, options)
  // }
}

const services = new AppServices()

export default services
