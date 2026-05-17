import type { SectionSchema } from '@southneuhof/landing-sveltekit-framework/types';

export default {
  code: 'content-gallery',
  info: {
    name: 'Content Gallery',
    description: 'Content heading and one gallery',
  },
  data: {
    content: { type: 'content', order: 1 },
    gallery: { type: 'gallery', order: 1, many: true },
  },
} satisfies SectionSchema;
