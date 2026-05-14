import { Apostle, type ApostleInit, type ApostleResponseType } from '@southneuhof/apostle'
import { downloadBlob, parseFilenameFromContentDisposition } from './download'
import { parseURL } from './path'
import type { FrameworkServiceEndpoints, FrameworkServiceOptions, ServiceRequestOptions } from './types'

const defaultEndpoints: FrameworkServiceEndpoints = {
  listSuffix: '/list',
  detailSuffix: (id?: string | number) => `${id ? `/${id}` : ''}/show`,
  createSuffix: '/create',
  updateSuffix: '/update',
  deleteSuffix: '/delete',
  datasetSuffix: '/dataset',
  exportExcelSuffix: '/export-excel',
  presignedUrlPath: 'presigned-url',
  registerFilePath: 'register-file',
  noAuthUploadPath: 'no-auth/upload',
}

async function parseErrorPayload(response: Response): Promise<unknown> {
  try {
    const contentType = response.headers.get('Content-Type')
    if (contentType?.includes('application/json')) return await response.json()
    return await response.text()
  } catch {
    return { status: response.status, statusText: response.statusText }
  }
}

export class FrameworkService {
  protected apostle: Apostle
  protected options: FrameworkServiceOptions
  protected endpoints: FrameworkServiceEndpoints

  constructor(options: FrameworkServiceOptions) {
    this.options = options
    this.endpoints = { ...defaultEndpoints, ...(options.endpoints || {}) }

    this.apostle =
      options.apostle ??
      new Apostle({
        baseURL: options.baseURL,
        config: {
          defaultResponseType: 'text',
          inferRequestBodyContentType: true,
          inferResponseBodyContentType: true,
          parseObjectAsJSON: true,
        },
        interceptor: async (init) => {
          const token = await options.getToken?.()
          const headers = new Headers({ ...(options.defaultHeaders || {}) })
          if (init.headers) {
            new Headers(init.headers).forEach((value, key) => headers.set(key, value))
          }

          if (token) {
            const tokenHeader = options.tokenHeader || 'Authorization'
            const tokenPrefix = options.tokenPrefix ?? 'Bearer '
            headers.set(tokenHeader, `${tokenPrefix}${token}`)
          }

          return { ...init, headers }
        },
        effect: {
          onError: async (error) => {
            if (error instanceof Response) {
              const payload = await parseErrorPayload(error)
              if (error.status === 401 && options.onUnauthorized) {
                await options.onUnauthorized({ status: error.status, payload })
              }
              throw payload
            }
            throw error
          },
        },
      })
  }

  protected parseURL(path: string, prefix: string = '', suffix: string = ''): string {
    return parseURL(path, prefix, suffix)
  }

  protected withServiceOptions<T>(promise: Promise<T>, options?: ServiceRequestOptions): Promise<T> {
    return promise.catch(async (error) => {
      await this.options.onError?.(error, options)
      throw error
    })
  }

  protected parseFilenameFromContentDisposition(header: string | null): string | null {
    return parseFilenameFromContentDisposition(header)
  }

  protected downloadBlob(response: Response, fallbackFilename: string): Promise<void> {
    return downloadBlob(response, fallbackFilename)
  }

  get(path: string, query?: Record<string, any>, options?: ServiceRequestOptions): Promise<any> {
    return this.withServiceOptions(this.apostle.get(path, query, options?.responseType, options?.init), options)
  }

  post(path: string, data?: any, options?: ServiceRequestOptions): Promise<any> {
    return this.withServiceOptions(this.apostle.post(path, data, undefined, options?.responseType, options?.init), options)
  }

  put(path: string, data?: any, options?: ServiceRequestOptions): Promise<any> {
    return this.withServiceOptions(this.apostle.put(path, data, undefined, options?.responseType, options?.init), options)
  }

  patch(path: string, data?: any, options?: ServiceRequestOptions): Promise<any> {
    return this.withServiceOptions(this.apostle.patch(path, data, undefined, options?.responseType, options?.init), options)
  }

  del(path: string, data?: any, options?: ServiceRequestOptions): Promise<any> {
    return this.withServiceOptions(this.apostle.delete(path, data, undefined, options?.responseType, options?.init), options)
  }

  raw(path: string, query?: Record<string, any>, options?: ServiceRequestOptions): Promise<Response> {
    return this.withServiceOptions(this.apostle.get(path, query, 'raw', options?.init), options)
  }

  list(path: string, query?: Record<string, any>, options?: ServiceRequestOptions): Promise<any> {
    return this.get(this.parseURL(path, '', this.endpoints.listSuffix), query, options)
  }

  detail(path: string, id?: string | number, query?: Record<string, any>, options?: ServiceRequestOptions): Promise<any> {
    return this.get(this.parseURL(path, '', this.endpoints.detailSuffix(id)), query, options)
  }

  create(path: string, data?: any, query?: Record<string, any>, options?: ServiceRequestOptions): Promise<any> {
    return this.withServiceOptions(
      this.apostle.post(this.parseURL(path, '', this.endpoints.createSuffix), data, query, options?.responseType, options?.init),
      options
    )
  }

  update(path: string, data?: any, query?: Record<string, any>, options?: ServiceRequestOptions): Promise<any> {
    return this.withServiceOptions(
      this.apostle.put(this.parseURL(path, '', this.endpoints.updateSuffix), data, query, options?.responseType, options?.init),
      options
    )
  }

  delete(path: string, data?: any, options?: ServiceRequestOptions): Promise<any> {
    return this.del(this.parseURL(path, '', this.endpoints.deleteSuffix), data, options)
  }

  remove(path: string, data?: any, options?: ServiceRequestOptions): Promise<any> {
    return this.delete(path, data, options)
  }

  dataset(path: string, query?: Record<string, any>, options?: ServiceRequestOptions): Promise<any> {
    return this.get(this.parseURL(path, '', this.endpoints.datasetSuffix), query, options)
  }

  async exportExcel(path: string, fallbackFilename: string, query?: Record<string, any>, options?: ServiceRequestOptions): Promise<void> {
    const response = await this.raw(this.parseURL(path, '', this.endpoints.exportExcelSuffix), query, options)
    await this.downloadBlob(response, fallbackFilename)
  }

  async downloadFile(path: string, filename: string, query?: Record<string, any>, options?: ServiceRequestOptions): Promise<void> {
    const response = await this.raw(path, query, options)
    await this.downloadBlob(response, filename)
  }

  async fileUpload(
    file: File,
    directory: string = '',
    onUploadProgress?: (progress: { loaded: number; total: number }) => void,
    options?: ServiceRequestOptions
  ): Promise<any> {
    try {
      const presignResponse = await this.post(
        this.endpoints.presignedUrlPath,
        {
          dir: directory,
          filename: file.name,
          content_type: file.type,
        },
        options
      )

      const { upload_url, file_path } = presignResponse
      await this.apostle.put(upload_url, file, undefined, 'text', { onUploadProgress })

      const register = await this.post(
        this.endpoints.registerFilePath,
        {
          path: file_path,
          size: file.size,
        },
        options
      )

      return {
        success: true,
        path: file_path,
        data: file_path,
        url: register.url,
      }
    } catch (error) {
      console.error(error)
      return { success: false }
    }
  }

  upload(
    file: File,
    directory: string = '',
    onUploadProgress?: (progress: { loaded: number; total: number }) => void,
    options?: ServiceRequestOptions
  ): Promise<any> {
    return this.fileUpload(file, directory, onUploadProgress, options)
  }

  fileUploadNoAuth(file: Blob, _onUploadProgress?: (progress: { loaded: number; total: number }) => void, options?: ServiceRequestOptions): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)
    return this.post(this.endpoints.noAuthUploadPath, formData, options)
  }

  progress(
    method: string,
    path: string,
    payload: Record<string, any>,
    onUploadProgress?: (progress: { loaded: number; total: number }) => void,
    options?: ServiceRequestOptions
  ): Promise<any> {
    const normalizedMethod = method.toLowerCase()
    const fn = (this.apostle as any)[normalizedMethod]
    if (typeof fn !== 'function') {
      return this.withServiceOptions(Promise.reject(new Error(`Unsupported method: ${method}`)), options)
    }

    return this.withServiceOptions(fn(path, payload, undefined, options?.responseType, { ...(options?.init || {}), onUploadProgress } as ApostleInit), options)
  }

  protected extractErrorMessage(error: any): string {
    return this.options.extractErrorMessage?.(error) || String(error?.message || error?.error || error?.statusText || 'Terjadi kesalahan')
  }
}
