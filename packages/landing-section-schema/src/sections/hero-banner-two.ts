import { defineSectionSchema } from '../defineSectionSchema';

export default defineSectionSchema({
  code: 'hero-banner-two',
  info: {
    name: 'Hero Banner Two',
    description: 'Hero banner section with rotating gallery banners',
  },
  meta: {
    fields: ['logo'] as const,
  },
  data: {
    banner: { type: 'gallery', order: 1, many: true },
  },
});
