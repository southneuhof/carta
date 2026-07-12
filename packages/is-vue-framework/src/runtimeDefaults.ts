import {
  missingRuntimeCapability,
  type FrameworkCRUDDetailRuntime,
  type FrameworkCRUDListRuntime,
  type FrameworkDetailRuntime,
  type FrameworkFileUpload,
  type FrameworkFormRuntime,
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

export function defaultDetailOnDataLoaded(data?: any, runtime?: FrameworkDetailRuntime) { return runtime?.onDataLoaded?.(data) }
export function getDetailFieldTypes(runtime?: FrameworkDetailRuntime): Record<string, any> { return runtime?.fieldTypes ?? {} }

export function defaultBeforeSubmit({ formData }: { formData: object }, runtime?: FrameworkFormRuntime) { return runtime?.beforeSubmit?.({ formData }) ?? formData }
export async function defaultOnSubmit(params: { payload: object; method: 'put' | 'post'; targetAPI: string; type: 'create' | 'update' }, runtime?: FrameworkFormRuntime) {
  const submit = runtime?.onSubmit
  if (!submit) missingRuntimeCapability('form.onSubmit')
  return submit(params)
}
export function defaultOnSuccess({ payload, response }: { payload: object; response: object }, runtime?: FrameworkFormRuntime) { return runtime?.onSuccess?.({ payload, response }) ?? { payload, response } }
export function defaultOnError({ payload, error }: { payload: object; error: any }, runtime?: FrameworkFormRuntime) { return runtime?.onError?.({ payload, error }) ?? { payload, error } }
export async function defaultFormGetData(params: { getAPI: string; id?: string | number | string[]; searchParameters?: object }, runtime?: FrameworkFormRuntime) {
  const getData = runtime?.getDetailData
  if (!getData) missingRuntimeCapability('form.getDetailData')
  return getData(params)
}

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

export async function defaultCRUDListOnExport(params: { exportAPI: string; params: Record<string, any>; listConfig: any }, runtime?: FrameworkCRUDListRuntime) {
  const callback = runtime?.onExport
  if (!callback) missingRuntimeCapability('crudList.onExport')
  return callback(params)
}

export async function defaultCRUDDetailOnExport(config: any, id: number, runtime?: FrameworkCRUDDetailRuntime) {
  const callback = runtime?.onExport
  if (!callback) missingRuntimeCapability('crudDetail.onExport')
  return callback(config, id)
}

export type FileInputUploadRuntime = FrameworkFileUpload
export type ImageInputUploadRuntime = FrameworkFileUpload
export type ImageInputURLResolverRuntime = FrameworkImageURLResolver
