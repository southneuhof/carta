import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'
import { languageOptions } from './_helpers'

const jobTranslationModel: ModelConfig = withModelDefaults({
  name: 'jobTranslation',
  title: 'Terjemahan Lowongan',
  modelAPI: 'jobTranslation',
  fields: ['job_id', 'language', 'name', 'minimum_education', 'location', 'description', 'qualification'],
  fieldsAlias: {
    job_id: 'Lowongan',
    minimum_education: 'Pendidikan Minimum',
    location: 'Lokasi',
    qualification: 'Kualifikasi',
  },
  transaction: {
    fields: ['language', 'name', 'minimum_education', 'location', 'description', 'qualification'],
    inputConfig: {
      language: { type: 'radio', props: { data: languageOptions, required: true } },
      name: { type: 'text', props: { required: true } },
      minimum_education: { type: 'text', props: { required: true } },
      location: { type: 'text', props: { required: true } },
      description: { type: 'rich-text' },
      qualification: { type: 'rich-text' },
    },
  },
})

export default jobTranslationModel
