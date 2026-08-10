import { authenticated, create, deleteRoute, detail, list, update } from '@southneuhof/sprindle/routes'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import type { ModelRuntimeEntity } from '@southneuhof/sprindle/source'
import { eq } from 'drizzle-orm'
import { requirePermission } from '../../identity'
import { getDb } from '../../db'
import {
  businessCategories,
  businessCategory,
  divisions,
  division,
  projects,
  project,
  uoms,
  uom,
  workItems,
  workItem,
  projectVendors,
  projectVendor,
  ptsWorkCategories,
  ptsWorkCategory,
  rootCauses,
  rootCause,
  numberVariables,
  numberVariable,
  numberConfigs,
  numberConfig,
  masterDataRelations,
} from './master-data.entity'
import { qhssePtsRootCauses } from '../qhsse-pts/qhsse-pts.entity'

type MasterName = 'business-categories' | 'divisions' | 'projects' | 'uoms' | 'work-items' | 'project-vendors' | 'pts-work-categories' | 'root-causes' | 'number-variables' | 'number-configs'

const permissionNames: Record<MasterName, string> = {
  'business-categories': 'business-categories',
  divisions: 'divisions',
  projects: 'projects',
  uoms: 'uoms',
  'work-items': 'work-items',
  'project-vendors': 'project-vendors',
  'pts-work-categories': 'pts-work-categories',
  'root-causes': 'root-causes',
  'number-variables': 'number-variables',
  'number-configs': 'number-configs',
}

const read = (name: MasterName) => [authenticated(), requirePermission(`view-${permissionNames[name]}`)]
const write = (name: MasterName) => [authenticated(), requirePermission(`manage-${permissionNames[name]}`)]

async function validateMaster(name: MasterName, route: string, state: { input?: unknown; id?: string }) {
  const input = state.input && typeof state.input === 'object' ? (state.input as Record<string, unknown>) : {}
  if (route === 'create' || route === 'update') {
    for (const key of ['code', 'number', 'integrationCode', 'numberVariableCode']) {
      if (key in input && typeof input[key] === 'string') input[key] = input[key].trim()
    }
    for (const key of ['code', 'number', 'integrationCode']) {
      if (key in input && input[key] === '') return `${key} is required.`
    }
  }
  const db = getDb()
  if (name === 'divisions' && (route === 'create' || route === 'update') && typeof input.businessCategoryId === 'string') {
    const parent = (await db.select({ active: businessCategories.active }).from(businessCategories).where(eq(businessCategories.id, input.businessCategoryId)).limit(1))[0]
    if (!parent) return 'Business category not found.'
    if (!parent.active) return 'Inactive business category cannot receive an active division.'
  }
  if (name === 'projects' && (route === 'create' || route === 'update') && typeof input.divisionId === 'string') {
    const parent = (await db.select({ active: divisions.active }).from(divisions).where(eq(divisions.id, input.divisionId)).limit(1))[0]
    if (!parent) return 'Division not found.'
    if (!parent.active) return 'Inactive division cannot receive an active project.'
  }
  if (name === 'work-items' && (route === 'create' || route === 'update')) {
    if (typeof input.projectId !== 'string') return 'Project is required.'
    const project = (await db.select({ active: projects.active }).from(projects).where(eq(projects.id, input.projectId)).limit(1))[0]
    if (!project) return 'Project not found.'
    if (!project.active) return 'Inactive project cannot receive an active work item.'
    if (input.parentId != null) {
      if (typeof input.parentId !== 'string' || input.parentId === state.id) return 'Work-item parent is invalid.'
      const parent = (
        await db
          .select({
            projectId: workItems.projectId,
            active: workItems.active,
            parentId: workItems.parentId,
          })
          .from(workItems)
          .where(eq(workItems.id, input.parentId))
          .limit(1)
      )[0]
      if (!parent || parent.projectId !== input.projectId) return 'Work-item parent must use the same project.'
      if (!parent.active) return 'Inactive work-item parent cannot receive an active child.'
      let current = parent.parentId
      while (current) {
        if (current === state.id) return 'Work-item parent cannot create a cycle.'
        current = (await db.select({ parentId: workItems.parentId }).from(workItems).where(eq(workItems.id, current)).limit(1))[0]?.parentId ?? null
      }
    }
  }
  if (name === 'project-vendors' && (route === 'create' || route === 'update') && typeof input.projectId === 'string') {
    const project = (await db.select({ active: projects.active }).from(projects).where(eq(projects.id, input.projectId)).limit(1))[0]
    if (!project) return 'Project not found.'
    if (!project.active) return 'Inactive project cannot receive a vendor.'
  }
  if (name === 'number-configs' && (route === 'create' || route === 'update')) {
    if (input.displayOrder != null && (!Number.isInteger(input.displayOrder) || Number(input.displayOrder) < 0)) return 'Display order must be a non-negative integer.'
    if (input.numberOfDigits != null && (!Number.isInteger(input.numberOfDigits) || Number(input.numberOfDigits) < 0)) return 'Digit count must be a non-negative integer.'
    if (input.active === true && typeof input.numberVariableCode === 'string') {
      const variable = (await db.select({ active: numberVariables.active }).from(numberVariables).where(eq(numberVariables.code, input.numberVariableCode)).limit(1))[0]
      if (!variable?.active) return 'Active number configuration needs an active number variable.'
    }
  }
  if (route === 'delete' && state.id) {
    const references =
      name === 'business-categories'
        ? await db.select({ id: divisions.id }).from(divisions).where(eq(divisions.businessCategoryId, state.id)).limit(1)
        : name === 'divisions'
        ? await db.select({ id: projects.id }).from(projects).where(eq(projects.divisionId, state.id)).limit(1)
        : name === 'projects'
        ? await db.select({ id: workItems.id }).from(workItems).where(eq(workItems.projectId, state.id)).limit(1)
        : name === 'uoms'
        ? await db.select({ id: workItems.id }).from(workItems).where(eq(workItems.uomId, state.id)).limit(1)
        : name === 'work-items'
        ? await db.select({ id: workItems.id }).from(workItems).where(eq(workItems.parentId, state.id)).limit(1)
        : name === 'root-causes'
        ? await db
            .select({ id: qhssePtsRootCauses.qhssePtsId })
            .from(qhssePtsRootCauses)
            .where(eq(qhssePtsRootCauses.rootCauseId, state.id as string))
            .limit(1)
        : []
    if (references.length) return 'Referenced records must be deactivated before delete.'
  }
  return undefined
}

function model<const TPath extends `/${string}`, TEntity extends ModelRuntimeEntity>(path: TPath, name: MasterName, entity: TEntity) {
  return defineModel({
    path,
    entity,
    routes: {
      list: list({ authorize: read(name) }),
      detail: detail({ authorize: read(name) }),
      create: create({ authorize: write(name) }),
      update: update({ authorize: write(name) }),
      delete: deleteRoute({ authorize: write(name) }),
    },
    validate: async ({ route, state }) => validateMaster(name, route.kind, state as { input?: unknown; id?: string }),
  })
}

export const domain = defineDomainPart({
  tables: {
    businessCategories,
    divisions,
    projects,
    uoms,
    workItems,
    projectVendors,
    ptsWorkCategories,
    rootCauses,
    numberVariables,
    numberConfigs,
  },
  entities: [businessCategory, division, project, uom, workItem, projectVendor, ptsWorkCategory, rootCause, numberVariable, numberConfig],
  relations: [masterDataRelations],
})

export const businessCategoryModel = model('/business-categories', 'business-categories', businessCategory)
export const divisionModel = model('/divisions', 'divisions', division)
export const projectModel = model('/projects', 'projects', project)
export const uomModel = model('/uoms', 'uoms', uom)
export const workItemModel = model('/work-items', 'work-items', workItem)
export const projectVendorModel = model('/project-vendors', 'project-vendors', projectVendor)
export const ptsWorkCategoryModel = model('/pts-work-categories', 'pts-work-categories', ptsWorkCategory)
export const rootCauseModel = model('/root-causes', 'root-causes', rootCause)
export const numberVariableModel = model('/number-variables', 'number-variables', numberVariable)
export const numberConfigModel = model('/number-configs', 'number-configs', numberConfig)

export default {
  domain,
  businessCategoryModel,
  divisionModel,
  projectModel,
  uomModel,
  workItemModel,
  projectVendorModel,
  ptsWorkCategoryModel,
  rootCauseModel,
  numberVariableModel,
  numberConfigModel,
}
