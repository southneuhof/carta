import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import { languages } from '$lib/utils/common';
import prisma from '$lib/utils/prisma';
import type { Prisma } from '@prisma/client';

export default {
  allow: true,
  fields: ['id', 'job_category_id', 'order', 'active', 'created_at', 'updated_at'],
  list: {
    allow: true,
    orderBy: { order: 'asc' },
    filterableBy: ['job_category_id', 'active'],
    fieldsForeign: {
      jobCategory: {
        fields: ['id', 'form_type_id', 'order', 'active'],
        fieldsForeign: {
          translations: {
            fields: ['language', 'name'],
          },
        },
      },
      translations: {
        fields: ['id', 'language', 'name', 'minimum_education', 'location', 'description', 'qualification'],
      },
    },
    where: async (event) => {
      const search = event.url.searchParams.get('search');
      if (!search) return undefined;
      return {
        translations: {
          some: {
            name: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
        },
      };
    },
  },
  detail: {
    allow: true,
    by: ['id'],
    fieldsForeign: {
      jobCategory: {
        fields: ['id', 'form_type_id', 'order', 'active'],
        fieldsForeign: {
          translations: {
            fields: ['language', 'name', 'description'],
          },
          formType: {
            fields: ['id', 'name', 'description'],
          },
        },
      },
      translations: {
        fields: ['id', 'language', 'name', 'minimum_education', 'location', 'description', 'qualification'],
      },
    },
  },
  create: {
    allow: true,
    fields: ['job_category_id', 'name', 'order', 'active'],
    validation: {
      job_category_id: [
        {
          validator: (value: string) => typeof value === 'string' && value.length > 0,
          message: 'Category is required',
        },
      ],
    },
    lifecycle: {
      pre: async (body: any) => {
        if (body.order == null) {
          const maxOrderItem = await prisma.job.findFirst({
            where: { job_category_id: body.job_category_id },
            orderBy: { order: 'desc' },
            select: { order: true },
          });
          body.order = (maxOrderItem?.order ?? 0) + 1;
        }
        return body;
      },
      main: async (body: any) => {
        const name = typeof body.name === 'string' && body.name.trim().length > 0 ? body.name.trim() : 'Untitled Job';
        const { name: _omitName, ...jobData } = body;

        return prisma.$transaction(async (tx) => {
          const created = await tx.job.create({
            data: jobData,
          });

          await tx.jobTranslation.createMany({
            data: languages.map((language) => ({
              job_id: created.id,
              language,
              name,
              minimum_education: '',
              location: '',
            })),
          });

          return { ...created, name };
        });
      },
    },
  },
  update: {
    allow: true,
    by: ['id'],
    fields: ['job_category_id', 'active'],
  },
  delete: {
    allow: true,
    by: ['id'],
  },
  reorder: {
    allow: true,
    axis: ['job_category_id'],
  },
} as ModelConfig<Prisma.JobGetPayload<{ include: { translations: true; jobCategory: { include: { translations: true; formType: true } } } }>>;
