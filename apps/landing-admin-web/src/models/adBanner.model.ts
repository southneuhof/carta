import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const adBannerModel: ModelConfig = withModelDefaults({
  name: 'adBanner',
  title: 'Ad Banner',
  modelAPI: 'adBanner',
  fields: ['id', 'ad_banner_language_map_id', 'language', 'description'],
  view: {
    list: {
      fields: ['ad_banner_language_map_id', 'language', 'description'],
    },
    detail: {
      fields: ['id', 'ad_banner_language_map_id', 'language', 'description'],
    },
  },
  transaction: {
    fields: ['description'],
    inputConfig: {
      description: { type: 'rich-text', props: { required: true } },
    },
  },
})

export default adBannerModel
