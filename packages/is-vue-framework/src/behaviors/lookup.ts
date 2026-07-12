import { missingBehavior, type FrameworkLookupBehaviors } from '@southneuhof/is-vue-framework/adapters/behaviors'

export async function defaultGetData(getAPI: string, searchParameters: object, behavior?: FrameworkLookupBehaviors) {
  const getData = behavior?.getData
  if (!getData) missingBehavior('lookup.getData')
  return getData(getAPI, searchParameters)
}

export async function defaultGetDetail(getAPI: string, id: string | number, searchParameters?: object, behavior?: FrameworkLookupBehaviors) {
  const getDetail = behavior?.getDetail
  if (!getDetail) missingBehavior('lookup.getDetail')
  return getDetail(getAPI, id, searchParameters)
}

export function defaultDataFormatter(data: Array<Record<string, any>>, allowMulti: boolean, pick: string, behavior?: FrameworkLookupBehaviors) {
  const dataFormatter = behavior?.dataFormatter
  if (dataFormatter) return dataFormatter(data, allowMulti, pick)
  if (!allowMulti) return data[0]?.[pick]
  return data
}

export function getDefaultFieldsAlias(behavior?: FrameworkLookupBehaviors): Record<string, string> {
  return behavior?.fieldsAlias ?? {}
}
