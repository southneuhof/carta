import {
  missingRuntimeCapability,
  type FrameworkDetailRuntime,
  type FrameworkFileUpload,
  type FrameworkImageURLResolver,
  type FrameworkLookupRuntime,
  type FrameworkRuntime,
  type FrameworkSelectRuntime,
  type FrameworkTableRuntime,
} from './runtime'

export async function defaultSelectGetData(getAPI: string, searchParameters: object, runtime?: FrameworkSelectRuntime, name = 'select') {
  const getData = runtime?.getData
  if (!getData) missingRuntimeCapability(`${name}.getData`)
  return getData(getAPI, searchParameters)
}

export async function defaultLookupGetData(getAPI: string, searchParameters: object, runtime?: FrameworkLookupRuntime) {
  const getData = runtime?.getData
  if (!getData) missingRuntimeCapability('lookup.getData')
  return getData(getAPI, searchParameters)
}

export async function defaultLookupGetDetail(getAPI: string, id: string | number, searchParameters?: object, runtime?: FrameworkLookupRuntime) {
  const getDetail = runtime?.getDetail
  if (!getDetail) missingRuntimeCapability('lookup.getDetail')
  return getDetail(getAPI, id, searchParameters)
}

export function defaultLookupDataFormatter(data: Array<Record<string, any>>, allowMulti: boolean, pick: string, runtime?: FrameworkLookupRuntime) {
  return runtime?.dataFormatter?.(data, allowMulti, pick) ?? (allowMulti ? data : data[0]?.[pick])
}

export function getDefaultLookupFieldsAlias(runtime?: FrameworkLookupRuntime): Record<string, string> {
  return runtime?.fieldsAlias ?? {}
}

export async function defaultTableGetData(getAPI: string, searchParameters?: Record<string, number | string | undefined>, runtime?: FrameworkTableRuntime) {
  const getData = runtime?.getData
  if (!getData) missingRuntimeCapability('table.getData')
  return getData(getAPI, searchParameters)
}

export function getTableFieldTypes(runtime?: FrameworkTableRuntime): Record<string, any> { return runtime?.fieldTypes ?? {} }

export async function defaultDetailGetData(getAPI: string, searchParameters?: Record<string, any>, id?: string, runtime?: FrameworkDetailRuntime) {
  const getData = runtime?.getData
  if (!getData) missingRuntimeCapability('detail.getData')
  return getData(getAPI, searchParameters, id)
}

export function getDetailFieldTypes(runtime?: FrameworkDetailRuntime): Record<string, any> { return runtime?.fieldTypes ?? {} }


export async function defaultFileInputUpload(file: File, directory?: string, progress?: (value: { loaded: number; total: number }) => void, runtime?: FrameworkRuntime) {
  const upload = runtime?.fileManager?.uploadFile ?? runtime?.fileInput?.fileUpload
  if (!upload) missingRuntimeCapability('fileManager.uploadFile or fileInput.fileUpload')
  return upload(file, directory, progress)
}

export async function defaultImageInputUpload(file: File, directory?: string, progress?: (value: { loaded: number; total: number }) => void, runtime?: FrameworkRuntime) {
  const upload = runtime?.fileManager?.uploadFile ?? runtime?.imageInput?.fileUpload
  if (!upload) missingRuntimeCapability('fileManager.uploadFile or imageInput.fileUpload')
  return upload(file, directory, progress)
}

export function defaultImageURLResolver(payload: Record<string, any> | string, runtime?: FrameworkRuntime) {
  if (runtime?.imageInput?.imageURLResolver) return runtime.imageInput.imageURLResolver(payload)
  const data = typeof payload === 'string' ? { url: payload } : payload
  return { imageURL: String(data?.url ?? data?.imageURL ?? data?.image_url ?? ''), thumbnailURL: String(data?.url ?? data?.thumbnailURL ?? data?.thumbnail_url ?? data?.thumbnail ?? '') }
}



export type FileInputUploadRuntime = FrameworkFileUpload
export type ImageInputUploadRuntime = FrameworkFileUpload
export type ImageInputURLResolverRuntime = FrameworkImageURLResolver
