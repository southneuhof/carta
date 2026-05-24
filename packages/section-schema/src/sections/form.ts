import { defineSectionSchema } from '@southneuhof/landing-section-schema'

export default defineSectionSchema({
  code: 'form',
  info: {
    name: 'Form',
    description: 'Form section with contact details and post-submission content',
  },
  editor: {
    group: 'Utility',
  },
  data: {
    header: {
      type: 'content',
      order: 1,
      fields: ['subtitle', 'title', 'description'] as const,
      editor: {
        label: 'Header',
        inputConfig: {
          title: { type: 'text' },
          description: { type: 'rich-text' },
        },
      },
    },
    contactDetails: {
      type: 'gallery',
      order: 2,
      many: true,
      fields: ['media', 'title', 'url'] as const,
      editor: {
        label: 'Contact Details',
        inputConfig: {
          media: {type: 'icon-select'}
        },
      },
    },
    postSubmission: {
      type: 'content',
      order: 3,
      fields: ['title', 'description'] as const,
      editor: {
        label: 'Post Submission',
        inputConfig: {
          title: { type: 'text' },
          description: { type: 'rich-text' },
        },
      },
    },
    formDataTemplate: {
      type: 'resource',
      source: 'form-template',
      order: 4,
      many: false,
      params: {
        formTypeMetaField: 'form_type_id',
      },
    },
    config: {
      type: 'resource',
      source: 'section-meta-editor',
      order: 5,
      many: false,
      editor: {
        componentToken: 'form-meta-editor',
      },
    },
  },
})
