import type { EditableTreeNode } from 'vue-router/unplugin'
import { validateRoutes } from './validate-routes'

function isLayoutFile(node: EditableTreeNode): boolean {
  return node.component?.endsWith('.layout.vue') === true && node.path !== '' && node.path !== '/'
}

export function applyFileRouteConventions(root: EditableTreeNode, isRoutesRoot = true): void {
  const layouts = root.children.filter(isLayoutFile)
  if (layouts.length) {
    if (isRoutesRoot) throw new Error(`Route layout must be below routes root: ${layouts[0].component}`)
    if (layouts.length > 1) throw new Error(`Route group has multiple layouts: ${layouts.map((layout) => layout.component).join(', ')}`)
    const layout = layouts[0]
    if (root.component && root.component !== layout.component) throw new Error(`Route layout ${layout.component} would overwrite parent component ${root.component}`)
    const group = layout.component?.split('/').at(-2)
    root.components.set('default', layout.component!)
    root.meta = { ...layout.meta, ...(group === '(authenticated)' ? { requiresAuth: true } : {}) }
    // Keep children when a layout file shares its path segment with a route
    // group. Empty layout nodes can be deleted as before.
    for (const duplicate of layouts) {
      if (duplicate.children.length) duplicate.components.clear()
      else duplicate.delete()
    }
  }

  for (const child of root.children) applyFileRouteConventions(child, false)
  if (!root.component) (root as { name: string | false }).name = false
  if (isRoutesRoot) validateRoutes(root)
}
