import { missingBehavior, type FrameworkSelectBehaviors } from '@southneuhof/is-vue-framework/adapters/behaviors'

export async function defaultGetData(getAPI: string, searchParameters: object, behavior?: FrameworkSelectBehaviors) {
  const getData = behavior?.getData
  if (!getData) missingBehavior('select.getData')
  return getData(getAPI, searchParameters)
}
