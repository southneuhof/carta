import type { QualityInspectionTreeNode, SelectedWorkItemInput } from '@southneuhof/api/routes/quality-inspection/quality-inspection.schemas'

export function treeForRoot(tree: readonly QualityInspectionTreeNode[], rootId?: string | null) {
  return rootId ? tree.filter((node) => node.id === rootId) : []
}

export function selectableLeaves(tree: readonly QualityInspectionTreeNode[], rootId?: string | null) {
  const leaves: QualityInspectionTreeNode[] = []
  const visit = (nodes: readonly QualityInspectionTreeNode[]) => {
    for (const node of nodes) {
      if (node.isLeaf && node.itps.length) leaves.push(node)
      visit(node.children)
    }
  }
  visit(treeForRoot(tree, rootId))
  return leaves
}

export function selectedRowsForRoot(rows: readonly SelectedWorkItemInput[], tree: readonly QualityInspectionTreeNode[], rootId?: string | null) {
  const allowedIds = new Set(selectableLeaves(tree, rootId).map((node) => node.id))
  return rows.filter((row) => allowedIds.has(row.workItemId))
}
