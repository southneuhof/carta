import type { InjectionKey } from 'vue'

export type FrameworkFormGetData = (params: { getAPI: string; id?: string | number | string[]; searchParameters?: object }) => Promise<object | undefined>
export type FrameworkFormBeforeSubmit = (params: { formData: object }) => object
export type FrameworkFormSubmit = (params: { payload: object; method: 'put' | 'post'; targetAPI: string; type: 'create' | 'update' }) => Promise<object | void>
export type FrameworkFormSuccess = (params: { formData?: object; payload?: object; res?: Record<string, any>; response?: object }) => void | object
export type FrameworkFormError = (params: { formData?: object; payload?: object; error: any }) => void | object

export interface FrameworkFormRuntime { getDetailData?: FrameworkFormGetData; beforeSubmit?: FrameworkFormBeforeSubmit; onSubmit?: FrameworkFormSubmit; onSuccess?: FrameworkFormSuccess; onError?: FrameworkFormError }
export interface FrameworkTableRuntime { getData?: (getAPI: string, searchParameters?: Record<string, any>) => Promise<{ data: Record<string, any>[]; totalPage?: number; total?: number }>; onDataLoaded?: (data: any) => void; fieldTypes?: Record<string, any> }
export interface FrameworkDetailRuntime { getData?: (getAPI: string, searchParameters?: Record<string, any>, dataID?: string | number) => Promise<Record<string, any>>; onDataLoaded?: (data: any) => void; fieldTypes?: Record<string, any> }
export interface FrameworkSelectRuntime { getData?: (getAPI: string, searchParameters?: object) => Promise<Array<any>> }
export interface FrameworkLookupRuntime { getData?: (getAPI: string, searchParameters?: object) => Promise<any>; getDetail?: (getAPI: string, id: string | number, searchParameters?: object) => Promise<any>; dataFormatter?: (data: Array<Record<string, any>>, allowMulti: boolean, pick: string) => any; fieldsAlias?: Record<string, string> }
export type FrameworkFileUpload = (file: File, directory?: string, onUploadProgress?: (progress: { loaded: number; total: number }) => void) => Promise<any>
export type FrameworkImageURLResolver = (payload: Record<string, any> | string) => { imageURL: string; thumbnailURL: string }
export interface FrameworkFileInputRuntime { fileUpload?: FrameworkFileUpload }
export interface FrameworkImageInputRuntime { fileUpload?: FrameworkFileUpload; imageURLResolver?: FrameworkImageURLResolver }
export interface FrameworkUploadRuntime { fileUpload?: FrameworkFileUpload; fileUploadNoAuth?: (file: Blob, onUploadProgress?: (progress: { loaded: number; total: number }) => void) => Promise<any> }
export interface FrameworkLocationRuntime { getPlaceDetail?: (placeId: string | number) => Promise<{ lat: number; lng: number; formatted_address?: string }>; getPlaceAutocomplete?: (input: string) => Promise<Record<string, any>[]>; getMapConfig?: () => Promise<{ apiKey: string }> }
export interface FrameworkFileManagerRuntime { listFiles?: (params: Record<string, any>) => Promise<any[]>; uploadFile?: FrameworkFileUpload; createFolder?: (dir: string, folderName: string) => Promise<any>; deleteFile?: (path: string) => Promise<any> }
export interface FrameworkDynamicFormRuntime { getTemplate?: (templateAPI: string) => Promise<any[]> }
export interface FrameworkCRUDListRuntime { onDelete?: (endpoint: string, id: string | number) => Promise<any>; onExport?: (params: { exportAPI: string; params: Record<string, any>; listConfig: any }) => Promise<any>; onDragChange?: (reorderAPI: string, event: any) => Promise<any> | void }
export interface FrameworkCRUDDetailRuntime { onExport?: (detailConfig: any, id: number) => Promise<any> }

export interface FrameworkRuntime {
  form?: FrameworkFormRuntime
  table?: FrameworkTableRuntime
  detail?: FrameworkDetailRuntime
  select?: FrameworkSelectRuntime
  radioGroup?: FrameworkSelectRuntime
  checkboxGroup?: FrameworkSelectRuntime
  lookup?: FrameworkLookupRuntime
  fileInput?: FrameworkFileInputRuntime
  imageInput?: FrameworkImageInputRuntime
  upload?: FrameworkUploadRuntime
  location?: FrameworkLocationRuntime
  fileManager?: FrameworkFileManagerRuntime
  dynamicForm?: FrameworkDynamicFormRuntime
  crudList?: FrameworkCRUDListRuntime
  crudDetail?: FrameworkCRUDDetailRuntime
}

export function missingRuntimeCapability(name: string): never {
  throw new Error(`[vue-framework] Missing runtime capability: ${name}. Register it with FrameworkPlugin.`)
}

export const frameworkRuntimeKey: InjectionKey<FrameworkRuntime> = Symbol('is-vue-framework-runtime')
