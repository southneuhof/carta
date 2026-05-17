import { defineSectionSchema } from '../defineSectionSchema';

export default defineSectionSchema({
  code: 'hero-banner',
  info: {
    name: 'Hero Banner',
    description: 'Landing hero with banners and quick links',
  },
  data: {
    banner: { type: 'gallery', order: 1, many: true },
    quickAccess: { type: 'gallery', order: 2, many: true },
    projectCategory: { type: 'gallery', order: 3, many: true },
  },
});
