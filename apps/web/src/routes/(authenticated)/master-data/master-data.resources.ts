import { defineFields, defineResource, defineResourceOperations, fromZod as frameworkFromZod } from '@southneuhof/is-vue-framework'
import { createHonoResourceOperations } from '@southneuhof/is-vue-framework/hono'
import type { z } from 'zod/v4'
import { businessCategory, division, numberConfig, numberVariable, project, projectVendor, ptsWorkCategory, rootCause, uom, workItem } from '@southneuhof/api/routes/master-data/master-data.entity'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'

function fromZod<T extends object>(schema: z.ZodType<T>) {
  return frameworkFromZod<T>(schema)
}

function relationName(record: unknown, key: string) {
  if (!record || typeof record !== 'object') return undefined
  const relation = (record as Record<string, unknown>)[key]
  return relation && typeof relation === 'object' ? (relation as { name?: unknown }).name : undefined
}

const targets = {
  businessCategories: {
    list: { name: 'master-data-business-categories' },
    create: { name: 'master-data-business-categories-create' },
    detail: { name: 'master-data-business-categories-detail', params: (id: string) => ({ businessCategoryId: id }) },
    update: { name: 'master-data-business-categories-edit', params: (id: string) => ({ businessCategoryId: id }) },
  },
  divisions: {
    list: { name: 'master-data-divisions' },
    create: { name: 'master-data-divisions-create' },
    detail: { name: 'master-data-divisions-detail', params: (id: string) => ({ divisionId: id }) },
    update: { name: 'master-data-divisions-edit', params: (id: string) => ({ divisionId: id }) },
  },
  projects: {
    list: { name: 'master-data-projects' },
    create: { name: 'master-data-projects-create' },
    detail: { name: 'master-data-projects-detail', params: (id: string) => ({ projectId: id }) },
    update: { name: 'master-data-projects-edit', params: (id: string) => ({ projectId: id }) },
  },
  uoms: {
    list: { name: 'master-data-uoms' },
    create: { name: 'master-data-uoms-create' },
    detail: { name: 'master-data-uoms-detail', params: (id: string) => ({ uomId: id }) },
    update: { name: 'master-data-uoms-edit', params: (id: string) => ({ uomId: id }) },
  },
  workItems: {
    list: { name: 'master-data-work-items' },
    create: { name: 'master-data-work-items-create' },
    detail: { name: 'master-data-work-items-detail', params: (id: string) => ({ workItemId: id }) },
    update: { name: 'master-data-work-items-edit', params: (id: string) => ({ workItemId: id }) },
  },
  projectVendors: {
    list: { name: 'master-data-project-vendors' },
    create: { name: 'master-data-project-vendors-create' },
    detail: { name: 'master-data-project-vendors-detail', params: (id: string) => ({ projectVendorId: id }) },
    update: { name: 'master-data-project-vendors-edit', params: (id: string) => ({ projectVendorId: id }) },
  },
  ptsWorkCategories: {
    list: { name: 'master-data-pts-work-categories' },
    create: { name: 'master-data-pts-work-categories-create' },
    detail: { name: 'master-data-pts-work-categories-detail', params: (id: string) => ({ ptsWorkCategoryId: id }) },
    update: { name: 'master-data-pts-work-categories-edit', params: (id: string) => ({ ptsWorkCategoryId: id }) },
  },
  rootCauses: {
    list: { name: 'master-data-root-causes' },
    create: { name: 'master-data-root-causes-create' },
    detail: { name: 'master-data-root-causes-detail', params: (id: string) => ({ rootCauseId: id }) },
    update: { name: 'master-data-root-causes-edit', params: (id: string) => ({ rootCauseId: id }) },
  },
  numberVariables: {
    list: { name: 'master-data-number-variables' },
    create: { name: 'master-data-number-variables-create' },
    detail: { name: 'master-data-number-variables-detail', params: (id: string) => ({ numberVariableId: id }) },
    update: { name: 'master-data-number-variables-edit', params: (id: string) => ({ numberVariableId: id }) },
  },
  numberConfigs: {
    list: { name: 'master-data-number-configs' },
    create: { name: 'master-data-number-configs-create' },
    detail: { name: 'master-data-number-configs-detail', params: (id: string) => ({ numberConfigId: id }) },
    update: { name: 'master-data-number-configs-edit', params: (id: string) => ({ numberConfigId: id }) },
  },
} as const

const businessCategoryOperations = createHonoResourceOperations(rpc['business-categories'], dataAdapter)
const divisionOperations = defineResourceOperations<Division, Record<string, never>, z.input<typeof division.schemas.create>, z.input<typeof division.schemas.update>>()(createHonoResourceOperations(rpc.divisions, dataAdapter))
const projectOperations = defineResourceOperations<Project, Record<string, never>, z.input<typeof project.schemas.create>, z.input<typeof project.schemas.update>>()(createHonoResourceOperations(rpc.projects, dataAdapter))
const uomOperations = createHonoResourceOperations(rpc.uoms, dataAdapter)
const workItemOperations = defineResourceOperations<WorkItem, Record<string, never>, z.input<typeof workItem.schemas.create>, z.input<typeof workItem.schemas.update>>()(createHonoResourceOperations(rpc['work-items'], dataAdapter))
const projectVendorOperations = defineResourceOperations<ProjectVendor, Record<string, never>, z.input<typeof projectVendor.schemas.create>, z.input<typeof projectVendor.schemas.update>>()(createHonoResourceOperations(rpc['project-vendors'], dataAdapter))
const ptsWorkCategoryOperations = createHonoResourceOperations(rpc['pts-work-categories'], dataAdapter)
const rootCauseOperations = createHonoResourceOperations(rpc['root-causes'], dataAdapter)
const numberVariableOperations = createHonoResourceOperations(rpc['number-variables'], dataAdapter)
const numberConfigOperations = defineResourceOperations<NumberConfig, Record<string, never>, z.input<typeof numberConfig.schemas.create>, z.input<typeof numberConfig.schemas.update>>()(createHonoResourceOperations(rpc['number-configs'], dataAdapter))

export type BusinessCategory = z.output<typeof businessCategory.schemas.select>
export type Division = z.output<typeof division.schemas.select> & Record<string, unknown>
export type Project = z.output<typeof project.schemas.select> & Record<string, unknown>
export type Uom = z.output<typeof uom.schemas.select>
export type WorkItem = z.output<typeof workItem.schemas.select> & Record<string, unknown>
export type ProjectVendor = z.output<typeof projectVendor.schemas.select> & Record<string, unknown>
export type PtsWorkCategory = z.output<typeof ptsWorkCategory.schemas.select>
export type RootCause = z.output<typeof rootCause.schemas.select>
export type NumberVariable = z.output<typeof numberVariable.schemas.select>
export type NumberConfig = z.output<typeof numberConfig.schemas.select> & Record<string, unknown>

export const businessCategories = defineResource({
  key: 'business-categories',
  fields: defineFields<BusinessCategory, z.input<typeof businessCategory.schemas.create>>()({
    code: { label: 'Business Category', table: { sortable: true }, form: { renderer: 'text' } },
    name: { label: 'Name', form: { renderer: 'text' } },
    active: { label: 'Active', form: { renderer: 'checkbox' } },
  }),
  table: { fields: ['code', 'name', 'active'] },
  form: { fields: ['code', 'name', 'description', 'active'] },
  schemas: {
    create: fromZod<z.input<typeof businessCategory.schemas.create>>(businessCategory.schemas.create),
    update: fromZod<z.input<typeof businessCategory.schemas.update>>(businessCategory.schemas.update),
  },
  capabilities: {
    list: { handler: businessCategoryOperations.list, permission: 'view-business-categories', to: targets.businessCategories.list },
    create: { handler: businessCategoryOperations.create, permission: 'manage-business-categories', to: targets.businessCategories.create },
    detail: { handler: businessCategoryOperations.detail, permission: 'view-business-categories', to: targets.businessCategories.detail },
    update: { handler: businessCategoryOperations.update, permission: 'manage-business-categories', to: targets.businessCategories.update },
    delete: { handler: businessCategoryOperations.delete, permission: 'manage-business-categories' },
  },
})
const divisionCapabilities = {
  list: { handler: divisionOperations.list, permission: 'view-divisions', to: targets.divisions.list },
  create: { handler: divisionOperations.create, permission: 'manage-divisions', to: targets.divisions.create },
  detail: { handler: divisionOperations.detail, permission: 'view-divisions', to: targets.divisions.detail },
  update: { handler: divisionOperations.update, permission: 'manage-divisions', to: targets.divisions.update },
  delete: { handler: divisionOperations.delete, permission: 'manage-divisions' },
} as const

export const divisions = defineResource<typeof divisionCapabilities, Division, Record<string, never>, z.input<typeof division.schemas.create>, z.input<typeof division.schemas.update>>({
  key: 'divisions',
  fields: defineFields<Division, z.input<typeof division.schemas.create>>()({
    code: { label: 'Division', table: { sortable: true }, form: { renderer: 'text' } },
    name: { label: 'Name', form: { renderer: 'text' } },
    businessCategoryId: { label: 'Business Category', form: { renderer: 'lookup', source: businessCategories, props: { pick: 'id', view: 'name', required: true } } },
    businessCategory: { label: 'Business Category', read: (record: unknown) => relationName(record, 'businessCategory') },
    active: { label: 'Active', form: { renderer: 'checkbox' } },
  }),
  table: { fields: ['code', 'name', 'businessCategory', 'active'] },
  detail: { fields: ['businessCategory', 'code', 'name', 'description', 'active'] },
  form: { fields: ['businessCategoryId', 'code', 'name', 'description', 'active'] },
  schemas: { create: fromZod(division.schemas.create), update: fromZod(division.schemas.update) },
  capabilities: divisionCapabilities,
})
const projectCapabilities = {
  list: { handler: projectOperations.list, permission: 'view-projects', to: targets.projects.list },
  create: { handler: projectOperations.create, permission: 'manage-projects', to: targets.projects.create },
  detail: { handler: projectOperations.detail, permission: 'view-projects', to: targets.projects.detail },
  update: { handler: projectOperations.update, permission: 'manage-projects', to: targets.projects.update },
  delete: { handler: projectOperations.delete, permission: 'manage-projects' },
} as const

export const projects = defineResource<typeof projectCapabilities, Project, Record<string, never>, z.input<typeof project.schemas.create>, z.input<typeof project.schemas.update>>({
  key: 'projects',
  fields: defineFields<Project, z.input<typeof project.schemas.create>>()({
    number: { label: 'Project Number', table: { sortable: true }, form: { renderer: 'text' } },
    name: { label: 'Project', table: { sortable: true }, form: { renderer: 'text' } },
    divisionId: { label: 'Division', form: { renderer: 'lookup', source: divisions, props: { pick: 'id', view: 'name', required: true } } },
    division: { label: 'Division', read: (record: unknown) => relationName(record, 'division') },
    integrationCode: { label: 'Integration Code', form: { renderer: 'text', props: { required: true } } },
    active: { label: 'Active', form: { renderer: 'checkbox' } },
    location: { label: 'Location', form: { renderer: 'text' } },
  }),
  table: { fields: ['number', 'name', 'division', 'active'] },
  detail: { fields: ['division', 'number', 'integrationCode', 'name', 'location', 'startDate', 'endDate', 'description', 'active'] },
  form: { fields: ['divisionId', 'number', 'integrationCode', 'name', 'location', 'startDate', 'endDate', 'description', 'active'] },
  schemas: { create: fromZod(project.schemas.create), update: fromZod(project.schemas.update) },
  capabilities: projectCapabilities,
})
export const uoms = defineResource({
  key: 'uoms',
  fields: defineFields<Uom, z.input<typeof uom.schemas.create>>()({
    code: { label: 'UOM', table: { sortable: true }, form: { renderer: 'text' } },
    name: { label: 'Name', form: { renderer: 'text' } },
    active: { label: 'Active', form: { renderer: 'checkbox' } },
  }),
  table: { fields: ['code', 'name', 'active'] },
  form: { fields: ['code', 'name', 'description', 'active'] },
  schemas: { create: fromZod(uom.schemas.create), update: fromZod(uom.schemas.update) },
  capabilities: {
    list: { handler: uomOperations.list, permission: 'view-uoms', to: targets.uoms.list },
    create: { handler: uomOperations.create, permission: 'manage-uoms', to: targets.uoms.create },
    detail: { handler: uomOperations.detail, permission: 'view-uoms', to: targets.uoms.detail },
    update: { handler: uomOperations.update, permission: 'manage-uoms', to: targets.uoms.update },
    delete: { handler: uomOperations.delete, permission: 'manage-uoms' },
  },
})

const workItemCapabilities = {
  list: { handler: workItemOperations.list, permission: 'view-work-items', to: targets.workItems.list },
  create: { handler: workItemOperations.create, permission: 'manage-work-items', to: targets.workItems.create },
  detail: { handler: workItemOperations.detail, permission: 'view-work-items', to: targets.workItems.detail },
  update: { handler: workItemOperations.update, permission: 'manage-work-items', to: targets.workItems.update },
  delete: { handler: workItemOperations.delete, permission: 'manage-work-items' },
} as const

export const workItems = defineResource<typeof workItemCapabilities, WorkItem, Record<string, never>, z.input<typeof workItem.schemas.create>, z.input<typeof workItem.schemas.update>>({
  key: 'work-items',
  fields: defineFields<WorkItem, z.input<typeof workItem.schemas.create>>()({
    code: { label: 'Work Item', table: { sortable: true }, form: { renderer: 'text' } },
    name: { label: 'Name', form: { renderer: 'text' } },
    projectId: { label: 'Project', form: { renderer: 'lookup', source: projects, props: { pick: 'id', view: 'name', required: true } } },
    project: { label: 'Project', read: (record: unknown) => relationName(record, 'project') },
    parentId: { label: 'Parent Work Item', form: { renderer: 'lookup', get source() { return workItems }, props: { pick: 'id', view: 'name' }, behavior: { visible: ({ draft }: { draft: z.input<typeof workItem.schemas.create> }) => draft.projectId != null, props: ({ draft }: { draft: z.input<typeof workItem.schemas.create> }) => ({ searchParameters: { projectId: draft.projectId } }), resetWhen: ({ draft }: { draft: z.input<typeof workItem.schemas.create> }) => draft.projectId } } },
    level: { label: 'Level', form: { renderer: 'number' } },
    uomId: { label: 'UOM', form: { renderer: 'lookup', source: uoms, props: { pick: 'id', view: 'name' } } },
    uom: { label: 'UOM', read: (record: unknown) => relationName(record, 'uom') },
    active: { label: 'Active', form: { renderer: 'checkbox' } },
  }),
  table: { fields: ['code', 'name', 'project', 'uom', 'active'] },
  detail: { fields: ['project', 'code', 'name', 'level', 'uom', 'active'] },
  form: { fields: ['projectId', 'parentId', 'code', 'name', 'level', 'uomId', 'active'] },
  schemas: { create: fromZod(workItem.schemas.create), update: fromZod(workItem.schemas.update) },
  capabilities: workItemCapabilities,
})
const projectVendorCapabilities = {
  list: { handler: projectVendorOperations.list, permission: 'view-project-vendors', to: targets.projectVendors.list },
  create: { handler: projectVendorOperations.create, permission: 'manage-project-vendors', to: targets.projectVendors.create },
  detail: { handler: projectVendorOperations.detail, permission: 'view-project-vendors', to: targets.projectVendors.detail },
  update: { handler: projectVendorOperations.update, permission: 'manage-project-vendors', to: targets.projectVendors.update },
  delete: { handler: projectVendorOperations.delete, permission: 'manage-project-vendors' },
} as const

export const projectVendors = defineResource<typeof projectVendorCapabilities, ProjectVendor, Record<string, never>, z.input<typeof projectVendor.schemas.create>, z.input<typeof projectVendor.schemas.update>>({
  key: 'project-vendors',
  fields: defineFields<ProjectVendor, z.input<typeof projectVendor.schemas.create>>()({
    name: { label: 'Project Vendor', table: { sortable: true }, form: { renderer: 'text' } },
    projectId: { label: 'Project', form: { renderer: 'lookup', source: projects, props: { pick: 'id', view: 'name', required: true } } },
    project: { label: 'Project', read: (record: unknown) => relationName(record, 'project') },
    active: { label: 'Active', form: { renderer: 'checkbox' } },
  }),
  table: { fields: ['name', 'project', 'active'] },
  detail: { fields: ['project', 'name', 'description', 'active'] },
  form: { fields: ['projectId', 'name', 'description', 'active'] },
  schemas: { create: fromZod(projectVendor.schemas.create), update: fromZod(projectVendor.schemas.update) },
  capabilities: projectVendorCapabilities,
})
export const ptsWorkCategories = defineResource({
  key: 'pts-work-categories',
  fields: defineFields<PtsWorkCategory, z.input<typeof ptsWorkCategory.schemas.create>>()({
    code: { label: 'PTS Work Category', table: { sortable: true }, form: { renderer: 'text' } },
    name: { label: 'Name', form: { renderer: 'text' } },
    active: { label: 'Active', form: { renderer: 'checkbox' } },
  }),
  table: { fields: ['code', 'name', 'active'] },
  form: { fields: ['code', 'name', 'description', 'active'] },
  schemas: { create: fromZod(ptsWorkCategory.schemas.create), update: fromZod(ptsWorkCategory.schemas.update) },
  capabilities: {
    list: { handler: ptsWorkCategoryOperations.list, permission: 'view-pts-work-categories', to: targets.ptsWorkCategories.list },
    create: { handler: ptsWorkCategoryOperations.create, permission: 'manage-pts-work-categories', to: targets.ptsWorkCategories.create },
    detail: { handler: ptsWorkCategoryOperations.detail, permission: 'view-pts-work-categories', to: targets.ptsWorkCategories.detail },
    update: { handler: ptsWorkCategoryOperations.update, permission: 'manage-pts-work-categories', to: targets.ptsWorkCategories.update },
    delete: { handler: ptsWorkCategoryOperations.delete, permission: 'manage-pts-work-categories' },
  },
})
export const rootCauses = defineResource({
  key: 'root-causes',
  fields: defineFields<RootCause, z.input<typeof rootCause.schemas.create>>()({
    code: { label: 'Root Cause', table: { sortable: true }, form: { renderer: 'text' } },
    name: { label: 'Name', form: { renderer: 'text' } },
    active: { label: 'Active', form: { renderer: 'checkbox' } },
  }),
  table: { fields: ['code', 'name', 'active'] },
  form: { fields: ['code', 'name', 'description', 'active'] },
  schemas: { create: fromZod(rootCause.schemas.create), update: fromZod(rootCause.schemas.update) },
  capabilities: {
    list: { handler: rootCauseOperations.list, permission: 'view-root-causes', to: targets.rootCauses.list },
    create: { handler: rootCauseOperations.create, permission: 'manage-root-causes', to: targets.rootCauses.create },
    detail: { handler: rootCauseOperations.detail, permission: 'view-root-causes', to: targets.rootCauses.detail },
    update: { handler: rootCauseOperations.update, permission: 'manage-root-causes', to: targets.rootCauses.update },
    delete: { handler: rootCauseOperations.delete, permission: 'manage-root-causes' },
  },
})
export const numberVariables = defineResource({
  key: 'number-variables',
  fields: defineFields<NumberVariable, z.input<typeof numberVariable.schemas.create>>()({
    code: { label: 'Number Variable', table: { sortable: true }, form: { renderer: 'text' } },
    name: { label: 'Name', form: { renderer: 'text' } },
    active: { label: 'Active', form: { renderer: 'checkbox' } },
  }),
  table: { fields: ['code', 'name', 'active'] },
  form: { fields: ['code', 'name', 'description', 'active'] },
  schemas: { create: fromZod(numberVariable.schemas.create), update: fromZod(numberVariable.schemas.update) },
  capabilities: {
    list: { handler: numberVariableOperations.list, permission: 'view-number-variables', to: targets.numberVariables.list },
    create: { handler: numberVariableOperations.create, permission: 'manage-number-variables', to: targets.numberVariables.create },
    detail: { handler: numberVariableOperations.detail, permission: 'view-number-variables', to: targets.numberVariables.detail },
    update: { handler: numberVariableOperations.update, permission: 'manage-number-variables', to: targets.numberVariables.update },
    delete: { handler: numberVariableOperations.delete, permission: 'manage-number-variables' },
  },
})
const numberConfigCapabilities = {
  list: { handler: numberConfigOperations.list, permission: 'view-number-configs', to: targets.numberConfigs.list },
  create: { handler: numberConfigOperations.create, permission: 'manage-number-configs', to: targets.numberConfigs.create },
  detail: { handler: numberConfigOperations.detail, permission: 'view-number-configs', to: targets.numberConfigs.detail },
  update: { handler: numberConfigOperations.update, permission: 'manage-number-configs', to: targets.numberConfigs.update },
  delete: { handler: numberConfigOperations.delete, permission: 'manage-number-configs' },
} as const

export const numberConfigs = defineResource<typeof numberConfigCapabilities, NumberConfig, Record<string, never>, z.input<typeof numberConfig.schemas.create>, z.input<typeof numberConfig.schemas.update>>({
  key: 'number-configs',
  fields: defineFields<NumberConfig, z.input<typeof numberConfig.schemas.create>>()({
    numberVariableCode: { label: 'Number Variable', table: { sortable: true }, form: { renderer: 'lookup', source: numberVariables, props: { pick: 'code', view: 'name', required: true, loadDetail: async ({ id }: { id?: string | number }) => (await numberVariableOperations.list({ query: {}, searchParameters: { code: String(id) } })).data[0] } } },
    numberVariable: { label: 'Number Variable', read: (record: unknown) => relationName(record, 'numberVariable') },
    displayOrder: { label: 'Display Order', table: { sortable: true }, form: { renderer: 'number' } },
    numberOfDigits: { label: 'Digits', form: { renderer: 'number' } },
    customCode: { label: 'Custom Code', form: { renderer: 'text' } },
    active: { label: 'Active', form: { renderer: 'checkbox' } },
  }),
  table: { fields: ['numberVariable', 'displayOrder', 'numberOfDigits', 'active'] },
  detail: { fields: ['numberVariable', 'displayOrder', 'numberOfDigits', 'customCode', 'description', 'active'] },
  form: { fields: ['numberVariableCode', 'displayOrder', 'numberOfDigits', 'customCode', 'description', 'active'] },
  schemas: { create: fromZod(numberConfig.schemas.create), update: fromZod(numberConfig.schemas.update) },
  capabilities: numberConfigCapabilities,
})

export const masterResources = { businessCategories, divisions, projects, uoms, workItems, projectVendors, ptsWorkCategories, rootCauses, numberVariables, numberConfigs } as const
export const masterOperations = {
  divisions: divisionOperations,
  projects: projectOperations,
  workItems: workItemOperations,
  ptsWorkCategories: ptsWorkCategoryOperations,
  rootCauses: rootCauseOperations,
} as const
export type MasterResourceKey = keyof typeof masterResources
