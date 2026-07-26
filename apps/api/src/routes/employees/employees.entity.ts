import { createEntity } from '@southneuhof/sprindle/entity'
import { defineRelationsPart } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import {
  employees,
  jobPosition,
  jobPositions,
  tollSection,
  tollSections,
} from '../organization/organization.entity'
import { user, users } from '../users/users.entity'

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

export const employee = createEntity({
  table: employees,
  schemas: {
    create: createInsertSchema(employees).omit({ id: true, createdAt: true, updatedAt: true }),
    update: createUpdateSchema(employees).omit({ id: true, createdAt: true, updatedAt: true }),
    select: createSelectSchema(employees).extend({
      account: user.schemas.select.nullable(),
      section: tollSection.schemas.select.nullable(),
      jobPosition: jobPosition.schemas.select.nullable(),
    }),
  },
})
