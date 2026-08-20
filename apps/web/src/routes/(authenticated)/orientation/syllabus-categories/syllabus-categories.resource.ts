import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { syllabusLookup } from '../orientation.lookups'
import { syllabusCategoryActions } from './syllabus-categories.actions'
import { syllabusCategoriesSchema } from './syllabus-categories.schema'

const activeOptions = [
  { id: true, name: 'Aktif' },
  { id: false, name: 'Tidak Aktif' },
] as const
const fields = defineFields(syllabusCategoriesSchema, {
  name: { label: 'Nama', form: { renderer: 'text', props: { required: true } } },
  imgThumbnail: { label: 'Foto Cover', form: { renderer: 'image' } },
  description: { label: 'Deskripsi', form: { renderer: 'textarea' } },
  active: { label: 'Status', form: { renderer: 'radio', source: activeOptions } },
})

export const syllabusCategories = defineResource(syllabusCategoriesSchema, {
  key: 'syllabus-categories',
  actions: {
    list: { run: syllabusCategoryActions.list, fields: [fields.name, fields.description, fields.active], permission: 'view-syllabus-categories', route: { name: 'orientation-syllabus-categories' } },
    detail: {
      run: syllabusCategoryActions.detail,
      fields: [fields.name, fields.imgThumbnail, fields.description, fields.active],
      permission: 'view-syllabus-categories',
      route: { name: 'orientation-syllabus-categories-detail', params: (id) => ({ syllabusCategoryId: String(id) }) },
    },
    create: {
      run: syllabusCategoryActions.create,
      fields: [fields.name, fields.imgThumbnail, fields.description, fields.active],
      permission: 'create-syllabus-categories',
      route: { name: 'orientation-syllabus-categories-create' },
      initialData: { active: true },
    },
    update: {
      run: syllabusCategoryActions.update,
      fields: [fields.name, fields.imgThumbnail, fields.description, fields.active],
      permission: 'update-syllabus-categories',
      route: { name: 'orientation-syllabus-categories-edit', params: (id) => ({ syllabusCategoryId: String(id) }) },
    },
    delete: { run: syllabusCategoryActions.delete, permission: 'delete-syllabus-categories' },
  },
})

export { fields as syllabusCategoryFields, syllabusLookup }
