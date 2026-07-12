import services from '@/utils/services'

export async function getData(getAPI: string, searchParameters?: Record<string, any>, getDataID?: string | number) {
  const { data } = await services.detail(getAPI, getDataID, searchParameters)
  return data
}

export function onDataLoaded() {
  return
}

export const fieldTypes: Record<string, any> = {}
