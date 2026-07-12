import { missingBehavior, type FrameworkCrudListBehaviors } from '@southneuhof/is-vue-framework/adapters/behaviors'

export async function onDelete(endpoint: string, id: string | number, behaviorGroup?: FrameworkCrudListBehaviors) {
  const behavior = behaviorGroup?.onDelete
  if (!behavior) missingBehavior('crudList.onDelete')
  await behavior(endpoint, id)
}

export async function defaultOnExport({ exportAPI, params, listConfig }: { exportAPI: string; params: Record<string, any>; listConfig: any }, behaviorGroup?: FrameworkCrudListBehaviors) {
  const behavior = behaviorGroup?.onExport
  if (!behavior) missingBehavior('crudList.onExport')
  await behavior({ exportAPI, params, listConfig })
}

export function defaultOnDragChange(reorderAPI: string, event: any, behaviorGroup?: FrameworkCrudListBehaviors) {
  const behavior = behaviorGroup?.onDragChange
  if (!behavior) missingBehavior('crudList.onDragChange')
  return behavior(reorderAPI, event)
}
