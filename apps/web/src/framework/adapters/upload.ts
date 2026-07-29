import type { UploadOperation } from '@southneuhof/is-vue-framework'

export interface UploadedInputFile {
  path: string
  url: string
  file: File
}

export const inputUpload: UploadOperation<UploadedInputFile> = async (blob, { destination, signal, onProgress }) => {
  if (!(blob instanceof File)) throw new Error('Input upload requires a File.')
  const { default: services } = await import('@/utils/services')
  const response = await services.fileUpload(blob, destination ?? '', (progress) => onProgress?.(progress), { init: { signal } })
  if (typeof response?.path !== 'string' || !response.path || typeof response?.url !== 'string' || !response.url) {
    throw new Error('Upload response requires path and url.')
  }
  return { path: response.path, url: response.url, file: blob }
}

export function toInputAssetModel(result: UploadedInputFile) {
  if (!result?.path || !result?.url || !result.file) throw new Error('Upload response requires path, url, and file metadata.')
  return {
    kind: 'file' as const,
    path: result.path,
    url: result.url,
    name: result.file.name,
    size: result.file.size,
    mimeType: result.file.type,
  }
}

export function fileUpload(file: File, directory: string = '', onUploadProgress?: (progress: { loaded: number; total: number }) => void) {
  return import('@/utils/services').then(({ default: services }) => services.fileUpload(file, directory, onUploadProgress))
}

export function fileUploadNoAuth(file: Blob, onUploadProgress?: (progress: { loaded: number; total: number }) => void) {
  return import('@/utils/services').then(({ default: services }) => services.fileUploadNoAuth(file, onUploadProgress))
}
