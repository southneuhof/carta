import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import { syllabusLookup } from '../orientation.lookups'
import { learningMaterialActions } from './learning-materials.actions'
import { learningMaterialsSchema } from './learning-materials.schema'

const activeOptions = [
  { id: true, name: 'Aktif' },
  { id: false, name: 'Tidak Aktif' },
] as const
function relationName(record: unknown, key: string) {
  if (!record || typeof record !== 'object') return ''
  const value = (record as Record<string, unknown>)[key]
  return value && typeof value === 'object' && 'name' in value ? String((value as { name: unknown }).name) : ''
}

const fields = defineFields(learningMaterialsSchema, {
  name: { label: 'Judul', form: { renderer: 'text', props: { required: true } } },
  syllabusId: {
    label: 'Silabus',
    read: (record) => relationName(record, 'syllabus'),
    form: { renderer: 'lookup', source: syllabusLookup, props: { pick: 'id', view: 'name', required: true }, behavior: { props: () => ({ searchParameters: { active: true } }) } },
  },
  imgThumbnail: { label: 'Foto Cover', form: { renderer: 'image' } },
  file: { label: 'File', form: { renderer: 'file' } },
  description: { label: 'Deskripsi', form: { renderer: 'textarea' } },
  content: { label: 'Konten Materi', form: { renderer: 'rich-text', props: { required: true } } },
  type: { label: 'Tipe', form: { renderer: 'text' } },
  active: { label: 'Status', form: { renderer: 'radio', source: activeOptions } },
  isHaveQuiz: { label: 'Ada ujian', form: { renderer: 'switch' } },
  minScore: { label: 'Nilai minimal', form: { renderer: 'number' } },
  timeLimit: { label: 'Waktu pengerjaan', form: { renderer: 'number' } },
  isShuffleQuestion: { label: 'Acak pertanyaan', form: { renderer: 'switch' } },
  isShuffleOption: { label: 'Acak jawaban', form: { renderer: 'switch' } },
  totalQuestion: { label: 'Jumlah Pertanyaan' },
  displayOrder: { label: 'Urutan' },
})

const api = createHonoResourceActions(rpc['learning-materials'], dataAdapter)

export const learningMaterials = defineResource(learningMaterialsSchema, {
  key: 'learning-materials',
  actions: {
    list: {
      run: learningMaterialActions.list,
      fields: [fields.name, fields.syllabusId, fields.type, fields.active],
      permission: 'view-learning-materials',
      route: { name: 'orientation-learning-materials' },
    },
    detail: {
      run: learningMaterialActions.detail,
      fields: [fields.name, fields.syllabusId, fields.imgThumbnail, fields.description, fields.content, fields.active, fields.isHaveQuiz, fields.totalQuestion],
      permission: 'view-learning-materials',
      route: { name: 'orientation-learning-materials-detail', params: (id) => ({ learningMaterialId: String(id) }) },
    },
    create: {
      run: learningMaterialActions.create,
      fields: [fields.name, fields.syllabusId, fields.imgThumbnail, fields.file, fields.description, fields.content, fields.active],
      permission: 'create-learning-materials',
      route: { name: 'orientation-learning-materials-create' },
      initialData: { active: true, type: 'content', isHaveQuiz: false, isShuffleQuestion: false, isShuffleOption: false },
    },
    update: {
      run: learningMaterialActions.update,
      fields: [fields.name, fields.imgThumbnail, fields.file, fields.description, fields.content, fields.active],
      permission: 'update-learning-materials',
      route: { name: 'orientation-learning-materials-edit', params: (id) => ({ learningMaterialId: String(id) }) },
    },
    delete: { run: api.delete, permission: 'delete-learning-materials' },
  },
})

export const learningMaterialFields = fields
