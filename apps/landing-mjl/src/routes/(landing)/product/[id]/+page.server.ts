import { getLocale } from '$lib/paraglide/runtime.js';
import prisma from '$lib/utils/prisma.js';
import { error } from '@sveltejs/kit';
import type { Prisma } from '@prisma/client';

function normalizeImageUrl(input: unknown): string {
  if (!input) return '';
  if (typeof input === 'string') return input;
  if (typeof input !== 'object') return '';

  const image = input as Record<string, unknown>;
  for (const key of ['url', 'path', 'data']) {
    const value = image[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }

  return '';
}

function normalizeImages(input: Prisma.JsonValue): unknown[] {
  return Array.isArray(input) ? input : [];
}

export async function load({ params }) {
  const locale = getLocale();
  const id = params.id?.trim();
  if (!id) throw error(404, 'Product not found');

  const product = await prisma.product.findFirst({
    where: {
      id,
      active: true,
      productCategory: {
        active: true,
        translations: {
          some: { language: locale },
        },
      },
      translations: {
        some: { language: locale },
      },
    },
    include: {
      translations: {
        where: { language: locale },
        select: { name: true, description: true },
      },
      productCategory: {
        select: {
          translations: {
            where: { language: locale },
            select: { name: true },
          },
        },
      },
    },
  });

  if (!product) throw error(404, 'Product not found');

  const translation = product.translations[0];
  const categoryName = product.productCategory?.translations?.[0]?.name ?? '';
  if (!translation || !categoryName) throw error(404, 'Product not found');

  const images = normalizeImages(product.images);
  const productData = {
    id: product.id,
    product_category_id: product.product_category_id,
    name: translation.name ?? '',
    description: translation.description ?? '',
    url: product.url ?? undefined,
    category: categoryName,
    thumbnail: normalizeImageUrl(images[0]),
    images,
  };

  return {
    section: {
      id: `product-showcase-${product.id}`,
      code: 'product-showcase',
      meta: {
        product_id: product.id,
      },
      data: {
        product: productData,
        config: null,
      },
    },
  };
}
