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
import { permitWorkTypes } from '../src/routes/permit-work-types/permit-work-types.entity'
import { permitDangerSources } from '../src/routes/permit-danger-source/permit-danger-source.entity'
import { permitAttachments } from '../src/routes/permit-attachment/permit-attachment.entity'
import { safetyChecklists } from '../src/routes/safety-checklist/safety-checklist.entity'
import { permitCategoryApds } from '../src/routes/permit-category-apd/permit-category-apd.entity'
import { permitApds } from '../src/routes/permit-apd/permit-apd.entity'
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

import { seedEmergencySimulationTopic } from '../src/routes/emergency-simulation-topics/emergency-simulation-topics.seed'

import { seedEmergencySimulationEmployee } from '../src/routes/emergency-simulation-employees/emergency-simulation-employees.seed'

import { seedEmergencySimulationTool } from '../src/routes/emergency-simulation-tools/emergency-simulation-tools.seed'
import { seedTollCausesAccidents } from '../src/routes/toll-causes-accidents/toll-causes-accidents.seed'

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

const seededSafetyChecklists = [
  { id: 'safety-checklist-1', name: 'Apakah pekerja memahami pekerjaan yang akan dilakukan ?' },
  { id: 'safety-checklist-2', name: 'Apakah bahaya pekerjaan sudah dipahami ?' },
  { id: 'safety-checklist-3', name: 'Apakah tanda peringatan bahaya sudah dipasang ?' },
  { id: 'safety-checklist-4', name: 'Apakah peralatan sudah diamankan dari sumber bahaya ?' },
  { id: 'safety-checklist-5', name: 'Apakah peralatan bergerak sudah diisolasi ?' },
  { id: 'safety-checklist-6', name: 'Apakah peralatan sudah dipasang LOTO ?' },
  { id: 'safety-checklist-7', name: 'Lakukan pengamanan & pengawasan terhadap  percikan api las ?' },
  { id: 'safety-checklist-8', name: 'Bahan-bahan yang mudah terbakar, perlu dipindah atau dilindungi ?' },
  { id: 'safety-checklist-9', name: 'Apakah lubang-lubang disekitar pekerjaan sudah ditutup?' },
  { id: 'safety-checklist-10', name: 'Amankan area kerja dari tumpahan minyak dan bocoran gas ?' },
  { id: 'safety-checklist-11', name: 'Apakah ada pekerjaan lain disekitar tempat kerja ?' },
  { id: 'safety-checklist-12', name: 'Apakah semua peralatan sudah berada pada posisi aman ?' },
  { id: 'safety-checklist-13', name: 'Apakah peralatan elektrik sudah di grounding ?' },
  { id: 'safety-checklist-14', name: 'Apakah alat pemadam sudah tersedia ?' },
  { id: 'safety-checklist-15', name: 'Apakah petugas safety/ fire man stand by di lapangan ?\t' },
  { id: 'safety-checklist-16', name: 'Apakah penunjuk arah angin tersedia ?' },
  { id: 'safety-checklist-17', name: 'Apakah diperlukan ijin kerja lain ?' },
] as const

const seededPermitCategoryApds = [
  { id: 'permit-category-apd-1', name: 'Kepala' },
  { id: 'permit-category-apd-2', name: 'Wajah' },
  { id: 'permit-category-apd-3', name: 'Pernafasan' },
  { id: 'permit-category-apd-4', name: 'Telinga' },
  { id: 'permit-category-apd-5', name: 'Tangan' },
  { id: 'permit-category-apd-6', name: 'Badan' },
  { id: 'permit-category-apd-7', name: 'Kaki' },
  { id: 'permit-category-apd-8', name: 'Pada ketinggian' },
] as const

const seededPermitApds = [
  { id: 'permit-apd-1', permitCategoryApdId: 'permit-category-apd-1', name: 'Helmet' },
  { id: 'permit-apd-2', permitCategoryApdId: 'permit-category-apd-2', name: 'Face Shield' },
  { id: 'permit-apd-3', permitCategoryApdId: 'permit-category-apd-2', name: 'Safety Glass' },
  { id: 'permit-apd-4', permitCategoryApdId: 'permit-category-apd-2', name: 'Safety Googles' },
  { id: 'permit-apd-5', permitCategoryApdId: 'permit-category-apd-3', name: 'Masker' },
  { id: 'permit-apd-6', permitCategoryApdId: 'permit-category-apd-3', name: 'Respirator' },
  { id: 'permit-apd-7', permitCategoryApdId: 'permit-category-apd-3', name: 'SCBA' },
  { id: 'permit-apd-8', permitCategoryApdId: 'permit-category-apd-4', name: 'Ear Plug' },
  { id: 'permit-apd-9', permitCategoryApdId: 'permit-category-apd-4', name: 'Ear Muff' },
  { id: 'permit-apd-10', permitCategoryApdId: 'permit-category-apd-5', name: 'Hand Glove' },
  { id: 'permit-apd-11', permitCategoryApdId: 'permit-category-apd-6', name: 'Cover All' },
  { id: 'permit-apd-12', permitCategoryApdId: 'permit-category-apd-6', name: 'Apron' },
  { id: 'permit-apd-13', permitCategoryApdId: 'permit-category-apd-6', name: 'Work Vest' },
  { id: 'permit-apd-14', permitCategoryApdId: 'permit-category-apd-7', name: 'Safety Shoes' },
  { id: 'permit-apd-15', permitCategoryApdId: 'permit-category-apd-7', name: 'Safety Boot' },
  { id: 'permit-apd-16', permitCategoryApdId: 'permit-category-apd-8', name: 'Full Body Harness' },
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
  await seedEmergencySimulationTool()
  await seedEmergencySimulationTopic()
  await seedEmergencySimulationEmployee()
  await seedTollCausesAccidents()
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
  await db.insert(permitWorkTypes).values([
    { id: 'permit-work-type-1', name: 'Hot Work', active: true },
    { id: 'permit-work-type-2', name: 'Electrical', active: true },
    { id: 'permit-work-type-3', name: 'Cold Work', active: true },
    { id: 'permit-work-type-4', name: 'Demolition', active: true },
    { id: 'permit-work-type-5', name: 'Working At Height', active: true },
    { id: 'permit-work-type-6', name: 'Confined Space Entry', active: true },
    { id: 'permit-work-type-7', name: 'Gas Test', active: true },
    { id: 'permit-work-type-8', name: 'Excavation', active: true },
    { id: 'permit-work-type-9', name: 'Work Over Water', active: true },
    { id: 'permit-work-type-10', name: 'Radiography', active: true },
  ]).onConflictDoUpdate({
    target: permitWorkTypes.id,
    set: { name: sql`excluded.name`, active: true },
  })
  await db.insert(permitDangerSources).values([
    { id: 'permit-danger-source-1', name: 'Listrik', active: true },
    { id: 'permit-danger-source-2', name: 'Gas', active: true },
    { id: 'permit-danger-source-3', name: 'Ergonomi', active: true },
    { id: 'permit-danger-source-4', name: 'Penggalian', active: true },
    { id: 'permit-danger-source-5', name: 'Pada Ketinggian', active: true },
    { id: 'permit-danger-source-6', name: 'Bongkar Muat', active: true },
    { id: 'permit-danger-source-7', name: 'Alat listrik', active: true },
    { id: 'permit-danger-source-8', name: 'Bahan kimia', active: true },
    { id: 'permit-danger-source-9', name: 'Bertekanan', active: true },
    { id: 'permit-danger-source-10', name: 'Penggunaan Bahan Kimia', active: true },
    { id: 'permit-danger-source-11', name: 'Uji Bertekanan', active: true },
    { id: 'permit-danger-source-12', name: 'Pengecatan', active: true },
    { id: 'permit-danger-source-13', name: 'Moving part', active: true },
    { id: 'permit-danger-source-14', name: 'Bising', active: true },
    { id: 'permit-danger-source-15', name: 'Mudah terbakar', active: true },
    { id: 'permit-danger-source-16', name: 'Lifting', active: true },
    { id: 'permit-danger-source-17', name: 'Drilling', active: true },
    { id: 'permit-danger-source-18', name: 'Crane', active: true },
    { id: 'permit-danger-source-19', name: 'Kejatuhan', active: true },
    { id: 'permit-danger-source-20', name: 'Biologi', active: true },
  ]).onConflictDoUpdate({
    target: permitDangerSources.id,
    set: { name: sql`excluded.name`, active: true },
  })
  await db.insert(permitAttachments).values([
    { id: 'permit-attachment-1', name: 'Checklist Hot Work', code: null, description: null, active: true, permitWorkTypeId: 'permit-work-type-1' },
    { id: 'permit-attachment-2', name: 'Checklist Electrical', code: null, description: null, active: true, permitWorkTypeId: 'permit-work-type-2' },
    { id: 'permit-attachment-3', name: 'Checklist Cold Work', code: null, description: null, active: true, permitWorkTypeId: 'permit-work-type-3' },
    { id: 'permit-attachment-4', name: 'Checklist Demolition', code: null, description: null, active: true, permitWorkTypeId: 'permit-work-type-4' },
    { id: 'permit-attachment-5', name: 'Checklist Working At Height', code: null, description: null, active: true, permitWorkTypeId: 'permit-work-type-5' },
    { id: 'permit-attachment-6', name: 'Checklist Confined Space Entry', code: null, description: null, active: true, permitWorkTypeId: 'permit-work-type-6' },
    { id: 'permit-attachment-7', name: 'Checklist Gas Test', code: null, description: null, active: true, permitWorkTypeId: 'permit-work-type-6' },
    { id: 'permit-attachment-8', name: 'Checklist Excavation', code: null, description: null, active: true, permitWorkTypeId: 'permit-work-type-8' },
    { id: 'permit-attachment-9', name: 'Checklist Work Over Water', code: null, description: null, active: true, permitWorkTypeId: 'permit-work-type-8' },
    { id: 'permit-attachment-10', name: 'Checklist Radiography', code: null, description: null, active: true, permitWorkTypeId: 'permit-work-type-10' },
    { id: 'permit-attachment-11', name: 'CSA/JSA/AKK', code: null, description: null, active: false, permitWorkTypeId: null },
    { id: 'permit-attachment-12', name: 'Metode Kerja', code: null, description: null, active: true, permitWorkTypeId: null },
    { id: 'permit-attachment-13', name: 'Rigging/Lifting Plan', code: null, description: null, active: true, permitWorkTypeId: null },
    { id: 'permit-attachment-14', name: 'Rescue Plan', code: null, description: null, active: true, permitWorkTypeId: null },
    { id: 'permit-attachment-15', name: 'MSDS', code: null, description: null, active: true, permitWorkTypeId: null },
    { id: 'permit-attachment-16', name: 'Checklist Operator/Lisensi', code: null, description: null, active: true, permitWorkTypeId: null },
    { id: 'permit-attachment-17', name: 'Drawing Area Activity', code: null, description: null, active: true, permitWorkTypeId: null },
    { id: 'permit-attachment-18', name: 'Shop Drawing', code: null, description: null, active: true, permitWorkTypeId: null },
    { id: 'permit-attachment-19', name: 'LOTO', code: null, description: null, active: true, permitWorkTypeId: null },
    { id: 'permit-attachment-20', name: 'Checklist Kerja', code: null, description: null, active: true, permitWorkTypeId: null },
  ]).onConflictDoUpdate({
    target: permitAttachments.id,
    set: {
      name: sql`excluded.name`,
      code: sql`excluded.code`,
      description: sql`excluded.description`,
      active: sql`excluded.active`,
      permitWorkTypeId: sql`excluded.permit_work_type_id`,
    },
  })
  await db.insert(safetyChecklists).values(seededSafetyChecklists.map((checklist) => ({ ...checklist, active: true }))).onConflictDoUpdate({
    target: safetyChecklists.id,
    set: { name: sql`excluded.name`, active: true },
  })
  await db.insert(permitCategoryApds).values(seededPermitCategoryApds.map((category) => ({ ...category, active: true }))).onConflictDoUpdate({
    target: permitCategoryApds.id,
    set: { name: sql`excluded.name`, active: true },
  })
  await db.insert(permitApds).values(seededPermitApds.map((apd) => ({ ...apd, active: true }))).onConflictDoUpdate({
    target: permitApds.id,
    set: { permitCategoryApdId: sql`excluded.permit_category_apd_id`, name: sql`excluded.name`, active: true },
  })
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
