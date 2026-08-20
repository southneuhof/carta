import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import { learningMaterialLookup } from '../orientation.lookups'
import { syllabusActions } from './syllabus.actions'
import { syllabusSchema } from './syllabus.schema'

const activeOptions = [
  { id: true, name: 'Aktif' },
  { id: false, name: 'Tidak Aktif' },
] as const
const api = createHonoResourceActions(rpc.syllabus, dataAdapter)

const fields = defineFields(syllabusSchema, {
  name: { label: 'Judul/Tema Silabus', form: { renderer: 'text', props: { required: true } } },
  imgThumbnail: { label: 'Foto Cover', form: { renderer: 'image' } },
  description: { label: 'Deskripsi', form: { renderer: 'textarea' } },
  active: { label: 'Status', display: { renderer: 'chip' }, form: { renderer: 'radio', source: activeOptions } },
  isHaveQuiz: { label: 'Ada ujian', form: { renderer: 'switch' } },
  questionType: { label: 'Tipe pertanyaan', form: { renderer: 'text' } },
  minScore: { label: 'Nilai minimal', form: { renderer: 'number' } },
  timeLimit: { label: 'Waktu pengerjaan', form: { renderer: 'number' } },
  isShuffleQuestion: { label: 'Acak pertanyaan', form: { renderer: 'switch' } },
  isShuffleOption: { label: 'Acak jawaban', form: { renderer: 'switch' } },
  totalQuestion: { label: 'Jumlah Pertanyaan' },
  createdAt: { label: 'Dibuat', display: { format: 'datetime' } },
  updatedAt: { label: 'Diubah', display: { format: 'datetime' } },
})

export const syllabi = defineResource(syllabusSchema, {
  key: 'syllabus',
  actions: {
    list: { run: syllabusActions.list, fields: [fields.name, fields.description, fields.active], permission: 'view-syllabus', route: { name: 'orientation-syllabus' } },
    detail: {
      run: syllabusActions.detail,
      fields: [fields.name, fields.imgThumbnail, fields.description, fields.active, fields.isHaveQuiz, fields.totalQuestion],
      permission: 'view-syllabus',
      route: { name: 'orientation-syllabus-detail', params: (id) => ({ syllabusId: String(id) }) },
    },
    create: {
      run: syllabusActions.create,
      fields: [fields.name, fields.imgThumbnail, fields.description, fields.active],
      permission: 'create-syllabus',
      route: { name: 'orientation-syllabus-create' },
      initialData: { active: true, isHaveQuiz: false, isShuffleQuestion: false, isShuffleOption: false },
    },
    update: {
      run: syllabusActions.update,
      fields: [fields.name, fields.imgThumbnail, fields.description, fields.active],
      permission: 'update-syllabus',
      route: { name: 'orientation-syllabus-edit', params: (id) => ({ syllabusId: String(id) }) },
    },
    delete: { run: api.delete, permission: 'delete-syllabus' },
  },
})

export const syllabusConfigFields = fields
export { learningMaterialLookup }
