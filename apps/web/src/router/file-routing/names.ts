import type { TreeNode } from 'vue-router/unplugin'

export function staticRouteName(node: TreeNode): string {
  const segments: string[] = []
  for (let current: TreeNode | undefined = node; current; current = current.parent) {
    if (current.value.rawSegment === 'index' || current.value.rawSegment.startsWith('(')) continue
    const staticSegments = (current.value.subSegments ?? [current.value.rawSegment])
      .flatMap((segment) => (typeof segment === 'string' ? segment.split('/') : []))
      .filter((segment) => segment && !segment.includes('['))
    segments.unshift(...staticSegments)
  }
  return segments.join('-')
}
