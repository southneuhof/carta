import { describe, expect, it } from 'vitest'
import { allowsItpOperation, buildItpTree, canCreateItp, type ItpTreeTableRow } from './itp.tree'
import type { InspectionTestPlanTreeNode } from '@southneuhof/api/routes/inspection-test-plans/inspection-test-plans.schemas'

function node(overrides: Partial<InspectionTestPlanTreeNode> = {}): InspectionTestPlanTreeNode {
  return {
    id: 'root',
    projectId: 'project-1',
    parentId: null,
    level: 0,
    code: '1',
    name: 'Root',
    isLeaf: false,
    availableTypes: [],
    itps: [],
    children: [],
    ...overrides,
  }
}

function plan(id: string, type: 'material' | 'process' | 'product' = 'material') {
  return {
    id,
    workItemId: 'leaf',
    type,
    criteria: null,
    procedureCode: null,
    specification: null,
    method: null,
    frequency: 1,
    imgDocumentation: null,
    description: null,
    active: true,
    allowedOperations: ['detail', 'update', 'delete'] as ('detail' | 'update' | 'delete')[],
  }
}

describe('ITP tree helpers', () => {
  it('builds nested work-item and plan rows', () => {
    const tree = [node({
      children: [node({ id: 'leaf', parentId: 'root', level: 1, code: '1.1', name: 'Leaf', isLeaf: true, availableTypes: ['process', 'product'], itps: [plan('itp-1')] })],
    })]
    const rows = buildItpTree(tree)
    expect(rows.map((row) => row.key)).toEqual(['work-item:root'])
    expect(rows[0]?.children.map((row) => row.key)).toEqual(['work-item:leaf'])
    expect(rows[0]?.children[0]?.children.map((row) => row.key)).toEqual(['itp:itp-1'])
  })

  it('allows missing types only on leaf rows and uses API operations', () => {
    const leaf = buildItpTree([node({ id: 'leaf', isLeaf: true, availableTypes: ['material'], itps: [] })])[0]!
    expect(canCreateItp(leaf, 'material')).toBe(true)
    expect(canCreateItp(leaf, 'process')).toBe(false)
    expect(canCreateItp({ kind: 'itp', key: 'itp:1', plan: plan('itp-1'), parentId: 'leaf', children: [] }, 'product')).toBe(false)
    expect(allowsItpOperation(plan('itp-1'), 'update')).toBe(true)
    expect(allowsItpOperation({ ...plan('itp-1'), allowedOperations: ['detail'] }, 'delete')).toBe(false)
  })

  it('keeps stable discriminated row keys', () => {
    const rows: ItpTreeTableRow[] = buildItpTree([node({ id: 'leaf', isLeaf: true, itps: [plan('itp-1')] })])
    expect(rows.map((row) => row.key)).toEqual(['work-item:leaf'])
    expect(rows[0]?.children.map((row) => row.key)).toEqual(['itp:itp-1'])
    expect(new Set([rows[0]?.key, rows[0]?.children[0]?.key]).size).toBe(2)
  })
})
