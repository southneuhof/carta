import { readFileSync } from 'node:fs'
import { parse } from 'vue/compiler-sfc'
import type { EditableTreeNode } from 'vue-router/unplugin'

function source(node: EditableTreeNode): string {
  return node.component ?? [...node.components.values()][0] ?? '<componentless route>'
}

function hasOutlet(component: string): boolean {
  const template = parse(readFileSync(component, 'utf8'), { filename: component }).descriptor.template?.ast
  if (!template) return false
  const pending: any[] = [template]
  while (pending.length) {
    const node = pending.pop()
    if (node.type === 1 && (node.tag === 'AppRouterView' || node.tag === 'RouterView' || node.tag === 'router-view')) return true
    if (node.children) pending.push(...node.children)
    if (node.branches) pending.push(...node.branches)
  }
  return false
}

function sameNode(first: EditableTreeNode | undefined, second: EditableTreeNode): boolean {
  return first === second || first?.components === second.components
}

function isAllowedSharedPath(first: EditableTreeNode, second: EditableTreeNode): boolean {
  return (first.path === '' && sameNode(first.parent, second)) || (second.path === '' && sameNode(second.parent, first))
}

export function validateRoutes(root: EditableTreeNode): void {
  const names = new Map<string, EditableTreeNode>()
  const paths = new Map<string, EditableTreeNode>()

  for (const node of root) {
    if (node.path === '' && node.parent?.component && node.name === node.parent.name) (node.parent as { name: string | false }).name = false
    if (node.component && node.children.some((child) => child.component || [...child].some((descendant) => descendant.component)) && !hasOutlet(node.component))
      throw new Error(`Rendered route parent has no RouterView outlet: ${node.component}`)

    if (!node.component) continue
    if (node.name) {
      const named = names.get(node.name)
      if (named && named !== node && !isAllowedSharedPath(named, node)) throw new Error(`Duplicate route name "${node.name}": ${source(named)} and ${source(node)}`)
      names.set(node.name, node)
    }

    if (!node.component.endsWith('.layout.vue')) {
      const patterned = paths.get(node.fullPath)
      if (patterned && patterned !== node && !isAllowedSharedPath(patterned, node)) throw new Error(`Duplicate route path "${node.fullPath}": ${source(patterned)} and ${source(node)}`)
      paths.set(node.fullPath, node)
    }
  }
}
