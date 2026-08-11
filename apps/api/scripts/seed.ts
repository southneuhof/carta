import { eq, sql } from 'drizzle-orm'
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
  const permissionRows = await db.select({ id: permissions.id, code: permissions.permissionCode }).from(permissions)
  const rolePermissionsByRealm = new Map([
    ['system', 'role-super-administrator'],
    ['project', 'role-project-administrator'],
  ] as const)
  const rolePermissionRows = permissionRows.map((permission) => {
    const module = moduleCatalog.find((item) => item.permissions.some((entry) => entry.code === permission.code))!
    return { roleId: rolePermissionsByRealm.get(module.realm)!, permissionId: permission.id, active: true }
  })
  await db.insert(rolePermissions).values(rolePermissionRows).onConflictDoUpdate({
    target: [rolePermissions.roleId, rolePermissions.permissionId],
    set: { active: true },
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
  }).onConflictDoUpdate({ target: projectRoleAssignments.id, set: { active: true } })

  await db.insert(businessCategories).values({ id: 'business-category-default', code: 'DEFAULT', name: 'Default', active: true }).onConflictDoNothing()
  await db.insert(divisions).values({ id: 'division-default', businessCategoryId: 'business-category-default', code: 'DEFAULT', name: 'Default', active: true }).onConflictDoNothing()
  await db.insert(projects).values({ id: 'project-default', divisionId: 'division-default', number: 'DEFAULT', integrationCode: 'DEFAULT', name: 'Default Project', active: true }).onConflictDoNothing()
  await db.insert(uoms).values({ id: 'uom-each', code: 'EA', name: 'Each', active: true }).onConflictDoNothing()
  await db.insert(workItems).values({ id: 'work-item-category-default', projectId: 'project-default', code: 'CATEGORY', name: 'Default Category', level: 0, active: true }).onConflictDoNothing()
  await db.insert(workItems).values({ id: 'work-item-default', projectId: 'project-default', parentId: 'work-item-category-default', code: 'ITEM', name: 'Default Item', level: 1, uomId: 'uom-each', active: true }).onConflictDoNothing()
  await db.insert(ptsWorkCategories).values({ id: 'pts-category-default', code: 'DEFAULT', name: 'Default', active: true }).onConflictDoNothing()
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
  await closeDb()
}

main().catch(async (error: unknown) => {
  await closeDb()
  throw error
})
