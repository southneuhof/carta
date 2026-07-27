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
    root.components.set('default', layout.component!)
    root.meta = { ...layout.meta }
    for (const duplicate of layouts) duplicate.delete()
  }

  for (const child of root.children) applyFileRouteConventions(child, false)
  if (!root.component) root.name = false
}
