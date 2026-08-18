import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { and, eq, inArray } from 'drizzle-orm'
import { closeDb, getDb } from '../db'
import { businessCategories } from '../routes/business-categories/business-categories.entity'
import { divisions } from '../routes/divisions/divisions.entity'
import { projects } from '../routes/projects/projects.entity'
import { projectRoleAssignments, authorizationModules, permissions, rolePermissions, roles } from '../routes/roles/roles.entity'
import { users } from '../routes/users/users.entity'
import { workItems } from '../routes/work-items/work-items.entity'
import { itpInspectionPoints, itpInspectorTypes, inspectionTestPlanInspectorPoints, inspectionTestPlanInspectorTypes } from '../routes/inspection-test-plans/inspection-test-plans.entity'
import { createInspectionTestPlan, deleteInspectionTestPlan, getInspectionTestPlan, loadInspectionTestPlanTemplate, loadInspectionTestPlanTree, updateInspectionTestPlan } from '../routes/inspection-test-plans/inspection-test-plans.service'
import type { CreateInspectionTestPlanInput } from '../routes/inspection-test-plans/inspection-test-plans.schemas'

function id(name: string) {
  return `itp-test-${name}-${crypto.randomUUID()}`
}

const codes = ['create-work-item-itp', 'update-work-item-itp', 'delete-work-item-itp'] as const

async function fixture() {
  const db = getDb()
  const userId = id('user')
  const moduleId = id('module')
  const roleId = id('role')
  const businessCategoryId = id('business-category')
  const divisionId = id('division')
  const projectId = id('project')
  const otherProjectId = id('other-project')
  const parentId = id('parent')
  const leafId = id('leaf')
  const otherLeafId = id('other-leaf')

  await db.insert(users).values({ id: userId, name: 'ITP Test User', email: `${userId}@example.invalid` })
  await db.insert(authorizationModules).values({ id: moduleId, code: id('module-code'), name: 'ITP Test', realm: 'project' })
  await db.insert(roles).values({ id: roleId, roleCode: id('role-code'), name: 'ITP Test Role', realm: 'project' })
  const permissionRows = await db.select({ id: permissions.id, permissionCode: permissions.permissionCode }).from(permissions).where(inArray(permissions.permissionCode, [...codes]))
  const missing = codes.filter((code) => !permissionRows.some((row) => row.permissionCode === code))
  if (missing.length) await db.insert(permissions).values(missing.map((permissionCode) => ({ id: id(permissionCode), permissionCode, name: permissionCode, moduleId }))).onConflictDoNothing()
  const allPermissions = await db.select({ id: permissions.id }).from(permissions).where(inArray(permissions.permissionCode, [...codes]))
  await db.insert(rolePermissions).values(allPermissions.map(({ id: permissionId }) => ({ roleId, permissionId })))
  await db.insert(businessCategories).values({ id: businessCategoryId, code: id('business-category-code'), name: 'ITP Business' })
  await db.insert(divisions).values({ id: divisionId, businessCategoryId, code: id('division-code'), name: 'ITP Division' })
  await db.insert(projects).values([
    { id: projectId, divisionId, number: id('project-number'), integrationCode: id('integration'), name: 'ITP Project' },
    { id: otherProjectId, divisionId, number: id('other-project-number'), integrationCode: id('other-integration'), name: 'Other ITP Project' },
  ])
  await db.insert(projectRoleAssignments).values({ id: id('assignment'), userId, roleId, projectId, coverageType: 'project' })
  await db.insert(workItems).values([
    { id: parentId, projectId, code: id('parent-code'), name: 'Parent', level: 0 },
    { id: leafId, projectId, parentId, code: id('leaf-code'), name: 'Leaf', level: 1 },
    { id: otherLeafId, projectId: otherProjectId, code: id('other-leaf-code'), name: 'Other Leaf', level: 0 },
  ])

  for (const [code, name] of [['SC', 'SubCon'], ['HK', 'HK'], ['CONS', 'Konsultan'], ['OWN', 'Owner'], ['AUTH', 'Authority']] as const) {
    await db.insert(itpInspectorTypes).values({ id: id(`inspector-${code}`), code, name, active: true }).onConflictDoNothing()
  }
  for (const [code, name] of [['P', 'Perform'], ['R', 'Record'], ['W', 'Witness'], ['SW', 'Spot Witness'], ['S', 'Surveillance'], ['H', 'Hold Point']] as const) {
    await db.insert(itpInspectionPoints).values({ id: id(`point-${code}`), code, name, active: true }).onConflictDoNothing()
  }
  const types = await db.select({ id: itpInspectorTypes.id, code: itpInspectorTypes.code }).from(itpInspectorTypes).where(and(eq(itpInspectorTypes.active, true), inArray(itpInspectorTypes.code, ['SC', 'HK', 'CONS', 'OWN', 'AUTH'])))
  const points = await db.select({ code: itpInspectionPoints.code }).from(itpInspectionPoints).where(and(eq(itpInspectionPoints.active, true), inArray(itpInspectionPoints.code, ['P', 'R', 'W', 'SW', 'S', 'H'])))
  const grid = types.map((type) => ({ inspectorTypeId: type.id, points: points.map((point) => ({ inspectionPointCode: point.code, value: false })) }))
  return { db, userId, projectId, otherProjectId, parentId, leafId, otherLeafId, grid }
}

describe('inspection test plans', () => {
  let testFixture: Awaited<ReturnType<typeof fixture>>

  beforeAll(async () => {
    testFixture = await fixture()
  })

  it('returns the seeded active template in stable order', async () => {
    const template = await loadInspectionTestPlanTemplate(testFixture.projectId, testFixture.userId)
    expect(template.inspectorTypes.map((type) => [type.code, type.name])).toEqual([
      ['SC', 'SubCon'], ['HK', 'HK'], ['CONS', 'Konsultan'], ['OWN', 'Owner'], ['AUTH', 'Authority'],
    ])
    expect(template.inspectionPoints.map((point) => [point.code, point.name])).toEqual([
      ['P', 'Perform'], ['R', 'Record'], ['W', 'Witness'], ['SW', 'Spot Witness'], ['S', 'Surveillance'], ['H', 'Hold Point'],
    ])
  })

  it('requires a leaf and a positive integer frequency, then builds the tree', async () => {
    const input: CreateInspectionTestPlanInput = { workItemId: testFixture.leafId, type: 'material', frequency: 1, inspectors: testFixture.grid }
    await expect(createInspectionTestPlan(testFixture.userId, { ...input, frequency: 0 })).rejects.toThrow()
    await expect(createInspectionTestPlan(testFixture.userId, { ...input, frequency: 1.5 })).rejects.toThrow()
    await expect(createInspectionTestPlan(testFixture.userId, { ...input, workItemId: testFixture.parentId })).rejects.toThrow('leaf')
    const created = await createInspectionTestPlan(testFixture.userId, input)
    expect(created.type).toBe('material')
    expect(created.inspectors).toHaveLength(5)
    expect(created.inspectors.flatMap((inspector) => inspector.points).every((point) => point.value === false)).toBe(true)
    const tree = await loadInspectionTestPlanTree(testFixture.userId, testFixture.projectId)
    expect(tree[0]?.isLeaf).toBe(false)
    expect(tree[0]?.children[0]?.isLeaf).toBe(true)
    expect(tree[0]?.children[0]?.itps.map((plan) => plan.type)).toEqual(['material'])
    expect(tree[0]?.children[0]?.availableTypes).toEqual(['process', 'product'])
  })

  it('rejects duplicate active types, updates points, and soft-deletes for recreate', async () => {
    const created = await getInspectionTestPlan(testFixture.userId, (await loadInspectionTestPlanTree(testFixture.userId, testFixture.projectId))[0]!.children[0]!.itps[0]!.id)
    await expect(createInspectionTestPlan(testFixture.userId, { workItemId: testFixture.leafId, type: 'material', frequency: 2, inspectors: testFixture.grid })).rejects.toThrow('already exists')
    const nextGrid = testFixture.grid.map((inspector, index) => index === 0 ? { ...inspector, points: inspector.points.map((point, pointIndex) => pointIndex === 0 ? { ...point, value: true } : point) } : inspector)
    const updated = await updateInspectionTestPlan(testFixture.userId, created.id, { type: 'process', frequency: 2, inspectors: nextGrid })
    expect(updated.type).toBe('process')
    expect(updated.inspectors[0]?.points[0]?.value).toBe(true)
    const deleted = await deleteInspectionTestPlan(testFixture.userId, created.id)
    expect(deleted.active).toBe(false)
    await expect(getInspectionTestPlan(testFixture.userId, created.id)).rejects.toThrow()
    const replacement = await createInspectionTestPlan(testFixture.userId, { workItemId: testFixture.leafId, type: 'process', frequency: 1, inspectors: testFixture.grid })
    expect(replacement.id).not.toBe(created.id)
    const childRows = await testFixture.db.select({ id: inspectionTestPlanInspectorTypes.id }).from(inspectionTestPlanInspectorTypes).where(eq(inspectionTestPlanInspectorTypes.inspectionTestPlanId, created.id))
    const pointRows = childRows.length ? await testFixture.db.select({ id: inspectionTestPlanInspectorPoints.id }).from(inspectionTestPlanInspectorPoints).where(inArray(inspectionTestPlanInspectorPoints.inspectionTestPlanInspectorTypeId, childRows.map(({ id }) => id))) : []
    expect(childRows).toHaveLength(5)
    expect(pointRows).toHaveLength(30)
  })

  it('hides plans and projects outside coverage', async () => {
    await expect(loadInspectionTestPlanTemplate(testFixture.otherProjectId, testFixture.userId)).rejects.toThrow()
    await expect(loadInspectionTestPlanTree(testFixture.otherProjectId ? testFixture.userId : '', testFixture.otherProjectId)).rejects.toThrow()
    await expect(createInspectionTestPlan(testFixture.userId, { workItemId: testFixture.otherLeafId, type: 'product', frequency: 1, inspectors: testFixture.grid })).rejects.toThrow()
  })
})

afterAll(() => closeDb())
