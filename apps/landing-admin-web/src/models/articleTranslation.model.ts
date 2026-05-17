import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'
import { languageOptions, publicationStatusOptions, statusChipOptions } from './_helpers'

const articleTranslationModel: ModelConfig = withModelDefaults({
  name: 'articleTranslation',
  title: 'Terjemahan Artikel',
  modelAPI: 'articleTranslation',
  fields: ['id', 'article_id', 'language', 'title', 'slug', 'content', 'excerpt', 'thumbnail', 'status_code', 'live_for_id'],
  fieldsAlias: {
    article_id: 'Article',
    live_for_id: 'Live Version',
    thumbnail: 'Thumbnail',
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
    fields: ['language', 'title', 'slug', 'content', 'excerpt', 'thumbnail', 'status_code'],
    inputConfig: {
      language: { type: 'radio', props: { data: languageOptions, required: true } },
      title: { type: 'text', props: { required: true } },
      slug: { type: 'text' },
      content: { type: 'rich-text' },
      excerpt: { type: 'textarea' },
      thumbnail: { type: 'image' },
      status_code: { type: 'radio', props: { data: publicationStatusOptions } },
    },
  },
})

export default articleTranslationModel
