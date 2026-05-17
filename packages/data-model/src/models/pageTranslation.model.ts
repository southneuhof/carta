import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'
import { languageOptions, publicationStatusOptions, statusChipOptions } from './_helpers'

const pageTranslationModel: ModelConfig = withModelDefaults({
  name: 'pageTranslation',
  title: 'Page Translation',
  modelAPI: 'pageTranslation',
  fields: ['page_id', 'language', 'status_code', 'live_for_id'],
  fieldsAlias: {
    page_id: 'Page',
    live_for_id: 'Live Version',
  },
  view: {
    list: {
      fieldsType: {
        status_code: {
          type: 'chip',
          props: { options: statusChipOptions },
        },
      },
      filter: {
        fields: ['language', 'status_code'],
      },
    },
  },
  transaction: {
    fields: ['language', 'status_code'],
    inputConfig: {
      language: { type: 'radio', props: { data: languageOptions, required: true } },
      status_code: { type: 'radio', props: { data: publicationStatusOptions } },
    },
  },
})

export default pageTranslationModel
