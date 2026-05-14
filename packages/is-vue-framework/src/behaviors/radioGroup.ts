import { getFrameworkBehaviors, missingBehavior } from '@southneuhof/is-vue-framework/adapters/behaviors'

export async function defaultGetData(getAPI: string, searchParameters: object) {
  const getData = getFrameworkBehaviors().radioGroup?.getData
  if (!getData) missingBehavior('radioGroup.getData')
  return getData(getAPI, searchParameters)
}
