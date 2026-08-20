import { hashPassword } from 'better-auth/crypto'
import { eq, or } from 'drizzle-orm'
import { getAuth } from '../auth/auth'
import { accounts, sessions } from '../auth/auth.entity'
import { authorizationModules, permissions, rolePermissions, roles, systemRoleAssignments } from '../roles/roles.entity'
import { users } from '../users/users.entity'
import { getDb } from '../../db'
import {
  learningMaterialAttachments,
  learningMaterialQuestionAnswers,
  learningMaterialQuestions,
  learningMaterials,
  syllabusCategories,
  syllabusCategoryMappings,
  syllabusCategoryRoles,
  syllabusLearningMaterialQuiz,
  syllabi,
} from './orientation.entity'

export function id(prefix: string) {
  return `orientation-test-${prefix}-${crypto.randomUUID()}`
}

export type OrientationFixture = {
  userId: string
  moduleId: string
  roleId: string
  cookie: string
}

export async function makeSession(permissionCodes: readonly string[]): Promise<OrientationFixture> {
  const db = getDb()
  const userId = id('user')
  const moduleId = id('module')
  const roleId = id('role')
  const email = `${userId}@example.invalid`
  await db.insert(users).values({ id: userId, name: 'Orientation Test User', email })
  await db.insert(accounts).values({ id: id('account'), accountId: userId, providerId: 'credential', userId, password: await hashPassword('test-password') })
  await db.insert(authorizationModules).values({ id: moduleId, code: id('module-code'), name: 'Orientation Test', realm: 'system' })
  await db.insert(roles).values({ id: roleId, roleCode: id('role-code'), name: 'Orientation Test Role', realm: 'system' })
  for (const permissionCode of permissionCodes) {
    await db.insert(permissions).values({ id: id(permissionCode), permissionCode, name: permissionCode, moduleId }).onConflictDoNothing()
    const permission = (await db.select({ id: permissions.id }).from(permissions).where(eq(permissions.permissionCode, permissionCode)).limit(1))[0]
    if (!permission) throw new Error(`Permission fixture is missing: ${permissionCode}`)
    await db.insert(rolePermissions).values({ roleId, permissionId: permission.id })
  }
  await db.insert(systemRoleAssignments).values({ userId, roleId })
  const signedIn = await getAuth().api.signInEmail({ body: { email, password: 'test-password' }, returnHeaders: true })
  const fixture = { userId, moduleId, roleId, cookie: signedIn.headers.get('set-cookie')?.split(';')[0] ?? '' }
  return fixture
}

export function jsonHeaders(cookie: string) {
  return { 'Content-Type': 'application/json', Cookie: cookie }
}

export async function cleanupFixture(fixture: OrientationFixture) {
  const db = getDb()
  const own = <T extends { createdByUserId: unknown; updatedByUserId: unknown }>(table: T) => or(eq(table.createdByUserId as never, fixture.userId), eq(table.updatedByUserId as never, fixture.userId))
  await db.delete(learningMaterialQuestionAnswers).where(own(learningMaterialQuestionAnswers))
  await db.delete(learningMaterialQuestions).where(own(learningMaterialQuestions))
  await db.delete(learningMaterialAttachments).where(own(learningMaterialAttachments))
  await db.delete(syllabusLearningMaterialQuiz).where(own(syllabusLearningMaterialQuiz))
  await db.delete(learningMaterials).where(own(learningMaterials))
  await db.delete(syllabusCategoryMappings).where(own(syllabusCategoryMappings))
  await db.delete(syllabusCategoryRoles).where(own(syllabusCategoryRoles))
  await db.delete(syllabusCategories).where(own(syllabusCategories))
  await db.delete(syllabi).where(own(syllabi))
  await db.delete(sessions).where(eq(sessions.userId, fixture.userId))
  await db.delete(accounts).where(eq(accounts.userId, fixture.userId))
  await db.delete(systemRoleAssignments).where(eq(systemRoleAssignments.userId, fixture.userId))
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, fixture.roleId))
  await db.delete(permissions).where(eq(permissions.moduleId, fixture.moduleId))
  await db.delete(roles).where(eq(roles.id, fixture.roleId))
  await db.delete(authorizationModules).where(eq(authorizationModules.id, fixture.moduleId))
  await db.delete(users).where(eq(users.id, fixture.userId))
}
