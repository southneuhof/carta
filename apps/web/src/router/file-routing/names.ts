import type { TreeNode } from 'vue-router/unplugin'

export function staticRouteName(node: TreeNode): string {
  const segments: string[] = []
  for (let current: TreeNode | undefined = node; current; current = current.parent) {
    const segment = current.value.rawSegment
    if (segment && segment !== 'index' && !segment.startsWith('(') && !segment.includes('[')) segments.unshift(segment)
  }
  return segments.join('-')
}
