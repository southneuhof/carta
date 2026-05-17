import type { SectionSchema } from '@southneuhof/landing-sveltekit-framework/types';

export default {
  code: 'data-list',
  info: {
    name: 'Data List',
    description: 'Section with header content and nested section groups',
  },
  data: {
    content: { type: 'content', order: 1 },
    childSections: { type: 'sectionGroup', order: 1, many: true },
  },
} satisfies SectionSchema;
