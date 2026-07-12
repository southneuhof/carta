import services from '@/utils/services'

export function fileUpload(file: File, directory: string = '', onUploadProgress?: (progress: { loaded: number; total: number }) => void) {
  return services.fileUpload(file, directory, onUploadProgress)
}

export function fileUploadNoAuth(file: Blob, onUploadProgress?: (progress: { loaded: number; total: number }) => void) {
  return services.fileUploadNoAuth(file, onUploadProgress)
}
