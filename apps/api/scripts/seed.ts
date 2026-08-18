import { and, eq, inArray, isNull, sql } from 'drizzle-orm'
import { closeDb, getDb } from '../src/db'
import { authorizationModules as moduleCatalog } from '../src/authorization/catalog'
import { createAuth } from '../src/routes/auth/auth'
import { businessCategories } from '../src/routes/business-categories/business-categories.entity'
import { divisions } from '../src/routes/divisions/divisions.entity'
import { numberConfigs } from '../src/routes/number-configs/number-configs.entity'
import { numberVariables } from '../src/routes/number-variables/number-variables.entity'
import { projects } from '../src/routes/projects/projects.entity'
import { ptsWorkCategories } from '../src/routes/pts-work-categories/pts-work-categories.entity'
import { rootCauses } from '../src/routes/root-causes/root-causes.entity'
import { uoms } from '../src/routes/uoms/uoms.entity'
import { workItems } from '../src/routes/work-items/work-items.entity'
import { createQualityInspection } from '../src/routes/quality-inspection/quality-inspection.service'
import { qualityInspections, workItemSchedules } from '../src/routes/quality-inspection/quality-inspection.entity'
import {
  inspectionTestPlanInspectorPoints,
  inspectionTestPlanInspectorTypes,
  inspectionTestPlans,
  itpInspectionPoints,
  itpInspectorTypes,
} from '../src/routes/inspection-test-plans/inspection-test-plans.entity'
import {
  authorizationModules,
  permissions,
  projectRoleAssignments,
  rolePermissions,
  roles,
  systemRoleAssignments,
} from '../src/routes/roles/roles.entity'
import { users } from '../src/routes/users/users.entity'

const seedEmail = process.env.ADS_HK_ADMIN_EMAIL ?? 'admin@example.com'
const seedPassword = process.env.ADS_HK_ADMIN_PASSWORD ?? 'demo-password'
const seededQualityInspectionMarker = 'seed-quality-inspection-default'

const seededInspectorTypes = [
  { id: 'itp-inspector-type-sc', code: 'SC', name: 'SubCon' },
  { id: 'itp-inspector-type-hk', code: 'HK', name: 'HK' },
  { id: 'itp-inspector-type-cons', code: 'CONS', name: 'Konsultan' },
  { id: 'itp-inspector-type-own', code: 'OWN', name: 'Owner' },
  { id: 'itp-inspector-type-auth', code: 'AUTH', name: 'Authority' },
] as const

const seededInspectionPoints = [
  { id: 'itp-inspection-point-p', code: 'P', name: 'Perform' },
  { id: 'itp-inspection-point-r', code: 'R', name: 'Record' },
  { id: 'itp-inspection-point-w', code: 'W', name: 'Witness' },
  { id: 'itp-inspection-point-sw', code: 'SW', name: 'Spot Witness' },
  { id: 'itp-inspection-point-s', code: 'S', name: 'Surveillance' },
  { id: 'itp-inspection-point-h', code: 'H', name: 'Hold Point' },
] as const

type SeedItpPlan = {
  id: string
  type: 'material' | 'process' | 'product'
  criteria: string
  procedureCode: string
  specification: string
  method: string
  frequency: number
  description: string
  checked: Record<string, readonly string[]>
}

const seededItpPlans: SeedItpPlan[] = [
  {
    id: 'itp-default-material',
    type: 'material',
    criteria: 'Approved material is received before installation.',
    procedureCode: 'MAT-001',
    specification: 'Material matches the approved submittal and project specification.',
    method: 'Document review and visual inspection.',
    frequency: 1,
    description: 'Material receiving inspection.',
    checked: { SC: ['P', 'R'], HK: ['R', 'W'], CONS: ['R'], OWN: ['R'], AUTH: [] },
  },
  {
    id: 'itp-default-process',
    type: 'process',
    criteria: 'Installation follows the approved method statement.',
    procedureCode: 'PROC-001',
    specification: 'Workmanship and field measurements meet the approved drawings.',
    method: 'Site inspection and field measurement.',
    frequency: 1,
    description: 'Installation process inspection.',
    checked: { SC: ['P', 'R'], HK: ['W', 'S'], CONS: ['W', 'SW'], OWN: ['W'], AUTH: ['H'] },
  },
  {
    id: 'itp-default-product',
    type: 'product',
    criteria: 'Completed work is ready for final acceptance.',
    procedureCode: 'PROD-001',
    specification: 'Finished work meets the approved drawings and acceptance criteria.',
    method: 'Final inspection and test record review.',
    frequency: 1,
    description: 'Completed work acceptance inspection.',
    checked: { SC: ['P', 'R'], HK: ['R', 'W'], CONS: ['R', 'W', 'S'], OWN: ['W', 'H'], AUTH: ['H'] },
  },
]

async function seedAuthorization() {
  const db = getDb()
  await db.insert(authorizationModules).values(moduleCatalog.map((module) => ({
    id: `authorization-module-${module.code}`,
    code: module.code,
    name: module.name,
    realm: module.realm,
    active: module.active,
  }))).onConflictDoUpdate({
    target: authorizationModules.code,
    set: { name: sql`excluded.name`, realm: sql`excluded.realm`, active: true },
  })
  const moduleRows = await db.select({ id: authorizationModules.id, code: authorizationModules.code }).from(authorizationModules)
  const moduleIds = new Map(moduleRows.map((module) => [module.code, module.id]))
  const catalogPermissions = moduleCatalog.flatMap((module) => module.permissions.map((permission) => ({ ...permission, moduleCode: module.code })))
  await db.insert(permissions).values(catalogPermissions.map((permission) => ({
    id: `permission-${permission.code}`,
    permissionCode: permission.code,
    name: permission.name,
    description: permission.description,
    moduleId: moduleIds.get(permission.moduleCode)!,
    active: permission.active,
  }))).onConflictDoUpdate({
    target: permissions.permissionCode,
    set: { name: sql`excluded.name`, description: sql`excluded.description`, moduleId: sql`excluded.module_id`, active: true },
  })
  await db.insert(roles).values([
    { id: 'role-super-administrator', roleCode: 'super-administrator', name: 'Super Administrator', description: 'Full system administration.', realm: 'system', active: true },
    { id: 'role-project-administrator', roleCode: 'project-administrator', name: 'Project Administrator', description: 'Full project administration.', realm: 'project', active: true },
  ]).onConflictDoUpdate({
    target: roles.roleCode,
    set: { name: sql`excluded.name`, description: sql`excluded.description`, realm: sql`excluded.realm`, active: true },
  })
  const catalogPermissionCodes = new Set(catalogPermissions.map((permission) => permission.code))
  const permissionRows = await db.select({ id: permissions.id, code: permissions.permissionCode }).from(permissions)
  const stalePermissionIds = permissionRows.filter((permission) => !catalogPermissionCodes.has(permission.code)).map((permission) => permission.id)
  if (stalePermissionIds.length) await db.update(permissions).set({ active: false }).where(inArray(permissions.id, stalePermissionIds))
  const rolePermissionsByRealm = new Map([
    ['system', 'role-super-administrator'],
    ['project', 'role-project-administrator'],
  ] as const)
  await db.update(rolePermissions).set({ active: false }).where(inArray(rolePermissions.roleId, [...rolePermissionsByRealm.values()]))
  const rolePermissionRows = permissionRows.filter((permission) => catalogPermissionCodes.has(permission.code)).map((permission) => {
    const module = moduleCatalog.find((item) => item.permissions.some((entry) => entry.code === permission.code))!
    return { roleId: rolePermissionsByRealm.get(module.realm)!, permissionId: permission.id, active: true }
  })
  await db.insert(rolePermissions).values(rolePermissionRows).onConflictDoUpdate({
    target: [rolePermissions.roleId, rolePermissions.permissionId],
    set: { active: true },
  })
}

async function seedItpPlans(userId: string) {
  const db = getDb()
  const [inspectorTypes, inspectionPoints] = await Promise.all([
    db.select({ id: itpInspectorTypes.id, code: itpInspectorTypes.code }).from(itpInspectorTypes).where(eq(itpInspectorTypes.active, true)),
    db.select({ code: itpInspectionPoints.code }).from(itpInspectionPoints).where(eq(itpInspectionPoints.active, true)),
  ])
  const inspectorTypeIds = new Map(inspectorTypes.map((type) => [type.code, type.id]))
  const pointCodes = inspectionPoints.map((point) => point.code)

  for (const plan of seededItpPlans) {
    const existing = (await db.select({ id: inspectionTestPlans.id }).from(inspectionTestPlans).where(and(
      eq(inspectionTestPlans.workItemId, 'work-item-default'),
      eq(inspectionTestPlans.type, plan.type),
      eq(inspectionTestPlans.active, true),
    )).limit(1))[0]
    if (existing && existing.id !== plan.id) continue

    const timestamp = new Date().toISOString()
    await db.insert(inspectionTestPlans).values({
      id: plan.id,
      workItemId: 'work-item-default',
      type: plan.type,
      criteria: plan.criteria,
      procedureCode: plan.procedureCode,
      specification: plan.specification,
      method: plan.method,
      frequency: plan.frequency,
      description: plan.description,
      active: true,
      createdByUserId: userId,
      updatedByUserId: userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }).onConflictDoUpdate({
      target: inspectionTestPlans.id,
      set: {
        workItemId: 'work-item-default',
        type: plan.type,
        criteria: plan.criteria,
        procedureCode: plan.procedureCode,
        specification: plan.specification,
        method: plan.method,
        frequency: plan.frequency,
        description: plan.description,
        active: true,
        updatedByUserId: userId,
        updatedAt: timestamp,
      },
    })

    for (const inspectorType of seededInspectorTypes) {
      const inspectorTypeId = inspectorTypeIds.get(inspectorType.code)
      if (!inspectorTypeId) continue
      const child = (await db.insert(inspectionTestPlanInspectorTypes).values({
        inspectionTestPlanId: plan.id,
        inspectorTypeId,
        active: true,
        createdByUserId: userId,
        updatedByUserId: userId,
        createdAt: timestamp,
        updatedAt: timestamp,
      }).onConflictDoUpdate({
        target: [inspectionTestPlanInspectorTypes.inspectionTestPlanId, inspectionTestPlanInspectorTypes.inspectorTypeId],
        set: { active: true, updatedByUserId: userId, updatedAt: timestamp },
      }).returning({ id: inspectionTestPlanInspectorTypes.id }))[0]
      if (!child) throw new Error(`ITP inspector type was not seeded for ${plan.id}.`)

      const checked = new Set(plan.checked[inspectorType.code] ?? [])
      for (const inspectionPointCode of pointCodes) {
        await db.insert(inspectionTestPlanInspectorPoints).values({
          inspectionTestPlanInspectorTypeId: child.id,
          inspectionPointCode,
          value: checked.has(inspectionPointCode),
          active: true,
          createdByUserId: userId,
          updatedByUserId: userId,
          createdAt: timestamp,
          updatedAt: timestamp,
        }).onConflictDoUpdate({
          target: [inspectionTestPlanInspectorPoints.inspectionTestPlanInspectorTypeId, inspectionTestPlanInspectorPoints.inspectionPointCode],
          set: { value: checked.has(inspectionPointCode), active: true, updatedByUserId: userId, updatedAt: timestamp },
        })
      }
    }
  }
}

async function seedQualityInspection(userId: string) {
  const db = getDb()
  const timestamp = new Date().toISOString()
  await db.insert(workItemSchedules).values({
    id: 'work-item-schedule-default',
    projectId: 'project-default',
    workItemId: 'work-item-category-default',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    active: true,
    createdByUserId: userId,
    updatedByUserId: userId,
    createdAt: timestamp,
    updatedAt: timestamp,
  }).onConflictDoUpdate({
    target: workItemSchedules.id,
    set: {
      projectId: 'project-default',
      workItemId: 'work-item-category-default',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      active: true,
      createdByUserId: userId,
      updatedByUserId: userId,
      updatedAt: timestamp,
    },
  })

  const existing = (await db.select({ id: qualityInspections.id }).from(qualityInspections).where(and(
    eq(qualityInspections.locationZone, seededQualityInspectionMarker),
    isNull(qualityInspections.deletedAt),
  )).limit(1))[0]
  if (existing) return

  await createQualityInspection(userId, {
    divisionId: 'division-default',
    projectId: 'project-default',
    targetDate: '2026-08-18',
    qualityWorkCategoryId: 'pts-category-default',
    workItemCategoryId: 'work-item-category-default',
    locationZone: seededQualityInspectionMarker,
    selectedRows: [{ workItemId: 'work-item-default', volume: 1, itpTypeCodes: ['material'] }],
  })
}

async function main() {
  await seedAuthorization()
  const db = getDb()
  let admin = (await db.select({ id: users.id }).from(users).where(eq(users.email, seedEmail)).limit(1))[0]
  if (!admin) {
    const result = await createAuth({ allowSignUp: true }).api.signUpEmail({
      body: { name: 'ADS-HK Administrator', email: seedEmail, password: seedPassword },
    })
    if (!result.user?.id) throw new Error('Development administrator creation failed.')
    admin = { id: result.user.id }
  }
  await db.update(users).set({
    name: 'ADS-HK Administrator',
    username: process.env.ADS_HK_ADMIN_USERNAME ?? seedEmail.split('@')[0],
    statusCode: 'active',
  }).where(eq(users.id, admin.id))
  await db.insert(systemRoleAssignments).values({ userId: admin.id, roleId: 'role-super-administrator', active: true }).onConflictDoUpdate({
    target: [systemRoleAssignments.userId, systemRoleAssignments.roleId],
    set: { active: true },
  })
  await db.insert(projectRoleAssignments).values({
    id: 'project-assignment-admin',
    userId: admin.id,
    roleId: 'role-project-administrator',
    coverageType: 'all_projects',
    divisionId: null,
    projectId: null,
    active: true,
  }).onConflictDoUpdate({
    target: projectRoleAssignments.id,
    set: {
      userId: admin.id,
      roleId: 'role-project-administrator',
      coverageType: 'all_projects',
      divisionId: null,
      projectId: null,
      active: true,
    },
  })

  await db.insert(businessCategories).values({ id: 'business-category-default', code: 'DEFAULT', name: 'Default', active: true }).onConflictDoNothing()
  await db.insert(divisions).values({ id: 'division-default', businessCategoryId: 'business-category-default', code: 'DEFAULT', name: 'Default', active: true }).onConflictDoNothing()
  await db.insert(projects).values({ id: 'project-default', divisionId: 'division-default', number: 'DEFAULT', integrationCode: 'DEFAULT', name: 'Default Project', active: true }).onConflictDoNothing()
  await db.insert(uoms).values({ id: 'uom-each', code: 'EA', name: 'Each', active: true }).onConflictDoNothing()
  await db.insert(ptsWorkCategories).values({ id: 'pts-category-default', code: 'DEFAULT', name: 'Default', active: true }).onConflictDoNothing()
  await db.insert(workItems).values({ id: 'work-item-category-default', projectId: 'project-default', categoryId: 'pts-category-default', code: 'CATEGORY', name: 'Default Category', level: 0, active: true }).onConflictDoUpdate({
    target: workItems.id,
    set: { projectId: 'project-default', parentId: null, categoryId: 'pts-category-default', code: 'CATEGORY', name: 'Default Category', level: 0, active: true },
  })
  await db.insert(workItems).values({ id: 'work-item-default', projectId: 'project-default', parentId: 'work-item-category-default', categoryId: 'pts-category-default', code: 'ITEM', name: 'Default Item', level: 1, uomId: 'uom-each', active: true }).onConflictDoUpdate({
    target: workItems.id,
    set: { projectId: 'project-default', parentId: 'work-item-category-default', categoryId: 'pts-category-default', code: 'ITEM', name: 'Default Item', level: 1, uomId: 'uom-each', active: true },
  })
  await db.insert(rootCauses).values({ id: 'root-cause-default', code: 'DEFAULT', name: 'Default', active: true }).onConflictDoNothing()
  for (const [id, code] of [
    ['number-variable-number', 'number'],
    ['number-variable-form', 'form_name'],
    ['number-variable-project', 'project_number'],
    ['number-variable-division', 'division_code'],
    ['number-variable-year', 'year'],
    ['number-variable-month', 'month'],
  ] as const) {
    await db.insert(numberVariables).values({ id, code, name: code, active: true }).onConflictDoNothing()
  }
  await db.insert(numberConfigs).values([
    { id: 'number-config-number', numberVariableCode: 'number', numberOfDigits: 4, displayOrder: 1, active: true },
    { id: 'number-config-form', numberVariableCode: 'form_name', numberOfDigits: 0, displayOrder: 2, active: true },
    { id: 'number-config-project', numberVariableCode: 'project_number', numberOfDigits: 0, displayOrder: 3, active: true },
    { id: 'number-config-year', numberVariableCode: 'year', numberOfDigits: 0, displayOrder: 4, active: true },
  ]).onConflictDoNothing()
  await db.insert(itpInspectorTypes).values(seededInspectorTypes.map((type) => ({ ...type, active: true }))).onConflictDoUpdate({
    target: itpInspectorTypes.code,
    set: { name: sql`excluded.name`, active: true },
  })
  await db.insert(itpInspectionPoints).values(seededInspectionPoints.map((point) => ({ ...point, active: true }))).onConflictDoUpdate({
    target: itpInspectionPoints.code,
    set: { name: sql`excluded.name`, active: true },
  })
  await seedItpPlans(admin.id)
  await seedQualityInspection(admin.id)
  await closeDb()
}

main().catch(async (error: unknown) => {
  await closeDb()
  throw error
})
