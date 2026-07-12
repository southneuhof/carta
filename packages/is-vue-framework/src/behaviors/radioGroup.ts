import { missingBehavior, type FrameworkSelectBehaviors } from '@southneuhof/is-vue-framework/adapters/behaviors'

export async function defaultGetData(getAPI: string, searchParameters: object, behavior?: FrameworkSelectBehaviors) {
  const getData = behavior?.getData
  if (!getData) missingBehavior('radioGroup.getData')
  return getData(getAPI, searchParameters)
}
