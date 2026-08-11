import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { workItem } from '@southneuhof/api/routes/work-items/work-items.entity'
import { ptsWorkCategories } from '../pts-work-categories/pts-work-categories.resource'
import { uoms } from '../uoms/uoms.resource'
import { workItemOperations, type WorkItem, type WorkItemCreate, type WorkItemUpdate } from './work-items.operations'

function relationName(record: unknown, key: string) {
  if (!record || typeof record !== 'object') return undefined
  const relation = (record as Record<string, unknown>)[key]
  return relation && typeof relation === 'object' ? (relation as { name?: unknown }).name : undefined
}

const highRiskOptions = [
  { id: false, name: 'No' },
  { id: true, name: 'Yes' },
] as const

export const workItems = defineResource({
  key: 'work-items',
  fields: defineFields<WorkItem, WorkItemCreate>()({
    categoryId: { label: 'Category', read: (record: unknown) => relationName(record, 'category'), form: { renderer: 'lookup', source: ptsWorkCategories, props: { pick: 'id', view: 'name', required: true }, behavior: { visible: ({ context }) => context.variant !== 'child' } } },
    name: {},
    volume: { label: 'Volume', form: { renderer: 'number' } },
    uomId: { label: 'UOM', read: (record: unknown) => relationName(record, 'uom'), form: { renderer: 'lookup', source: uoms, props: { pick: 'id', view: 'name', required: true } } },
    isHighRisk: { label: 'High Risk', display: { renderer: 'chip', props: { options: { true: { color: 'error', label: 'High Risk' }, false: { color: 'neutral', label: 'No' } } } }, form: { renderer: 'radio', source: highRiskOptions, props: { required: true } } },
  }),
  table: { fields: ['name', 'categoryId', 'volume', 'uomId', 'isHighRisk'] },
  detail: { fields: ['name', 'categoryId', 'volume', 'uomId', 'isHighRisk'] },
  form: { fields: ['categoryId', 'name', 'volume', 'uomId', 'isHighRisk'] },
  schemas: { create: fromZod<WorkItemCreate>(workItem.schemas.create), update: fromZod<WorkItemUpdate>(workItem.schemas.update) },
  capabilities: {
    list: { handler: workItemOperations.list, permission: null, to: { name: 'master-data-work-items' } },
    create: { handler: workItemOperations.create, permission: null },
    detail: { handler: workItemOperations.detail, permission: null },
    update: { handler: workItemOperations.update, permission: null },
    delete: { handler: workItemOperations.delete, permission: null },
  },
})
