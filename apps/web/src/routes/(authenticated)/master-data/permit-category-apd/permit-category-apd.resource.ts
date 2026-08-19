import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import { permitApdActions } from './permit-apd.actions'
import { permitApdsSchema } from './permit-apd.schema'
import { permitCategoryApdsSchema } from './permit-category-apd.schema'

const api = createHonoResourceActions(rpc['permit-category-apd'], dataAdapter)

const activeOptions = [
  { id: true, name: 'Aktif' },
  { id: false, name: 'Tidak Aktif' },
] as const

const parentFields = defineFields(permitCategoryApdsSchema, {
  name: { label: 'Nama', form: { renderer: 'text', props: { required: true } } },
  description: { label: 'Deskripsi', form: { renderer: 'textarea' } },
  active: { label: 'Status', form: { renderer: 'radio', source: activeOptions } },
})

const childFields = defineFields(permitApdsSchema, {
  name: { label: 'Nama', form: { renderer: 'text', props: { required: true } } },
  description: { label: 'Deskripsi', form: { renderer: 'textarea' } },
  active: { label: 'Status', form: { renderer: 'radio', source: activeOptions } },
})

export const permitCategoryApds = defineResource(permitCategoryApdsSchema, {
  key: 'permit-category-apd',
  actions: {
    list: {
      run: api.list,
      fields: [parentFields.name, parentFields.description, parentFields.active],
      permission: 'view-permit-category-apd',
      route: { name: 'master-data-permit-category-apd' },
    },
    detail: {
      run: api.detail,
      fields: [parentFields.name, parentFields.description, parentFields.active],
      permission: 'view-permit-category-apd',
      route: { name: 'master-data-permit-category-apd-detail', params: (id) => ({ permitCategoryApdId: String(id) }) },
    },
    create: {
      run: api.create,
      fields: [parentFields.name, parentFields.description, parentFields.active],
      permission: 'create-permit-category-apd',
      route: { name: 'master-data-permit-category-apd-create' },
      initialData: { active: true },
    },
    update: {
      run: api.update,
      fields: [parentFields.name, parentFields.description, parentFields.active],
      permission: 'update-permit-category-apd',
      route: { name: 'master-data-permit-category-apd-edit', params: (id) => ({ permitCategoryApdId: String(id) }) },
    },
    delete: { run: api.delete, permission: 'delete-permit-category-apd' },
  },
})

export function permitApds(parentId: string) {
  return defineResource(permitApdsSchema, {
    key: 'permit-apd',
    actions: {
      list: {
        run: permitApdActions.list(parentId),
        fields: [childFields.name, childFields.description, childFields.active],
        permission: 'view-permit-apd',
        route: { name: 'master-data-permit-category-apd-detail-apd', params: { permitCategoryApdId: parentId } },
      },
      detail: {
        run: permitApdActions.detail(parentId),
        fields: [childFields.name, childFields.description, childFields.active],
        permission: 'view-permit-apd',
        route: { name: 'master-data-permit-category-apd-detail-apd-detail', params: (id) => ({ permitCategoryApdId: parentId, permitApdId: String(id) }) },
      },
      create: {
        run: permitApdActions.create(parentId),
        fields: [childFields.name, childFields.description, childFields.active],
        permission: 'create-permit-apd',
        route: { name: 'master-data-permit-category-apd-detail-apd-create', params: { permitCategoryApdId: parentId } },
        initialData: { permitCategoryApdId: parentId, active: true },
      },
      update: {
        run: permitApdActions.update(parentId),
        fields: [childFields.name, childFields.description, childFields.active],
        permission: 'update-permit-apd',
        route: { name: 'master-data-permit-category-apd-detail-apd-edit', params: (id) => ({ permitCategoryApdId: parentId, permitApdId: String(id) }) },
      },
      delete: { run: permitApdActions.delete(parentId), permission: 'delete-permit-apd' },
    },
  })
}

export type { PermitCategoryApd, PermitCategoryApdCreate, PermitCategoryApdUpdate } from './permit-category-apd.schema'
export type { PermitApd, PermitApdCreate, PermitApdUpdate } from './permit-apd.schema'
