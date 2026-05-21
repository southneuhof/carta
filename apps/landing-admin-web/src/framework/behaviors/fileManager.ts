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
  const response = await services.get('files/list', params)
  return Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : []
}

export function uploadFile(file: File, directory?: string, onUploadProgress?: (progress: { loaded: number; total: number }) => void) {
  const formData = new FormData()
  formData.append('file', file)
  if (directory) formData.append('dir', directory)

  return services.progress('post', 'files/upload', formData as any, onUploadProgress).then((response: any) => response?.data ?? response)
}

export function createFolder(dir: string, folderName: string) {
  return services.post('create-folder', { dir, folder_name: folderName }).then((response: any) => response?.data ?? response)
}

export function deleteFile(path: string) {
  return services.post('delete-file', { path: toStoredAssetPath(path) }).then((response: any) => response?.data ?? response)
}
