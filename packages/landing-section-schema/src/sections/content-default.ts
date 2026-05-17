import { defineSectionSchema } from '../defineSectionSchema';

export default defineSectionSchema({
  code: 'content-default',
  info: {
    name: 'Content Default',
    description: 'Single content slot section',
  },
  meta: {
    fields: [
      'remove_margin',
      'remove_outline_on_images',
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
  },
});
