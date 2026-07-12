import { missingBehavior, type FrameworkDetailBehaviors } from '@southneuhof/is-vue-framework/adapters/behaviors'

export async function defaultDetailGetData(getAPI: string, searchParameters?: Record<string, any>, getDataID?: string, behavior?: FrameworkDetailBehaviors) {
  const getData = behavior?.getData
  if (!getData) missingBehavior('detail.getData')
  return getData(getAPI, searchParameters, getDataID)
}

export function defaultOnDataLoaded(data?: any, behavior?: FrameworkDetailBehaviors) {
  return behavior?.onDataLoaded?.(data)
}

export function getDetailFieldTypes(behavior?: FrameworkDetailBehaviors): Record<string, any> {
  return behavior?.fieldTypes ?? {}
}

// Backward compatibility: previous API exported a constant.
