import { getFrameworkBehaviors, missingBehavior } from '@southneuhof/is-vue-framework/adapters/behaviors'

export async function defaultOnExport(detailConfig: any, id: number) {
  const behavior = getFrameworkBehaviors().crudDetail?.onExport
  if (!behavior) missingBehavior('crudDetail.onExport')
  return behavior(detailConfig, id)
}
