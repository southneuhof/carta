import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'
import { languageOptions } from './_helpers'

const jobCategoryTranslationModel: ModelConfig = withModelDefaults({
  name: 'jobCategoryTranslation',
  title: 'Terjemahan Kategori Lowongan',
  modelAPI: 'jobCategoryTranslation',
  fields: ['job_category_id', 'language', 'name', 'description'],
  fieldsAlias: {
    job_category_id: 'Kategori Lowongan',
  },
  transaction: {
    fields: ['language', 'name', 'description'],
    inputConfig: {
      language: { type: 'radio', props: { data: languageOptions, required: true } },
      name: { type: 'text', props: { required: true } },
      description: { type: 'rich-text' },
    },
  },
})

export default jobCategoryTranslationModel
