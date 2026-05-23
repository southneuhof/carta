import { getFrameworkBehaviors, missingBehavior, type FrameworkFileUpload, type FrameworkImageURLResolver } from '@southneuhof/is-vue-framework/adapters/behaviors'

export async function defaultImageInputUpload(file: File, directory?: string, onUploadProgress?: (progress: { loaded: number; total: number }) => void) {
  const fileUpload = getFrameworkBehaviors().fileManager?.uploadFile ?? getFrameworkBehaviors().imageInput?.fileUpload
  if (!fileUpload) missingBehavior('fileManager.uploadFile or imageInput.fileUpload')
  return fileUpload(file, directory, onUploadProgress)
}

export function defaultImageURLResolver(payload: Record<string, any> | string) {
  const resolver = getFrameworkBehaviors().imageInput?.imageURLResolver
  if (resolver) return resolver(payload)

  const data = typeof payload === 'string' ? { url: payload } : payload
  return {
    imageURL: String(data?.url ?? data?.imageURL ?? data?.image_url ?? ''),
    thumbnailURL: String(data?.url ?? data?.thumbnailURL ?? data?.thumbnail_url ?? data?.thumbnail ?? ''),
  }
}

export type ImageInputUploadBehavior = FrameworkFileUpload
export type ImageInputURLResolverBehavior = FrameworkImageURLResolver
