import { defineSectionSchema } from '../defineSectionSchema';

export default defineSectionSchema({
  code: 'content-gallery',
  info: {
    name: 'Content Gallery',
    description: 'Content heading and one gallery',
  },
  meta: {
    fields: [
      'remove_margin',
      'gallery_media_type',
      'content_align',
      'url_justify',
      'layout_direction',
      'width_preset',
      'content_order',
      'button_type',
    ] as const,
  },
  data: {
    content: { type: 'content', order: 1 },
    gallery: { type: 'gallery', order: 1, many: true },
  },
});
