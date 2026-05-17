import { defineSectionSchema } from '../defineSectionSchema';

export default defineSectionSchema({
  code: 'data-list',
  info: {
    name: 'Data List',
    description: 'Section with header content and nested section groups',
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
  },
  data: {
    content: { type: 'content', order: 1 },
    childSections: { type: 'sectionGroup', order: 1, many: true },
  },
});
