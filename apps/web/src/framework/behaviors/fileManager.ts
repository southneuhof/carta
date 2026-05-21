import services from '@/utils/services'

export async function listFiles(params: Record<string, any>) {
  const response = await services.get('files', params)
  console.log('listFiles response', response)
  return response
}

export function uploadFile(file: File, directory?: string, onUploadProgress?: (progress: { loaded: number; total: number }) => void) {
  return services.fileUpload(file, directory, onUploadProgress)
}

export function syncFiles(directory?: string) {
  return services.get('sync-file', { dir: directory })
}

export function deleteFile(path: string) {
  return services.post('delete-file', { path })
}
