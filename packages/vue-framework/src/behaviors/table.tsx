import { getFrameworkBehaviors, missingBehavior } from '@southneuhof/is-vue-framework/adapters/behaviors'

export async function defaultTableGetData(getAPI: string, searchParameters?: Record<string, number | string | undefined>) {
  const getData = getFrameworkBehaviors().table?.getData
  if (!getData) missingBehavior('table.getData')
  return getData(getAPI, searchParameters)
}

export function defaultOnDataLoaded(data?: any) {
  return getFrameworkBehaviors().table?.onDataLoaded?.(data)
}

export const tableFieldTypes: Record<string, any> = getFrameworkBehaviors().table?.fieldTypes ?? {}
