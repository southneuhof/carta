import { defineSectionSchema } from '@southneuhof/landing-section-schema/defineSectionSchema'
import { dataListFieldSetFields, resolveDataListEditorConfig } from '../helpers/data-list-field-sets'

export default defineSectionSchema({
  code: 'data-list',
  info: {
    name: 'Data List',
    description: 'Section with header content and nested section groups',
  },
  editor: {
    group: 'Utility',
  },
  meta: {
    fields: [
      'type',
      'width_preset',
      'hide_outline',
      'media_aspect_ratio',
      'collapsible',
      'closed_on_initial',
      'searchable',
      'title',
    ] as const,
    defaultValues: {
      type: 'list',
      media_aspect_ratio: '2/3',
      width_preset: 'xl',
    },
    editor: {
      inputConfig: {
        type: {
          type: 'select',
          props: {
            required: true,
            data: [
              { id: 'list', name: 'List' },
              { id: 'gallery', name: 'Gallery' },
              { id: 'content', name: 'Content' },
              { id: 'card', name: 'Card' },
              { id: 'media', name: 'Media' },
            ],
          },
        },
        width_preset: {
          type: 'select',
          props: {
            data: [
              { id: 'sm', name: 'Small (max. width 640px)' },
              { id: 'md', name: 'Medium (max. width 768px)' },
              { id: 'lg', name: 'Large (max. width 1024px)' },
              { id: 'xl', name: 'Extra Large (max. width 1280px)' },
            ],
            clearable: false,
          },
        },
        hide_outline: {
          type: 'checkbox',
          dependency: {
            fields: ['type'],
            visibility: {
              validator: ({ type }: any) => type === 'media',
              default: false,
            },
          },
        },
        media_aspect_ratio: {
          type: 'select',
          dependency: {
            fields: ['type'],
            visibility: {
              validator: ({ type }: any) => type === 'media',
              default: false,
            },
          },
          props: {
            data: [
              { id: '2/3', name: '2:3' },
              { id: '3/4', name: '3:4' },
              { id: '1/1', name: '1:1' },
            ],
            clearable: false,
          },
        },
        collapsible: { type: 'checkbox' },
        closed_on_initial: {
          type: 'checkbox',
          dependency: {
            fields: ['collapsible'],
            visibility: {
              validator: ({ collapsible }: any) => Boolean(collapsible),
              default: false,
            },
          },
        },
        searchable: { type: 'checkbox' },
        title: {
          type: 'text',
          dependency: {
            fields: ['searchable'],
            visibility: {
              validator: ({ searchable }: any) => Boolean(searchable),
              default: false,
            },
          },
        },
      },
      fieldsAlias: {
        type: 'Display Type',
        width_preset: 'Content Width',
        hide_outline: 'Hide Outline',
        media_aspect_ratio: 'Media Aspect Ratio',
        collapsible: 'Enable Collapsible',
        closed_on_initial: 'Closed on Initial Load',
        searchable: 'Enable Search',
        title: 'Search Placeholder',
      },
      fieldsType: {
        hide_outline: { type: 'chip', props: { options: { true: { color: 'success', label: 'Enabled' }, false: { color: 'neutral', label: 'Disabled' } } } },
        collapsible: { type: 'chip', props: { options: { true: { color: 'success', label: 'Enabled' }, false: { color: 'neutral', label: 'Disabled' } } } },
        closed_on_initial: { type: 'chip', props: { options: { true: { color: 'success', label: 'Enabled' }, false: { color: 'neutral', label: 'Disabled' } } } },
        searchable: { type: 'chip', props: { options: { true: { color: 'success', label: 'Enabled' }, false: { color: 'neutral', label: 'Disabled' } } } },
      },
    },
  },
  data: {
    content: {
      type: 'content',
      order: 1,
      fields: ['subtitle', 'title', 'description'] as const,
      editor: {
        label: 'Header Content',
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
    childSections: {
      type: 'sectionGroup',
      order: 2,
      many: true,
      schema: {
        info: {
          name: 'Data Item',
          description: 'Single data-list item',
        },
        meta: {
          fields: [] as const,
          defaultValues: {},
          editor: {
            fieldsAlias: {},
            fieldsType: {},
          },
        },
        data: {
          gallery: {
            type: 'gallery',
            order: 1,
            fields: dataListFieldSetFields,
            editor: {
              label: 'Data',
              fieldAliases: {
                media: 'Media',
                attachment: 'Attachment',
                subtitle: 'Subtitle',
                title: 'Title',
                description: 'Description',
                url: 'URL',
                url_text: 'URL Text',
              },
              fieldsType: {
                description: { type: 'html' },
              },
              resolveConfig: ({ parentSectionData }) => resolveDataListEditorConfig((parentSectionData as any)?.meta?.type),
            },
          },
        },
      },
      editor: {
        label: 'Child Sections',
      },
    },
  },
})
