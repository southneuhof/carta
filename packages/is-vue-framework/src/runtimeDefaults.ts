import {
  missingRuntimeCapability,
  type FrameworkDetailRuntime,
  type FrameworkTableRuntime,
} from './runtime'

export async function defaultTableGetData(getAPI: string, searchParameters?: Record<string, number | string | undefined>, runtime?: FrameworkTableRuntime) {
  const getData = runtime?.getData
  if (!getData) missingRuntimeCapability('table.getData')
  return getData(getAPI, searchParameters)
}

export function getTableFieldTypes(runtime?: FrameworkTableRuntime): Record<string, any> {
  return runtime?.fieldTypes ?? {}
}

export async function defaultDetailGetData(getAPI: string, searchParameters?: Record<string, any>, id?: string, runtime?: FrameworkDetailRuntime) {
  const getData = runtime?.getData
  if (!getData) missingRuntimeCapability('detail.getData')
  return getData(getAPI, searchParameters, id)
}

export function getDetailFieldTypes(runtime?: FrameworkDetailRuntime): Record<string, any> {
  return runtime?.fieldTypes ?? {}
}
