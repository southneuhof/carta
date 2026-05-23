import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import { languages } from '$lib/utils/common';
import prisma from '$lib/utils/prisma';
import type { ProductCategory } from '@prisma/client';

export default {
  allow: true,
  fields: ['id', 'order', 'active', 'created_at', 'updated_at'],
  view: {
    fieldsForeign: {
      translations: {
        fields: ['language', 'name', 'description'],
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
    fields: ['name', 'order', 'active'],
    lifecycle: {
      pre: async (body: any) => {
        if (body.order == null) {
          const maxOrderItem = await prisma.productCategory.findFirst({
            orderBy: { order: 'desc' },
            select: { order: true },
          });
          body.order = (maxOrderItem?.order ?? 0) + 1;
        }
        return body;
      },
      main: async (body: any) => {
        const baseName = typeof body.name === 'string' && body.name.trim().length > 0 ? body.name.trim() : 'Untitled Category';
        const { name: _omitName, ...categoryData } = body;

        return prisma.$transaction(async (tx) => {
          const created = await tx.productCategory.create({
            data: categoryData,
          });

          await tx.productCategoryTranslation.createMany({
            data: languages.map((language) => ({
              language,
              name: baseName,
              product_category_id: created.id,
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
    fields: ['active'],
  },
  list: {
    allow: true,
    orderBy: { order: 'asc' },
    filterableBy: ['active'],
    fieldsForeign: {
      translations: {
        fields: ['language', 'name', 'description'],
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
      products: {
        fields: ['id', 'order', 'active', 'images', 'product_category_id'],
        fieldsForeign: {
          translations: {
            fields: ['language', 'name', 'slug'],
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
} as ModelConfig<ProductCategory>;
