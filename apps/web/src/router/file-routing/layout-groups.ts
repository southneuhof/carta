import type { EditableTreeNode } from 'vue-router/unplugin'

type LayoutTreeNode = Pick<EditableTreeNode, 'children' | 'component' | 'components' | 'delete' | 'meta' | 'name' | 'path'>

const GROUP_SEGMENT = /^\(.+\)$/

function isLayout(node: LayoutTreeNode): boolean {
  return node.component?.endsWith('.layout.vue') ?? false
}

function isLayoutFile(node: LayoutTreeNode): boolean {
  return isLayout(node) && node.path !== '' && node.path !== '/'
}

/** Promotes each group's index layout onto its URL-transparent parent route. */
export function applyRouteGroupLayouts(root: LayoutTreeNode): void {
  const layouts = root.children.filter(isLayoutFile)
  if (layouts.length) {
    const layoutComponents = new Set(layouts.map((layout) => layout.component))
    const layout = layouts.at(-1)!
    const groupDirectory = layout.component?.split('/').at(-2) ?? ''
    if (!GROUP_SEGMENT.test(groupDirectory)) {
      throw new Error(`Route layout must be a direct child of a parenthesized route group: ${layout.component}`)
    }
    if (layoutComponents.size > 1) {
      throw new Error(`Route group ${groupDirectory} contains multiple direct *.layout.vue files`)
    }

    root.components.set('default', layout.component!)
    root.meta = { ...layout.meta }
    if (typeof layout.name === 'string') root.name = layout.name
    for (const duplicate of layouts) duplicate.delete()
  }

  // Parent-first promotion prevents an already-promoted nested shell from being
  // mistaken for another direct layout of its ancestor.
  for (const node of root.children) {
    if (!isLayoutFile(node)) applyRouteGroupLayouts(node)
  }
}
