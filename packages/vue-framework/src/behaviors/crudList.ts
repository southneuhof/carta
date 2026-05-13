import { getFrameworkBehaviors, missingBehavior } from '@southneuhof/is-vue-framework/adapters/behaviors'

export async function onDelete(endpoint: string, id: string | number) {
  const behavior = getFrameworkBehaviors().crudList?.onDelete
  if (!behavior) missingBehavior('crudList.onDelete')
  await behavior(endpoint, id)
}

export async function defaultOnExport({ exportAPI, params, listConfig }: { exportAPI: string; params: Record<string, any>; listConfig: any }) {
  const behavior = getFrameworkBehaviors().crudList?.onExport
  if (!behavior) missingBehavior('crudList.onExport')
  await behavior({ exportAPI, params, listConfig })
}

export function defaultOnDragChange(reorderAPI: string, event: any) {
  const behavior = getFrameworkBehaviors().crudList?.onDragChange
  if (!behavior) missingBehavior('crudList.onDragChange')
  return behavior(reorderAPI, event)
}
