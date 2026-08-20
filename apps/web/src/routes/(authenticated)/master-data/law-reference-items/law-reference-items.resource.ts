import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { lawReferenceItemsActions } from './law-reference-items.actions'
import { lawReferenceItemsSchema } from './law-reference-items.schema'

const typeOptions = [
  { id: 'reference', name: 'Reference' },
  { id: 'applicable', name: 'Applicable' },
] as const

const activeOptions = [
  { id: true, name: 'Berlaku' },
  { id: false, name: 'Tidak Berlaku' },
] as const

function relationName(record: unknown, key: string) {
  if (!record || typeof record !== 'object') return undefined
  const relation = (record as Record<string, unknown>)[key]
  return relation && typeof relation === 'object' ? (relation as { name?: unknown }).name : undefined
}

const fields = defineFields(lawReferenceItemsSchema, {
  lawReferenceCategoryCode: { label: 'Undang-Undang', read: (record) => relationName(record, 'category') },
  name: { label: 'Nama', form: { renderer: 'text', props: { required: true } } },
  level: { label: 'Level' },
  type: {
    label: 'Tipe',
    read: (record) => (record.type === 'reference' ? 'Reference' : record.type === 'applicable' ? 'Applicable' : undefined),
    form: { renderer: 'radio', source: typeOptions, props: { required: true }, behavior: { visible: ({ context }) => context.variant !== 'child' } },
  },
  parentId: { label: 'Parent', read: (record) => relationName(record, 'parent') },
  active: {
    label: 'Status',
    display: { renderer: 'chip', props: { options: { true: { color: 'success', label: 'Berlaku' }, false: { color: 'neutral', label: 'Tidak Berlaku' } } } },
    form: { renderer: 'radio', source: activeOptions, props: { required: true } },
  },
})

const treeFields = [fields.name, fields.type, fields.active]

export const lawReferenceItems = defineResource(lawReferenceItemsSchema, {
  key: 'law-reference-items',
  actions: {
    list: {
      run: lawReferenceItemsActions.list,
      fields: treeFields,
      permission: 'view-law-reference-items',
      route: { name: 'master-data-law-reference-items' },
    },
    detail: {
      run: lawReferenceItemsActions.detail,
      fields: [fields.lawReferenceCategoryCode, fields.name, fields.level, fields.type, fields.parentId, fields.active],
      permission: 'view-law-reference-items',
    },
    create: {
      run: lawReferenceItemsActions.create,
      fields: [fields.name, fields.type, fields.active],
      permission: 'create-law-reference-items',
    },
    update: {
      run: lawReferenceItemsActions.update,
      fields: [fields.name, fields.type, fields.active],
      permission: 'update-law-reference-items',
    },
    delete: { run: lawReferenceItemsActions.delete, permission: 'delete-law-reference-items' },
    loadTree: { run: lawReferenceItemsActions.loadTree },
  },
})
