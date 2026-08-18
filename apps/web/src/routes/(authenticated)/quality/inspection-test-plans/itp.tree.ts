import type { InspectionTestPlanTreeNode, InspectionTestPlanTreeRow } from '@southneuhof/api/routes/inspection-test-plans/inspection-test-plans.schemas'

export type ItpTreeWorkItemRow = {
  kind: 'work-item'
  key: string
  node: InspectionTestPlanTreeNode
  children: readonly ItpTreeTableRow[]
}

export type ItpTreePlanRow = {
  kind: 'itp'
  key: string
  plan: InspectionTestPlanTreeRow
  parentId: string
  children: readonly ItpTreeTableRow[]
}

export type ItpTreeTableRow = ItpTreeWorkItemRow | ItpTreePlanRow

function buildWorkItemRow(node: InspectionTestPlanTreeNode): ItpTreeWorkItemRow {
  return {
    kind: 'work-item',
    key: `work-item:${node.id}`,
    node,
    children: [
      ...node.children.map(buildWorkItemRow),
      ...node.itps.map((plan): ItpTreePlanRow => ({ kind: 'itp', key: `itp:${plan.id}`, plan, parentId: node.id, children: [] })),
    ],
  }
}

export function buildItpTree(nodes: readonly InspectionTestPlanTreeNode[]): ItpTreeWorkItemRow[] {
  return nodes.map(buildWorkItemRow)
}

export function canCreateItp(row: ItpTreeTableRow, type: string): row is ItpTreeWorkItemRow {
  return row.kind === 'work-item' && row.node.isLeaf && row.node.availableTypes.includes(type as InspectionTestPlanTreeNode['availableTypes'][number])
}

export function allowsItpOperation(plan: InspectionTestPlanTreeRow, operation: 'detail' | 'update' | 'delete') {
  return plan.allowedOperations.includes(operation)
}
