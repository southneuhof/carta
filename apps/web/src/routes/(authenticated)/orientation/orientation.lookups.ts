import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import { syllabusSchema } from './syllabus/syllabus.schema'
import { learningMaterialsSchema } from './learning-materials/learning-materials.schema'

const syllabusApi = createHonoResourceActions(rpc.syllabus, dataAdapter)
const materialApi = createHonoResourceActions(rpc['learning-materials'], dataAdapter)

const syllabusFields = defineFields(syllabusSchema, { name: { label: 'Judul/Tema Silabus' } })
const materialFields = defineFields(learningMaterialsSchema, { name: { label: 'Judul' } })

export const syllabusLookup = defineResource(syllabusSchema, {
  key: 'orientation-syllabus-lookup',
  actions: {
    list: { run: syllabusApi.list, fields: [syllabusFields.name], permission: 'list-syllabus' },
    detail: { run: syllabusApi.detail, fields: [syllabusFields.name], permission: 'detail-syllabus' },
  },
})

export const learningMaterialLookup = defineResource(learningMaterialsSchema, {
  key: 'orientation-learning-material-lookup',
  actions: {
    list: { run: materialApi.list, fields: [materialFields.name], permission: 'list-learning-materials' },
    detail: { run: materialApi.detail, fields: [materialFields.name], permission: 'detail-learning-materials' },
  },
})
