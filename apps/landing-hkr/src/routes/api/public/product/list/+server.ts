import { getLocale } from '$lib/paraglide/runtime.js';
import prisma from '$lib/utils/prisma';
import { exception, success } from '$lib/utils/response';
import type { Prisma } from '@prisma/client';

function parseLimit(input: string | null) {
  const value = Number(input);
  if (!Number.isFinite(value) || value <= 0) return 8;
  return Math.min(Math.floor(value), 100);
}

function parseBoolean(input: string | null) {
  return input === 'true' || input === '1';
}

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

export async function GET({ url }) {
  try {
    const locale = getLocale();
    const search = url.searchParams.get('search')?.trim();
    const productCategoryId = url.searchParams.get('product_category_id')?.trim();
    const limit = parseLimit(url.searchParams.get('limit'));
    const includeCategories = parseBoolean(url.searchParams.get('include_categories'));

    const productWhere: Prisma.ProductWhereInput = {
      active: true,
      productCategory: {
        active: true,
        translations: {
          some: { language: locale },
        },
      },
      translations: {
        some: {
          language: locale,
          ...(search
            ? {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              }
            : {}),
        },
      },
      ...(productCategoryId ? { product_category_id: productCategoryId } : {}),
    };

    const [categories, products] = await Promise.all([
      includeCategories
        ? prisma.productCategory.findMany({
            where: {
              active: true,
              translations: {
                some: { language: locale },
              },
            },
            orderBy: { order: 'asc' },
            include: {
              translations: {
                where: { language: locale },
                select: { name: true, description: true },
              },
            },
          })
        : Promise.resolve([]),
      prisma.product.findMany({
        where: productWhere,
        take: limit,
        orderBy: { order: 'asc' },
        include: {
          translations: {
            where: { language: locale },
            select: { name: true },
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
      }),
    ]);

    return success({
      categories: categories.map((category) => ({
        id: category.id,
        name: category.translations[0]?.name ?? '',
        description: category.translations[0]?.description ?? undefined,
      })),
      products: products.map((product) => {
        const translation = product.translations[0];
        const images = normalizeImages(product.images);

        return {
          id: product.id,
          product_category_id: product.product_category_id,
          name: translation?.name ?? '',
          url: product.url ?? undefined,
          category: product.productCategory.translations[0]?.name ?? '',
          thumbnail: normalizeImageUrl(images[0]),
          images,
        };
      }),
    });
  } catch (err) {
    return exception(err);
  }
}
