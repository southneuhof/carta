import { getFrameworkBehaviors, missingBehavior, type FrameworkFileUpload } from '@southneuhof/is-vue-framework/adapters/behaviors'

export async function defaultImageInputUpload(file: File, directory?: string, onUploadProgress?: (progress: { loaded: number; total: number }) => void) {
  const fileUpload = getFrameworkBehaviors().imageInput?.fileUpload
  if (!fileUpload) missingBehavior('imageInput.fileUpload')
  return fileUpload(file, directory, onUploadProgress)
}

export type ImageInputUploadBehavior = FrameworkFileUpload
