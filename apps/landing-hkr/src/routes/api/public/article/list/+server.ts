import { parseSearchParams } from '$lib/utils/common.js'
import prisma from '$lib/utils/prisma'
import { exception, success } from '$lib/utils/response'
import { getLocale } from '$lib/paraglide/runtime.js';
import { withPagination } from '$lib/utils/pagination'; // Assuming this utility exists and handles page/limit
import type { Prisma } from '@prisma/client';
import qs from 'qs'

export async function GET({ url }) {
  try {
    const locale = getLocale();
    const queryParams = qs.parse(url.searchParams.toString());
    // Get array of category IDs from search params (e.g., article_category_ids[]=id1&article_category_ids[]=id2)
    const articleCategoryIds = queryParams.article_category_ids as string[] | undefined;
    const articleCategoryMainIds = queryParams.article_category_main_ids as string[] | undefined;
    const searchQuery = queryParams.search as string | undefined;
    // 'page' and 'limit' from queryParams will be used by withPagination
    const paginatedData = await withPagination(async (skip, take) => {
      const whereClause: Prisma.ArticleWhereInput = {
        // Filter by categories if provided (many-to-many)
        // ...(articleCategoryIds && articleCategoryIds.length > 0
        //   ? { categories: { some: { id: { in: articleCategoryIds } } } }
        //   : {}),
        AND: [
          ...(articleCategoryIds && Array.isArray(articleCategoryIds) && articleCategoryIds.length > 0
            ? [{ categories: { some: { id: { in: articleCategoryIds } } } }]
            : []),
          ...(articleCategoryMainIds && Array.isArray(articleCategoryMainIds) && articleCategoryMainIds.length > 0
            ? articleCategoryMainIds.map((category: any) => ({
                categories: { some: { id: category } }
              }))
            : [])
        ],
        // Articles must have a translation for the current locale.
        // If searchQuery is present, the title of that translation must match.
        translations: {
          some: {
            status_code: 'PUBLISHED',
            language: locale,
            ...(searchQuery && {
              title: {
                contains: searchQuery,
                mode: 'insensitive', // Case-insensitive search
              },
            }),
          },
        },
      };

      const articles = await prisma.article.findMany({
        skip,
        take,
        where: whereClause,
        include: {
          // Include only the translation for the current locale
          translations: {
            where: {
              language: locale,
              status_code: 'PUBLISHED',
              ...(searchQuery && {
                title: {
                  contains: searchQuery,
                  mode: 'insensitive',
                },
              }),
            }
          },
          categories: {
            include: {
              // Include only the category translation for the current locale
              translations: {
                where: { language: locale }
              }
            }
          }
        },
        orderBy: {
          created_at: 'desc', // Default order, can be made configurable
        },
      });
      
      console.log('articles', articles)

      const total = await prisma.article.count({
        where: whereClause,
      });

      // Format articles to simplify frontend usage
      const formattedArticles = articles.map(article => {
        const currentTranslation = article.translations[0]; // Should be the single translation for the locale
        const categoryNames = (article.categories || [])
          .map(cat => cat.translations?.[0]?.name)
          .filter(Boolean);

        return {
          id: article.id,
          created_at: article.created_at,
          updated_at: article.updated_at,
          // Fields from the specific locale's article translation
          title: currentTranslation?.title,
          slug: currentTranslation?.slug,
          excerpt: currentTranslation?.excerpt,
          thumbnail: currentTranslation?.thumbnail,
          // Array of category names (strings)
          categories: categoryNames,
          content: currentTranslation?.content,
        };
      });

      return { data: formattedArticles, total };
    }, queryParams); // queryParams should contain page, limit, etc.

    return success(paginatedData);
  } catch (err) {
    console.error("Error fetching articles:", err); // Log error for server-side debugging
    return exception(err);
  }
}