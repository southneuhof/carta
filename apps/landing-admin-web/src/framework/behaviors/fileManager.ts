import services from '@/utils/services'

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

export async function listFiles(params: Record<string, any>) {
  const response = await services.get('files', params)
  return response.data
}

export function uploadFile(file: File, directory?: string, onUploadProgress?: (progress: { loaded: number; total: number }) => void) {
  return services.fileUpload(file, directory, onUploadProgress)
}

export function syncFiles(directory?: string) {
  return services.get('sync-file', { dir: directory })
}

export function deleteFile(path: string) {
  return services.post('delete-file', { path: toStoredAssetPath(path) })
}
