import { createEntity } from '@southneuhof/sprindle/entity'
import { defineRelationsPart } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { employees, jobPositions, tollSections } from '../organization/organization.entity'
import { users } from '../users/users.entity'

// The `employees` table is declared in `organization.entity.ts` with the rest of the
// mutually-referential org graph; the entity, relations and model stay here. It is
// deliberately not re-exported — drizzle-kit globs `*.entity.ts` and would read the
// same table twice.

export const employeeRelations = defineRelationsPart({ employees, users, tollSections, jobPositions }, (r) => ({
  employees: {
    account: r.one.users({ from: r.employees.userId, to: r.users.id }),
    section: r.one.tollSections({ from: r.employees.sectionId, to: r.tollSections.id }),
    jobPosition: r.one.jobPositions({ from: r.employees.jobPositionId, to: r.jobPositions.id }),
  },
}))

/**
 * `select` carries no relations, and that is a constraint rather than an omission.
 *
 * Relation hydration is one level deep: `materialize` builds its `with` clause from
 * the entity's own relation fields, so a *nested* entity is loaded without its own
 * relations and then fails its select schema. Since `overtimes.select` nests
 * `employee` (for the applicant), `employee` has to be a leaf.
 *
 * The relations below stay declared so a future reader can see what exists and so
 * a screen that needs them can join explicitly; they are simply not read here.
 */
export const employee = createEntity({
  table: employees,
  schemas: {
    create: createInsertSchema(employees).omit({ id: true, createdAt: true, updatedAt: true }),
    update: createUpdateSchema(employees).omit({ id: true, createdAt: true, updatedAt: true }),
    select: createSelectSchema(employees),
  },
})
