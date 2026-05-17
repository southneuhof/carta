import type { SectionSchema } from '@southneuhof/landing-sveltekit-framework/types';

export default {
  code: 'content-default',
  info: {
    name: 'Content Default',
    description: 'Single content slot section',
  },
  data: {
    content: { type: 'content', order: 1 },
  },
} satisfies SectionSchema;
