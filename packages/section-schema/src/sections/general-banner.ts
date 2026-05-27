import { defineSectionSchema } from '@southneuhof/landing-section-schema'

export default defineSectionSchema({
  code: 'general-banner',
  info: {
    name: 'General Banner',
    description: 'General banner with background image and left-aligned text',
  },
  editor: {
    group: 'Banner',
  },
  meta: {
    fields: ['add_overlay'] as const,
    defaultValues: {
      add_overlay: false,
    },
    editor: {
      inputConfig: {
        add_overlay: { type: 'checkbox' },
      },
      fieldsAlias: {
        add_overlay: 'Use Dark Overlay',
      },
      fieldsType: {
        add_overlay: { type: 'chip', props: { options: { true: { color: 'success', label: 'Enabled' }, false: { color: 'neutral', label: 'Disabled' } } } },
      },
    },
  },
  data: {
    contents: {
      type: 'content',
      order: 1,
      many: true,
      fields: ['media', 'title', 'description'] as const,
      editor: {
        label: 'Content List',
        inputConfig: {
          media: { type: 'image' },
          title: { type: 'text' },
          description: { type: 'rich-text' },
        },
        fieldsAlias: {
          media: 'Background Image',
        },
        fieldsType: {
          description: { type: 'html' },
        },
      },
    },
  },
})
