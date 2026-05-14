import { getFrameworkBehaviors, missingBehavior } from '@southneuhof/is-vue-framework/adapters/behaviors'

export async function defaultGetData(getAPI: string, searchParameters: object) {
  const getData = getFrameworkBehaviors().select?.getData
  if (!getData) missingBehavior('select.getData')
  return getData(getAPI, searchParameters)
}
