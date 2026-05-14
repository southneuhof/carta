import type { Apostle, ApostleInit, ApostleResponseType } from '@southneuhof/apostle'

export type ServiceRequestOptions = {
  bypassErrorToast?: boolean
  responseType?: ApostleResponseType
  init?: ApostleInit
}

export type FrameworkServiceEndpoints = {
  listSuffix: string
  detailSuffix: (id?: string | number) => string
  createSuffix: string
  updateSuffix: string
  deleteSuffix: string
  datasetSuffix: string
  exportExcelSuffix: string
  presignedUrlPath: string
  registerFilePath: string
  noAuthUploadPath: string
}

export type FrameworkServiceOptions = {
  baseURL: string
  getToken?: () => string | undefined | Promise<string | undefined>
  tokenHeader?: string
  tokenPrefix?: string
  defaultHeaders?: Record<string, string>
  onUnauthorized?: (error: { status: number; payload: unknown }) => void | Promise<void>
  onError?: (error: unknown, options?: ServiceRequestOptions) => void | Promise<void>
  extractErrorMessage?: (error: unknown) => string
  endpoints?: Partial<FrameworkServiceEndpoints>
  apostle?: Apostle
}
