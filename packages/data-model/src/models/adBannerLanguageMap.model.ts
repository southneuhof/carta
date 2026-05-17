import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const adBannerLanguageMapModel: ModelConfig = withModelDefaults({
  name: 'adBannerLanguageMap',
  title: 'Ad Banner Language Map',
  modelAPI: 'adBannerLanguageMap',
  fields: ['article_language_map_code'],
  view: {
    list: {
      fields: ['article_language_map_code'],
    },
    detail: {
      fields: ['article_language_map_code'],
    },
  },
  transaction: {
    fields: ['article_language_map_code'],
    inputConfig: {
      article_language_map_code: { type: 'text', props: { required: true } },
    },
  },
})

export default adBannerLanguageMapModel
