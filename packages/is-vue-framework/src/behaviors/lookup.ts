import { getFrameworkBehaviors, missingBehavior } from '@southneuhof/is-vue-framework/adapters/behaviors'

export async function defaultGetData(getAPI: string, searchParameters: object) {
  const getData = getFrameworkBehaviors().lookup?.getData
  if (!getData) missingBehavior('lookup.getData')
  return getData(getAPI, searchParameters)
}

export async function defaultGetDetail(getAPI: string, id: string | number, searchParameters?: object) {
  const getDetail = getFrameworkBehaviors().lookup?.getDetail
  if (!getDetail) missingBehavior('lookup.getDetail')
  return getDetail(getAPI, id, searchParameters)
}

export function defaultDataFormatter(data: Array<Record<string, any>>, allowMulti: boolean, pick: string) {
  const dataFormatter = getFrameworkBehaviors().lookup?.dataFormatter
  if (dataFormatter) return dataFormatter(data, allowMulti, pick)
  if (!allowMulti) return data[0]?.[pick]
  return data
}

export const defaultFieldsAlias: Record<string, string> = getFrameworkBehaviors().lookup?.fieldsAlias ?? {}
