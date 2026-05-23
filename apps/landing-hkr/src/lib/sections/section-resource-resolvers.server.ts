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
};
