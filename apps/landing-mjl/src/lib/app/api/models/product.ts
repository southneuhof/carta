import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import { languages } from '$lib/utils/common';
import prisma from '$lib/utils/prisma';
import type { Prisma } from '@prisma/client';

export default {
  allow: true,
  fields: ['id', 'product_category_id', 'url', 'order', 'active', 'images', 'created_at', 'updated_at'],
  list: {
    allow: true,
    orderBy: { order: 'asc' },
    filterableBy: ['product_category_id', 'active'],
    fieldsForeign: {
      productCategory: {
        fields: ['id', 'order', 'active'],
        fieldsForeign: {
          translations: {
            fields: ['language', 'name'],
          },
        },
      },
      translations: {
        fields: ['id', 'language', 'name', 'description'],
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
      productCategory: {
        fields: ['id', 'order', 'active'],
        fieldsForeign: {
          translations: {
            fields: ['language', 'name', 'description'],
          },
        },
      },
      translations: {
        fields: ['id', 'language', 'name', 'description'],
      },
    },
  },
  create: {
    allow: true,
    fields: ['product_category_id', 'url', 'name', 'order', 'active', 'images'],
    validation: {
      product_category_id: [
        {
          validator: (value: string) => typeof value === 'string' && value.length > 0,
          message: 'Category is required',
        },
      ],
    },
    lifecycle: {
      pre: async (body: any) => {
        if (body.order == null) {
          const maxOrderItem = await prisma.product.findFirst({
            where: { product_category_id: body.product_category_id },
            orderBy: { order: 'desc' },
            select: { order: true },
          });
          body.order = (maxOrderItem?.order ?? 0) + 1;
        }
        return body;
      },
      main: async (body: any) => {
        const name = typeof body.name === 'string' && body.name.trim().length > 0 ? body.name.trim() : 'Untitled Product';
        const { name: _omitName, ...productData } = body;

        return prisma.$transaction(async (tx) => {
          const created = await tx.product.create({
            data: productData,
          });

          await tx.productTranslation.createMany({
            data: languages.map((language) => ({
              product_id: created.id,
              language,
              name,
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
    fields: ['product_category_id', 'url', 'active', 'images'],
  },
  delete: {
    allow: true,
    by: ['id'],
  },
  reorder: {
    allow: true,
    axis: ['product_category_id'],
  },
} as ModelConfig<Prisma.ProductGetPayload<{ include: { translations: true; productCategory: { include: { translations: true } } } }>>;
