import services from '@/utils/services'
import { commonFieldTypes } from './commonFieldTypes'

export async function getData(getAPI: string, searchParameters?: Record<string, any>, dataID?: string | number) {
  const { data } = await services.detail(getAPI, dataID, searchParameters)
  return data
}

export function onDataLoaded() {
  return
}

export const fieldTypes: Record<string, any> = {
  ...commonFieldTypes
}
