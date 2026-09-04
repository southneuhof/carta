import type { EditableTreeNode } from 'vue-router/unplugin'

type LayoutTreeNode = Pick<EditableTreeNode, 'children' | 'component' | 'components' | 'delete' | 'meta' | 'name' | 'path'>

function isLayoutFile(node: LayoutTreeNode): boolean {
  return node.component?.endsWith('.layout.vue') === true && node.path !== '' && node.path !== '/'
}

export function applyFileRouteConventions(root: LayoutTreeNode, isRoutesRoot = true): void {
  const layouts = root.children.filter(isLayoutFile)
  if (layouts.length) {
    if (isRoutesRoot) throw new Error(`Route layout must be below routes root: ${layouts[0].component}`)
    const layout = layouts.at(-1)!
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
  if (!root.component) root.name = false
}
