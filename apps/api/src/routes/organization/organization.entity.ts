import { createEntity } from '@southneuhof/sprindle/entity'
import { boolean, pgTable, text, timestamp, type AnyPgColumn } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { users } from '../users/users.entity'

/**
 * The whole organizational graph lives in one module because it is mutually
 * referential: an employee belongs to a section group, and a section group is
 * coordinated by an employee. Splitting these across modules makes the import
 * cycle degrade both tables to `any` under TypeScript's inference, which silently
 * disables relation type-checking. Entities, models and routes still live in their
 * own resource folders — only the table declarations are colocated.
 */

export const sectionTypes = pgTable('section_types', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
})

export const tollSections = pgTable('toll_sections', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  sectionTypeId: text('section_type_id').references(() => sectionTypes.id),
})

export const jobPositions = pgTable('job_positions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
})

/**
 * A person in the org chart. `userId` is nullable on purpose: people exist here
 * without a login, and a login exists without a person until one is linked.
 */
export const employees = pgTable('employees', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  fullName: text('full_name').notNull(),
  userId: text('user_id').unique().references(() => users.id),
  sectionId: text('section_id').references(() => tollSections.id),
  jobPositionId: text('job_position_id').references(() => jobPositions.id),
  sectionGroupId: text('section_group_id').references(() => sectionGroups.id),
  sectionRantingId: text('section_ranting_id').references(() => sectionRantings.id),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
})

/**
 * `koregEmployeeId` is the shift coordinator — the `ka_shift` verificator target.
 *
 * The `AnyPgColumn` return annotation is required, not stylistic: `employees` and
 * `sectionGroups` reference each other, and without it TypeScript resolves the
 * inference cycle by widening both tables to `any`, which silently disables relation
 * type-checking downstream. Same for `sectionRantings` below.
 */
export const sectionGroups = pgTable('section_groups', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  sectionId: text('section_id').references(() => tollSections.id),
  koregEmployeeId: text('koreg_employee_id').references((): AnyPgColumn => employees.id),
})

/** `headEmployeeId` is the ranting head — the `ka_ranting` verificator target. */
export const sectionRantings = pgTable('section_rantings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  sectionId: text('section_id').references(() => tollSections.id),
  headEmployeeId: text('head_employee_id').references((): AnyPgColumn => employees.id),
})

export const sectionType = createEntity({
  table: sectionTypes,
  schemas: {
    create: createInsertSchema(sectionTypes).omit({ id: true }),
    update: createUpdateSchema(sectionTypes).omit({ id: true }),
    select: createSelectSchema(sectionTypes),
  },
})

export const tollSection = createEntity({
  table: tollSections,
  schemas: {
    create: createInsertSchema(tollSections).omit({ id: true }),
    update: createUpdateSchema(tollSections).omit({ id: true }),
    select: createSelectSchema(tollSections),
  },
})

export const jobPosition = createEntity({
  table: jobPositions,
  schemas: {
    create: createInsertSchema(jobPositions).omit({ id: true }),
    update: createUpdateSchema(jobPositions).omit({ id: true }),
    select: createSelectSchema(jobPositions),
  },
})
