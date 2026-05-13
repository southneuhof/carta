import { getFrameworkBehaviors, missingBehavior } from '@southneuhof/is-vue-framework/adapters/behaviors'

export async function defaultDetailGetData(getAPI: string, searchParameters?: Record<string, any>, getDataID?: string) {
  const getData = getFrameworkBehaviors().detail?.getData
  if (!getData) missingBehavior('detail.getData')
  return getData(getAPI, searchParameters, getDataID)
}

export function defaultOnDataLoaded(data?: any) {
  return getFrameworkBehaviors().detail?.onDataLoaded?.(data)
}

export const detailFieldTypes: Record<string, any> = getFrameworkBehaviors().detail?.fieldTypes ?? {}
