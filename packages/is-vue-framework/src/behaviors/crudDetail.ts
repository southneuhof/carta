import { missingBehavior, type FrameworkCrudDetailBehaviors } from '@southneuhof/is-vue-framework/adapters/behaviors'

export async function defaultOnExport(detailConfig: any, id: number, behaviorGroup?: FrameworkCrudDetailBehaviors) {
  const behavior = behaviorGroup?.onExport
  if (!behavior) missingBehavior('crudDetail.onExport')
  return behavior(detailConfig, id)
}
