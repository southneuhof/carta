import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { findingCategoryActions, findingCauseActions, findingCriteriaActions, findingTypeActions } from './hsse-observation.actions'
import { findingCategoriesSchema, findingCausesSchema, findingCriteriaSchema, findingTypesSchema } from './hsse-observation.schema'

const activeOptions = [
  { id: true, name: 'Aktif' },
  { id: false, name: 'Tidak Aktif' },
] as const

function relationName(record: unknown, key: string) {
  if (!record || typeof record !== 'object') return undefined
  const relation = (record as Record<string, unknown>)[key]
  return relation && typeof relation === 'object' ? (relation as { name?: unknown }).name : undefined
}

const criteriaFields = defineFields(findingCriteriaSchema, {
  name: { label: 'Nama', form: { renderer: 'text', props: { required: true } } },
  code: { label: 'Kode', form: { renderer: 'text' } },
  description: { label: 'Deskripsi', form: { renderer: 'textarea' } },
  active: { label: 'Status', form: { renderer: 'radio', source: activeOptions } },
})

const categoryFields = defineFields(findingCategoriesSchema, {
  name: { label: 'Nama', form: { renderer: 'text', props: { required: true } } },
  code: { label: 'Kode', form: { renderer: 'text', props: { required: true } } },
  findingTypeId: { label: 'Jenis Temuan' },
  findingType: { label: 'Jenis Temuan', read: (record) => relationName(record, 'findingType') },
  description: { label: 'Deskripsi', form: { renderer: 'textarea' } },
  active: { label: 'Status', form: { renderer: 'radio', source: activeOptions } },
})

const causeFields = defineFields(findingCausesSchema, {
  name: { label: 'Nama', form: { renderer: 'text', props: { required: true } } },
  code: { label: 'Kode', form: { renderer: 'text', props: { required: true } } },
  findingCategoryId: { label: 'Kategori Penyebab' },
  findingCategory: { label: 'Kategori Penyebab', read: (record) => relationName(record, 'findingCategory') },
  description: { label: 'Deskripsi', form: { renderer: 'textarea' } },
  active: { label: 'Status', form: { renderer: 'radio', source: activeOptions } },
})

export const findingCriteriaLookup = defineResource(findingCriteriaSchema, {
  key: 'finding-criteria',
  actions: {
    list: { run: findingCriteriaActions.list, fields: [criteriaFields.name], permission: 'view-finding-criteria' },
    detail: { run: findingCriteriaActions.detail, fields: [criteriaFields.name], permission: 'view-finding-criteria' },
  },
})

const typeFields = defineFields(findingTypesSchema, {
  name: { label: 'Nama', form: { renderer: 'text', props: { required: true } } },
  code: { label: 'Kode', form: { renderer: 'text' } },
  findingCriteriaCode: { label: 'Kriteria Temuan', form: { renderer: 'lookup', source: findingCriteriaLookup, props: { pick: 'code', view: 'name', required: true } } },
  findingCriteria: { label: 'Kriteria Temuan', read: (record) => relationName(record, 'findingCriteria') },
  description: { label: 'Deskripsi', form: { renderer: 'textarea' } },
  active: { label: 'Status', form: { renderer: 'radio', source: activeOptions } },
})

export const findingTypes = defineResource(findingTypesSchema, {
  key: 'finding-types',
  actions: {
    list: { run: findingTypeActions.list, fields: [typeFields.name], permission: 'view-finding-types', route: { name: 'master-data-hsse-observation' } },
    detail: {
      run: findingTypeActions.detail,
      fields: [typeFields.name, typeFields.code, typeFields.findingCriteria, typeFields.description, typeFields.active],
      permission: 'view-finding-types',
      route: { name: 'master-data-hsse-observation-detail', params: (id) => ({ findingTypeId: String(id) }) },
    },
    create: {
      run: findingTypeActions.create,
      fields: [typeFields.name, typeFields.code, typeFields.findingCriteriaCode, typeFields.description, typeFields.active],
      permission: 'create-finding-types',
      route: { name: 'master-data-hsse-observation-create' },
      initialData: { findingCriteriaCode: 'negative', active: true },
    },
    update: {
      run: findingTypeActions.update,
      fields: [typeFields.name, typeFields.code, typeFields.findingCriteriaCode, typeFields.description, typeFields.active],
      permission: 'update-finding-types',
      route: { name: 'master-data-hsse-observation-edit', params: (id) => ({ findingTypeId: String(id) }) },
    },
    delete: { run: findingTypeActions.delete, permission: 'delete-finding-types' },
  },
})

export function findingCategories(findingTypeId: string) {
  return defineResource(findingCategoriesSchema, {
    key: `finding-categories.${findingTypeId}`,
    actions: {
      list: {
        run: findingCategoryActions.list(findingTypeId),
        fields: [categoryFields.name, categoryFields.code, categoryFields.description, categoryFields.active],
        permission: 'view-finding-categories',
        route: { name: 'master-data-hsse-observation-detail-categories', params: { findingTypeId } },
      },
      detail: {
        run: findingCategoryActions.detail,
        fields: [categoryFields.name, categoryFields.code, categoryFields.findingType, categoryFields.description, categoryFields.active],
        permission: 'view-finding-categories',
        route: { name: 'master-data-hsse-observation-detail-categories-detail', params: (id) => ({ findingTypeId, findingCategoryId: String(id) }) },
      },
      create: {
        run: findingCategoryActions.create(findingTypeId),
        fields: [categoryFields.name, categoryFields.code, categoryFields.description, categoryFields.active],
        permission: 'create-finding-categories',
        route: { name: 'master-data-hsse-observation-detail-categories-create', params: { findingTypeId } },
        initialData: { findingTypeId, active: true },
      },
      update: {
        run: findingCategoryActions.update(findingTypeId),
        fields: [categoryFields.name, categoryFields.code, categoryFields.description, categoryFields.active],
        permission: 'update-finding-categories',
        route: { name: 'master-data-hsse-observation-detail-categories-edit', params: (id) => ({ findingTypeId, findingCategoryId: String(id) }) },
      },
      delete: { run: findingCategoryActions.delete, permission: 'delete-finding-categories' },
    },
  })
}

export function findingCauses(findingTypeId: string, findingCategoryId: string) {
  return defineResource(findingCausesSchema, {
    key: `finding-cause.${findingTypeId}.${findingCategoryId}`,
    actions: {
      list: {
        run: findingCauseActions.list(findingCategoryId),
        fields: [causeFields.name, causeFields.code, causeFields.description, causeFields.active],
        permission: 'view-finding-cause',
        route: { name: 'master-data-hsse-observation-detail-categories-detail-causes', params: { findingTypeId, findingCategoryId } },
      },
      detail: {
        run: findingCauseActions.detail,
        fields: [causeFields.name, causeFields.code, causeFields.findingCategory, causeFields.description, causeFields.active],
        permission: 'view-finding-cause',
        route: { name: 'master-data-hsse-observation-detail-categories-detail-causes-detail', params: (id) => ({ findingTypeId, findingCategoryId, findingCauseId: String(id) }) },
      },
      create: {
        run: findingCauseActions.create(findingCategoryId),
        fields: [causeFields.name, causeFields.code, causeFields.description, causeFields.active],
        permission: 'create-finding-cause',
        route: { name: 'master-data-hsse-observation-detail-categories-detail-causes-create', params: { findingTypeId, findingCategoryId } },
        initialData: { findingCategoryId, active: true },
      },
      update: {
        run: findingCauseActions.update(findingCategoryId),
        fields: [causeFields.name, causeFields.code, causeFields.description, causeFields.active],
        permission: 'update-finding-cause',
        route: { name: 'master-data-hsse-observation-detail-categories-detail-causes-edit', params: (id) => ({ findingTypeId, findingCategoryId, findingCauseId: String(id) }) },
      },
      delete: { run: findingCauseActions.delete, permission: 'delete-finding-cause' },
    },
  })
}

export type {
  FindingCategory,
  FindingCategoryCreate,
  FindingCategoryUpdate,
  FindingCause,
  FindingCauseCreate,
  FindingCauseUpdate,
  FindingCriteria,
  FindingCriteriaCreate,
  FindingCriteriaUpdate,
  FindingType,
  FindingTypeCreate,
  FindingTypeUpdate,
} from './hsse-observation.schema'
