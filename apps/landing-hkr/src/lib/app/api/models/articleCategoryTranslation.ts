import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import type { ArticleCategoryTranslation } from "@prisma/client";

export default {
  allow: true,
  fields: ['id', 'article_category_id', 'language', 'name'],

  create: {
    allow: false,
  },

  update: {
    by: ['id'],
    fields: ['name'],
    validation: {
      name: [
        {
          validator: (value: string) => typeof value === 'string' && value.length > 0,
          message: 'Name is required'
        }
      ]
    }
  },

  detail: {
    by: ['article_category_id', 'language'],
    fields: ['id', 'article_category_id', 'language', 'name'],
  },
} as ModelConfig<ArticleCategoryTranslation>;