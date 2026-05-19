import { getFrameworkBehaviors, missingBehavior, type FrameworkFileUpload, type FrameworkImageURLResolver } from '@southneuhof/is-vue-framework/adapters/behaviors'

export async function defaultImageInputUpload(file: File, directory?: string, onUploadProgress?: (progress: { loaded: number; total: number }) => void) {
  const fileUpload = getFrameworkBehaviors().imageInput?.fileUpload
  if (!fileUpload) missingBehavior('imageInput.fileUpload')
  return fileUpload(file, directory, onUploadProgress)
}

export function defaultImageURLResolver(payload: Record<string, any>) {
  const resolver = getFrameworkBehaviors().imageInput?.imageURLResolver
  if (resolver) return resolver(payload)

  return {
    imageURL: String(payload?.imageURL ?? payload?.image_url ?? payload?.url ?? ''),
    thumbnailURL: String(payload?.thumbnailURL ?? payload?.thumbnail_url ?? payload?.thumbnail ?? payload?.url ?? ''),
  }
}

export type ImageInputUploadBehavior = FrameworkFileUpload
export type ImageInputURLResolverBehavior = FrameworkImageURLResolver
