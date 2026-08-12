import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { ptsWorkCategories } from '../pts-work-categories/pts-work-categories.resource'
import { uoms } from '../uoms/uoms.resource'
import { workItemsActions } from './work-items.actions'
import { workItemsSchema } from './work-items.schema'

function relationName(record: unknown, key: string) {
  if (!record || typeof record !== 'object') return undefined
  const relation = (record as Record<string, unknown>)[key]
  return relation && typeof relation === 'object' ? (relation as { name?: unknown }).name : undefined
}

const highRiskOptions = [
  { id: false, name: 'No' },
  { id: true, name: 'Yes' },
] as const

const fields = defineFields(workItemsSchema, {
  name: {},
  categoryId: {
    label: 'Category',
    read: (record) => relationName(record, 'category'),
    form: { renderer: 'lookup', source: ptsWorkCategories, props: { pick: 'id', view: 'name', required: true }, behavior: { visible: ({ context }) => context.variant !== 'child' } },
  },
  volume: { label: 'Volume', form: { renderer: 'number' } },
  uomId: {
    label: 'UOM',
    read: (record) => relationName(record, 'uom'),
    form: { renderer: 'lookup', source: uoms, props: { pick: 'id', view: 'name', required: true } },
  },
  isHighRisk: {
    label: 'High Risk',
    display: { renderer: 'chip', props: { options: { true: { color: 'error', label: 'High Risk' }, false: { color: 'neutral', label: 'No' } } } },
    form: { renderer: 'radio', source: highRiskOptions, props: { required: true } },
  },
})

export const workItems = defineResource(workItemsSchema, {
  key: 'work-items',
  actions: {
    list: {
      run: workItemsActions.list,
      fields: [fields.name, fields.categoryId, fields.volume, fields.uomId, fields.isHighRisk],
      permission: null,
      route: { name: 'master-data-work-items' },
    },
    detail: {
      run: workItemsActions.detail,
      fields: [fields.name, fields.categoryId, fields.volume, fields.uomId, fields.isHighRisk],
      permission: null,
    },
    create: {
      run: workItemsActions.create,
      fields: [fields.categoryId, fields.name, fields.volume, fields.uomId, fields.isHighRisk],
      permission: null,
    },
    update: {
      run: workItemsActions.update,
      fields: [fields.categoryId, fields.name, fields.volume, fields.uomId, fields.isHighRisk],
      permission: null,
    },
    delete: { run: workItemsActions.delete, permission: null },
    loadTree: { run: workItemsActions.loadTree },
  },
})
