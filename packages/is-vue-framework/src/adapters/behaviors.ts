import { resetFrameworkDefaultsForTests } from './defaults'

export type FrameworkFormGetData = (params: { getAPI: string; id?: string | number; searchParameters?: object }) => Promise<object | undefined>
export type FrameworkFormBeforeSubmit = (params: { formData: object }) => object
export type FrameworkFormSubmit = (params: { payload: object; method: 'put' | 'post'; targetAPI: string; type: 'create' | 'update' }) => Promise<object | void>
export type FrameworkFormSuccess = (params: { formData?: object; payload?: object; res?: Record<string, any>; response?: object }) => void | object
export type FrameworkFormError = (params: { formData?: object; payload?: object; error: any }) => void | object

export interface FrameworkFormBehaviors {
  getDetailData?: FrameworkFormGetData
  beforeSubmit?: FrameworkFormBeforeSubmit
  onSubmit?: FrameworkFormSubmit
  onSuccess?: FrameworkFormSuccess
  onError?: FrameworkFormError
}

export interface FrameworkTableBehaviors {
  getData?: (getAPI: string, searchParameters?: Record<string, any>) => Promise<{ data: Record<string, any>[]; totalPage?: number; total?: number }>
  onDataLoaded?: (data: any) => void
  fieldTypes?: Record<string, any>
}

export interface FrameworkDetailBehaviors {
  getData?: (getAPI: string, searchParameters?: Record<string, any>, dataID?: string | number) => Promise<Record<string, any>>
  onDataLoaded?: (data: any) => void
  fieldTypes?: Record<string, any>
}

export interface FrameworkSelectBehaviors {
  getData?: (getAPI: string, searchParameters?: object) => Promise<Array<any>>
}

export interface FrameworkLookupBehaviors {
  getData?: (getAPI: string, searchParameters?: object) => Promise<any>
  getDetail?: (getAPI: string, id: string | number, searchParameters?: object) => Promise<any>
  dataFormatter?: (data: Array<Record<string, any>>, allowMulti: boolean, pick: string) => any
  fieldsAlias?: Record<string, string>
}

export type FrameworkFileUpload = (file: File, directory?: string, onUploadProgress?: (progress: { loaded: number; total: number }) => void) => Promise<any>
export type FrameworkImageURLResolver = (payload: Record<string, any> | string) => { imageURL: string; thumbnailURL: string }

export interface FrameworkFileInputBehaviors {
  fileUpload?: FrameworkFileUpload
}

export interface FrameworkImageInputBehaviors {
  fileUpload?: FrameworkFileUpload
  imageURLResolver?: FrameworkImageURLResolver
}

export interface FrameworkUploadBehaviors {
  fileUpload?: (file: File, directory?: string, onUploadProgress?: (progress: { loaded: number; total: number }) => void) => Promise<any>
  fileUploadNoAuth?: (file: Blob, onUploadProgress?: (progress: { loaded: number; total: number }) => void) => Promise<any>
}

export interface FrameworkLocationBehaviors {
  getPlaceDetail?: (placeId: string | number) => Promise<{ lat: number; lng: number; formatted_address?: string }>
  getPlaceAutocomplete?: (input: string) => Promise<Record<string, any>[]>
  getMapConfig?: () => Promise<{ apiKey: string }>
}

export interface FrameworkFileManagerBehaviors {
  listFiles?: (params: Record<string, any>) => Promise<any[]>
  uploadFile?: (file: File, directory?: string, onUploadProgress?: (progress: { loaded: number; total: number }) => void) => Promise<any>
  syncFiles?: (directory?: string) => Promise<any>
  deleteFile?: (path: string) => Promise<any>
}

export interface FrameworkDynamicFormBehaviors {
  getTemplate?: (templateAPI: string) => Promise<any[]>
}

export interface FrameworkCrudListBehaviors {
  onDelete?: (endpoint: string, id: string | number) => Promise<any>
  onExport?: (params: { exportAPI: string; params: Record<string, any>; listConfig: any }) => Promise<any>
  onDragChange?: (reorderAPI: string, event: any) => Promise<any> | void
}

export interface FrameworkCrudDetailBehaviors {
  onExport?: (detailConfig: any, id: number) => Promise<any>
}

export interface FrameworkBehaviors {
  form?: FrameworkFormBehaviors
  table?: FrameworkTableBehaviors
  detail?: FrameworkDetailBehaviors
  select?: FrameworkSelectBehaviors
  radioGroup?: FrameworkSelectBehaviors
  checkboxGroup?: FrameworkSelectBehaviors
  lookup?: FrameworkLookupBehaviors
  fileInput?: FrameworkFileInputBehaviors
  imageInput?: FrameworkImageInputBehaviors
  upload?: FrameworkUploadBehaviors
  location?: FrameworkLocationBehaviors
  fileManager?: FrameworkFileManagerBehaviors
  dynamicForm?: FrameworkDynamicFormBehaviors
  crudList?: FrameworkCrudListBehaviors
  crudDetail?: FrameworkCrudDetailBehaviors
}

const behaviors: FrameworkBehaviors = {}

function mergeBehaviorGroup<K extends keyof FrameworkBehaviors>(key: K, value: FrameworkBehaviors[K]) {
  if (!value) return
  behaviors[key] = { ...((behaviors[key] || {}) as object), ...(value as object) } as FrameworkBehaviors[K]
}

export function configureFrameworkBehaviors(nextBehaviors: FrameworkBehaviors) {
  for (const key of Object.keys(nextBehaviors) as Array<keyof FrameworkBehaviors>) {
    mergeBehaviorGroup(key, nextBehaviors[key])
  }
}

export function getFrameworkBehaviors() {
  return behaviors
}

export function resetFrameworkBehaviorsForTests() {
  for (const key of Object.keys(behaviors) as Array<keyof FrameworkBehaviors>) {
    delete behaviors[key]
  }
  resetFrameworkDefaultsForTests()
}

export function missingBehavior(name: string): never {
  throw new Error(`[vue-framework] Missing behavior: ${name}. Register it with configureFrameworkBehaviors().`)
}
