import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'
import { contentMediaTypeOptions, contentUrlTypeOptions } from './_helpers'

const contentModel: ModelConfig = withModelDefaults({
  name: 'content',
  title: 'Content',
  modelAPI: 'content',
  fields: [
    'id',
    'media',
    'media_type',
    'title',
    'subtitle',
    'description',
    'label',
    'content',
    'blurb',
    'url_type',
    'url',
    'url_text',
    'attachment',
    'amount',
    'status',
    'collection',
    'meta',
    'order',
  ],
  view: {
    list: {
      searchParameters: { sort_by: 'order', sort: 'asc' },
      draggable: true,
      filter: {
        fields: ['media_type', 'url_type', 'status'],
      },
    },
  },
  transaction: {
    fields: [
      'media',
      'media_type',
      'title',
      'subtitle',
      'description',
      'label',
      'content',
      'blurb',
      'url_type',
      'url',
      'url_text',
      'attachment',
      'amount',
      'status',
      'collection',
      'meta',
    ],
    inputConfig: {
      media: { type: 'image' },
      media_type: { type: 'radio', props: { data: contentMediaTypeOptions } },
      title: { type: 'text' },
      subtitle: { type: 'text' },
      description: { type: 'rich-text' },
      label: { type: 'text' },
      content: { type: 'rich-text' },
      blurb: { type: 'textarea' },
      url_type: { type: 'radio', props: { data: contentUrlTypeOptions } },
      url: { type: 'text' },
      url_text: { type: 'text' },
      attachment: { type: 'file' },
      amount: { type: 'number' },
      status: { type: 'checkbox' },
      collection: { type: 'text' },
      meta: { type: 'textarea' },
    },
  },
})

export default contentModel
