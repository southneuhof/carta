import type { UploadOperation } from '@southneuhof/is-vue-framework'
import { uploadFile } from './storage'

export interface UploadedInputFile {
  path: string
  url: string
  file: File
}

export const inputUpload: UploadOperation<UploadedInputFile> = async (blob, { signal, onProgress }) => {
  if (!(blob instanceof File)) throw new Error('Input upload requires a File.')
  const response = await uploadFile(blob, { signal, onProgress })
  if (!response.key || !response.url || !response.file) throw new Error('Upload response requires path and url.')
  return { path: response.key, url: response.url, file: response.file }
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
