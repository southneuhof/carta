import type { SectionSchema } from '@southneuhof/landing-sveltekit-framework/types';

export default {
  code: 'hero-banner-two',
  info: {
    name: 'Hero Banner Two',
    description: 'Hero banner section with rotating gallery banners',
  },
  data: {
    banner: { type: 'gallery', order: 1, many: true },
  },
} satisfies SectionSchema;
