import { createEntity } from '@southneuhof/sprindle/entity'
import { boolean, check, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod/v4'
import { divisions } from '../divisions/divisions.entity'
import { projects } from '../projects/projects.entity'
import { users } from '../users/users.entity'
import { authorizationRealms } from '../../authorization/catalog'

export const coverageTypes = ['all_projects', 'division', 'project'] as const
export type CoverageType = (typeof coverageTypes)[number]

export const coverageSchema = z.discriminatedUnion('coverageType', [
  z.object({ coverageType: z.literal('all_projects') }),
  z.object({ coverageType: z.literal('division'), divisionId: z.string().trim().min(1) }),
  z.object({ coverageType: z.literal('project'), projectId: z.string().trim().min(1) }),
])
export type CoverageInput = z.input<typeof coverageSchema>

export const auditFields = {
  createdByUserId: text('created_by_user_id').references(() => users.id),
  updatedByUserId: text('updated_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}

export const authorizationModules = pgTable('authorization_modules', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  realm: text('realm').notNull().$type<(typeof authorizationRealms)[number]>(),
  active: boolean('active').notNull().default(true),
  ...auditFields,
}, (table) => [check('authorization_modules_realm_check', sql`${table.realm} in ('system', 'project')`)])

export const permissions = pgTable('permissions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  permissionCode: text('permission_code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  moduleId: text('module_id').notNull().references(() => authorizationModules.id, { onDelete: 'restrict' }),
  active: boolean('active').notNull().default(true),
  ...auditFields,
})

export const roles = pgTable('roles', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  roleCode: text('role_code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  realm: text('realm').notNull().$type<(typeof authorizationRealms)[number]>(),
  active: boolean('active').notNull().default(true),
  ...auditFields,
}, (table) => [check('roles_realm_check', sql`${table.realm} in ('system', 'project')`)])

export const rolePermissions = pgTable('role_permissions', {
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: text('permission_id').notNull().references(() => permissions.id, { onDelete: 'restrict' }),
  active: boolean('active').notNull().default(true),
  ...auditFields,
}, (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })])

export const systemRoleAssignments = pgTable('system_role_assignments', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'restrict' }),
  active: boolean('active').notNull().default(true),
  ...auditFields,
}, (table) => [primaryKey({ columns: [table.userId, table.roleId] })])

export const projectRoleAssignments = pgTable('project_role_assignments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'restrict' }),
  coverageType: text('coverage_type').notNull().$type<CoverageType>(),
  divisionId: text('division_id').references(() => divisions.id, { onDelete: 'cascade' }),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  active: boolean('active').notNull().default(true),
  ...auditFields,
}, (table) => [
  check('project_role_assignments_coverage_check', sql`(
    (${table.coverageType} = 'all_projects' and ${table.divisionId} is null and ${table.projectId} is null)
    or (${table.coverageType} = 'division' and ${table.divisionId} is not null and ${table.projectId} is null)
    or (${table.coverageType} = 'project' and ${table.divisionId} is null and ${table.projectId} is not null)
  )`),
  uniqueIndex('project_role_assignments_all_projects_idx').on(table.userId, table.roleId).where(sql`${table.coverageType} = 'all_projects'`),
  uniqueIndex('project_role_assignments_division_idx').on(table.userId, table.roleId, table.divisionId).where(sql`${table.coverageType} = 'division'`),
  uniqueIndex('project_role_assignments_project_idx').on(table.userId, table.roleId, table.projectId).where(sql`${table.coverageType} = 'project'`),
])

export const authorizationAuditEvents = pgTable('authorization_audit_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  actorUserId: text('actor_user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  eventType: text('event_type').notNull(),
  targetUserId: text('target_user_id'),
  roleId: text('role_id'),
  coverageType: text('coverage_type').$type<CoverageType>(),
  divisionId: text('division_id'),
  projectId: text('project_id'),
  before: jsonb('before').notNull().default({}).$type<Record<string, unknown>>(),
  after: jsonb('after').notNull().default({}).$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
})

const write = { id: true, createdByUserId: true, updatedByUserId: true, createdAt: true, updatedAt: true } as const
const realmSchema = z.enum(authorizationRealms)

export const authorizationModule = createEntity({
  table: authorizationModules,
  schemas: {
    create: createInsertSchema(authorizationModules).omit(write).extend({ realm: realmSchema }),
    update: createUpdateSchema(authorizationModules).omit(write).extend({ realm: realmSchema.optional() }),
    select: createSelectSchema(authorizationModules),
  },
})

export const role = createEntity({
  table: roles,
  schemas: {
    create: createInsertSchema(roles).omit(write).extend({ realm: realmSchema }),
    update: createUpdateSchema(roles).omit(write).omit({ realm: true }).extend({ realm: z.never().optional() }),
    select: createSelectSchema(roles),
  },
})

export const permission = createEntity({
  table: permissions,
  schemas: {
    create: createInsertSchema(permissions).omit(write),
    update: createUpdateSchema(permissions).omit(write),
    select: createSelectSchema(permissions),
  },
})
