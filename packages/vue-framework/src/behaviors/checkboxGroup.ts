import { getFrameworkBehaviors, missingBehavior } from '@southneuhof/is-vue-framework/adapters/behaviors'

export async function defaultGetData(getAPI: string, searchParameters: object) {
  const getData = getFrameworkBehaviors().checkboxGroup?.getData
  if (!getData) missingBehavior('checkboxGroup.getData')
  return getData(getAPI, searchParameters)
}
