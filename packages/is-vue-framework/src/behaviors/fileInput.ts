import { getFrameworkBehaviors, missingBehavior, type FrameworkFileUpload } from '@southneuhof/is-vue-framework/adapters/behaviors'

export async function defaultFileInputUpload(file: File, directory?: string, onUploadProgress?: (progress: { loaded: number; total: number }) => void) {
  const fileUpload = getFrameworkBehaviors().fileInput?.fileUpload
  if (!fileUpload) missingBehavior('fileInput.fileUpload')
  return fileUpload(file, directory, onUploadProgress)
}

export type FileInputUploadBehavior = FrameworkFileUpload
