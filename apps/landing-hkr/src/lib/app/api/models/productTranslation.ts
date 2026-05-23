import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import { parseSlug } from '$lib/utils/common';
import type { ProductTranslation } from '@prisma/client';

export default {
  allow: true,
  fields: ['id', 'product_id', 'language', 'name', 'slug', 'description'],
  create: {
    allow: false,
  },
  update: {
    allow: true,
    by: ['id'],
    fields: ['name', 'slug', 'description'],
    validation: {
      name: [
        {
          validator: (value: string) => typeof value === 'string' && value.length > 0,
          message: 'Name is required',
        },
      ],
    },
    lifecycle: {
      pre: async (body: any) => {
        if (body.name) {
          body.slug = parseSlug(body.name);
        }
        return body;
      },
    },
  },
  detail: {
    allow: true,
    by: ['product_id', 'language'],
    fields: ['id', 'product_id', 'language', 'name', 'slug', 'description'],
  },
  delete: {
    allow: true,
    by: ['id'],
  },
} as ModelConfig<ProductTranslation>;
