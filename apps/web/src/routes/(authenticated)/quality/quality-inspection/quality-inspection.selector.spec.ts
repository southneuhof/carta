import { describe, expect, it } from 'vitest'
import type { QualityInspectionTreeNode, SelectedWorkItemInput } from '@southneuhof/api/routes/quality-inspection/quality-inspection.schemas'
import { selectableLeaves, selectedRowsForRoot, treeForRoot } from './quality-inspection.selector'

const node = (id: string, parentId: string | null, children: QualityInspectionTreeNode[] = [], itps: QualityInspectionTreeNode['itps'] = []): QualityInspectionTreeNode => ({
  id,
  projectId: 'project-1',
  parentId,
  level: parentId ? 1 : 0,
  code: id,
  name: id,
  categoryName: null,
  volume: null,
  uomName: null,
  isHighRisk: false,
  isLeaf: !children.length,
  itps,
  children,
})
const itp = { id: 'itp-1', type: 'material', criteria: null, procedureCode: null, specification: null, method: null, frequency: 1, imgDocumentation: null, description: null }

describe('Quality Inspection work-item selector scope', () => {
  const leafA = node('leaf-a', 'root-a', [], [itp])
  const leafB = node('leaf-b', 'root-b', [], [itp])
  const tree = [node('root-a', null, [leafA]), node('root-b', null, [leafB])]
  const rows: SelectedWorkItemInput[] = [
    { workItemId: 'leaf-a', volume: 1, itpTypeCodes: ['material'] },
    { workItemId: 'leaf-b', volume: 2, itpTypeCodes: ['material'] },
  ]

  it('has no selectable leaves before a root is selected', () => {
    expect(treeForRoot(tree, undefined)).toEqual([])
    expect(selectableLeaves(tree, undefined)).toEqual([])
    expect(selectedRowsForRoot(rows, tree, undefined)).toEqual([])
  })

  it('shows only the selected root and removes rows outside it', () => {
    expect(treeForRoot(tree, 'root-a').map((item) => item.id)).toEqual(['root-a'])
    expect(selectableLeaves(tree, 'root-a').map((item) => item.id)).toEqual(['leaf-a'])
    expect(selectedRowsForRoot(rows, tree, 'root-a')).toEqual([rows[0]])
    expect(selectedRowsForRoot(rows, tree, 'root-b')).toEqual([rows[1]])
  })
})
