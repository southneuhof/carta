import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import type { JobCategoryTranslation } from '@prisma/client';

export default {
  allow: true,
  fields: ['id', 'job_category_id', 'language', 'name', 'description'],
  create: {
    allow: false,
  },
  update: {
    allow: true,
    by: ['id'],
    fields: ['name', 'description'],
    validation: {
      name: [
        {
          validator: (value: string) => typeof value === 'string' && value.length > 0,
          message: 'Name is required',
        },
      ],
    },
  },
  detail: {
    allow: true,
    by: ['job_category_id', 'language'],
    fields: ['id', 'job_category_id', 'language', 'name', 'description'],
  },
} as ModelConfig<JobCategoryTranslation>;
