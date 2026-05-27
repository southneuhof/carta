import { defineSectionSchema } from '@southneuhof/landing-section-schema/defineSectionSchema'

export default defineSectionSchema({
  code: 'form',
  info: {
    name: 'Form',
    description: 'Form section with contact details and post-submission content',
  },
  editor: {
    group: 'Utility',
  },
  meta: {
    fields: ['form_type_id'] as const,
    defaultValues: {
      form_type_id: null,
    },
    editor: {
      fieldsAlias: {
        form_type_id: 'Form Type',
      },
      fieldsType: {
        form_type_id: { type: 'text' },
      },
    },
  },
  data: {
    header: {
      type: 'content',
      order: 1,
      fields: ['subtitle', 'title', 'description'] as const,
      editor: {
        label: 'Header',
        fieldAliases: {
          subtitle: 'Subtitle',
          title: 'Title',
          description: 'Description',
        },
        fieldsType: {
          description: { type: 'html' },
        },
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
        fieldAliases: {
          media: 'Icon',
          title: 'Title',
          url: 'URL',
        },
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
        fieldAliases: {
          title: 'Title',
          description: 'Description',
        },
        fieldsType: {
          description: { type: 'html' },
        },
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
      editor: {
        fieldAliases: {
          id: 'ID',
          name: 'Name',
        },
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
