import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import type { JobTranslation } from '@prisma/client';

export default {
  allow: true,
  fields: ['id', 'job_id', 'language', 'name', 'minimum_education', 'location', 'description', 'qualification'],
  create: {
    allow: false,
  },
  update: {
    allow: true,
    by: ['id'],
    fields: ['name', 'minimum_education', 'location', 'description', 'qualification'],
    validation: {
      name: [
        {
          validator: (value: string) => typeof value === 'string' && value.length > 0,
          message: 'Name is required',
        },
      ],
      minimum_education: [
        {
          validator: (value: string) => typeof value === 'string',
          message: 'Minimum education is required',
        },
      ],
      location: [
        {
          validator: (value: string) => typeof value === 'string',
          message: 'Location is required',
        },
      ],
    },
  },
  detail: {
    allow: true,
    by: ['job_id', 'language'],
    fields: ['id', 'job_id', 'language', 'name', 'minimum_education', 'location', 'description', 'qualification'],
  },
  delete: {
    allow: true,
    by: ['id'],
  },
} as ModelConfig<JobTranslation>;
