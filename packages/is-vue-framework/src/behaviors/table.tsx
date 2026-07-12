import { missingBehavior, type FrameworkBehaviors, type FrameworkTableBehaviors } from '@southneuhof/is-vue-framework/adapters/behaviors'

export async function defaultTableGetData(getAPI: string, searchParameters?: Record<string, number | string | undefined>, behavior?: FrameworkTableBehaviors) {
  const getData = behavior?.getData
  if (!getData) missingBehavior('table.getData')
  return getData(getAPI, searchParameters)
}

export function defaultOnDataLoaded(data?: any, behavior?: FrameworkTableBehaviors) {
  return behavior?.onDataLoaded?.(data)
}

export function getTableFieldTypes(behavior?: FrameworkTableBehaviors): Record<string, any> {
  return behavior?.fieldTypes ?? {}
}

// Backward compatibility: previous API exported a constant.
