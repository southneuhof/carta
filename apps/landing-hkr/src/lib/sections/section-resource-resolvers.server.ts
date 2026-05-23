import type { SectionResourceResolverRegistry } from '@southneuhof/landing-sveltekit-framework/types';

function normalizeCategoryIds(input: unknown) {
  if (!Array.isArray(input)) return [] as string[];
  return input
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'id' in item && typeof item.id === 'string') return item.id;
      return null;
    })
    .filter((item): item is string => Boolean(item));
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

function normalizeImages(input: unknown): unknown[] {
  return Array.isArray(input) ? input : [];
}

export const sectionResourceResolvers: SectionResourceResolverRegistry = {
  article: async ({ section, slot, context }) => {
    const params = (slot.params ?? {}) as Record<string, unknown>;
    if (params.strategy !== 'latestPublished') {
      return slot.many ? [] : null;
    }

    const locale = context.getLocale();
    const limit = typeof params.limit === 'number' ? params.limit : 4;
    const categoryMetaField = typeof params.categoryMetaField === 'string' ? params.categoryMetaField : 'articleCategory';
    const categoryIds = normalizeCategoryIds(section?.meta?.[categoryMetaField]);

    const articles = await context.prisma.article.findMany({
      where: {
        ...(categoryIds.length > 0
          ? { categories: { some: { id: { in: categoryIds } } } }
          : {}),
        translations: {
          some: {
            status_code: 'PUBLISHED',
            language: locale,
          },
        },
      },
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        translations: {
          where: { language: locale, status_code: 'PUBLISHED' },
          select: { title: true, thumbnail: true, excerpt: true, slug: true },
        },
        categories: {
          select: {
            translations: {
              where: { language: locale },
              select: { name: true },
            },
          },
        },
      },
    });

    return articles.map((item: any) => ({
      id: item.id,
      created_at: item.created_at,
      title: item.translations[0]?.title ?? '',
      slug: item.translations[0]?.slug ?? '',
      excerpt: item.translations[0]?.excerpt ?? '',
      thumbnail: item.translations[0]?.thumbnail ?? '',
      categories: item.categories.map((category: any) => category.translations[0]?.name).filter(Boolean),
    }));
  },
  product: async ({ section, slot, context }) => {
    const params = (slot.params ?? {}) as Record<string, unknown>;
    const strategy = typeof params.strategy === 'string' ? params.strategy : undefined;
    const locale = context.getLocale();

    if (strategy !== 'detailById') {
      return slot.many ? [] : null;
    }

    const idMetaField = typeof params.idMetaField === 'string' ? params.idMetaField : 'product_id';
    const productId = typeof section?.meta?.[idMetaField] === 'string'
      ? section.meta[idMetaField].trim()
      : '';

    if (!productId) return null;

    const productTranslation = await context.prisma.productTranslation.findFirst({
      where: {
        product_id: productId,
        language: locale,
      },
      include: {
        product: {
          include: {
            productCategory: {
              select: {
                id: true,
                active: true,
                translations: {
                  where: { language: locale },
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    const product = productTranslation?.product;
    if (!product) return null;
    if (!product.active) return null;
    if (!product.productCategory?.active) return null;
    if (!product.productCategory?.translations?.[0]?.name) return null;

    const images = normalizeImages(product.images);

    return {
      id: product.id,
      product_category_id: product.product_category_id,
      name: productTranslation.name ?? '',
      description: productTranslation.description ?? '',
      url: product.url ?? undefined,
      category: product.productCategory.translations[0]?.name ?? '',
      thumbnail: normalizeImageUrl(images[0]),
      images,
    };
  },
  'section-meta-editor': async () => ({}),
};
