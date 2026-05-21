import type { SectionSchemaMeta } from '@southneuhof/landing-sveltekit-framework/types'

export const commonSectionMetaConfig = {
  fields: [
    'section_background_color',
    'section_ornament_media',
    'section_ornament_offset',
  ] as const,
  defaultValues: {
    section_background_color: '',
    section_ornament_media: '',
    section_ornament_offset: 'md',
  },
  editor: {
    inputConfig: {
      section_background_color: {
        type: 'text',
      },
      section_ornament_media: {
        type: 'image',
      },
      section_ornament_offset: {
        type: 'select',
        props: {
          data: [
            { id: 'sm', name: 'Small' },
            { id: 'md', name: 'Medium' },
            { id: 'xl', name: 'Extra Large' },
          ],
          clearable: false,
        },
      },
    },
    fieldsAlias: {
      section_background_color: 'Section Background Color',
      section_ornament_media: 'Section Ornament Image',
      section_ornament_offset: 'Section Ornament Offset',
    },
  },
} satisfies Required<Pick<SectionSchemaMeta, 'fields' | 'defaultValues' | 'editor'>>
