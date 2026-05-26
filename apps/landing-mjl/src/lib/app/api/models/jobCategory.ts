import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import { languages } from '$lib/utils/common';
import prisma from '$lib/utils/prisma';
import type { JobCategory } from '@prisma/client';

export default {
  allow: true,
  fields: ['id', 'form_type_id', 'order', 'active', 'created_at', 'updated_at'],
  view: {
    fieldsForeign: {
      translations: {
        fields: ['language', 'name', 'description'],
      },
      formType: {
        fields: ['id', 'name', 'description'],
      },
    },
    customFields: [
      {
        name: 'name',
        generator: (data: any) => data?.translations?.find((translation: any) => translation.language === 'id')?.name,
      },
    ],
  },
  create: {
    allow: true,
    fields: ['name', 'form_type_id', 'order', 'active'],
    validation: {
      form_type_id: [
        {
          validator: (value: string) => typeof value === 'string' && value.length > 0,
          message: 'Form type is required',
        },
      ],
    },
    lifecycle: {
      pre: async (body: any) => {
        if (body.order == null) {
          const maxOrderItem = await prisma.jobCategory.findFirst({
            orderBy: { order: 'desc' },
            select: { order: true },
          });
          body.order = (maxOrderItem?.order ?? 0) + 1;
        }
        return body;
      },
      main: async (body: any) => {
        const baseName = typeof body.name === 'string' && body.name.trim().length > 0 ? body.name.trim() : 'Untitled Job Category';
        const { name: _omitName, ...categoryData } = body;

        return prisma.$transaction(async (tx) => {
          const created = await tx.jobCategory.create({
            data: categoryData,
          });

          await tx.jobCategoryTranslation.createMany({
            data: languages.map((language) => ({
              language,
              name: baseName,
              job_category_id: created.id,
            })),
          });

          return { ...created, name: baseName };
        });
      },
    },
  },
  update: {
    allow: true,
    by: ['id'],
    fields: ['form_type_id', 'order', 'active'],
  },
  list: {
    allow: true,
    orderBy: { order: 'asc' },
    filterableBy: ['form_type_id', 'active'],
    fieldsForeign: {
      translations: {
        fields: ['language', 'name', 'description'],
      },
      formType: {
        fields: ['id', 'name', 'description'],
      },
    },
  },
  detail: {
    allow: true,
    by: ['id'],
    fieldsForeign: {
      translations: {
        fields: ['language', 'name', 'description'],
      },
      formType: {
        fields: ['id', 'name', 'description'],
      },
      jobs: {
        fields: ['id', 'order', 'active', 'job_category_id'],
        fieldsForeign: {
          translations: {
            fields: ['language', 'name'],
          },
        },
      },
    },
  },
  delete: {
    allow: true,
    by: ['id'],
  },
  reorder: {
    allow: true,
    axis: ['*'],
  },
} as ModelConfig<JobCategory>;
