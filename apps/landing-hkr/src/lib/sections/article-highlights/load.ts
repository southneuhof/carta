import { getLocale } from "$lib/paraglide/runtime"
import prisma from "$lib/utils/prisma"

export async function load(section: any) {
  console.log('ARTICLE HIGHLIGHT RUN')
  const [content, article] = await Promise.all([
    prisma.content.findFirst({
      where: {section_id: section.id}
    }),
    prisma.article.findMany({
      where: {
        AND: [
          ...(section.meta.article_categories_or && Array.isArray(section.meta.article_categories_or) && section.meta.article_categories_or.length > 0
            ? [{ categories: { some: { id: { in: section.meta.article_categories_or.map((item: any) => item.id) } } } }]
            : []),
          ...(section.meta.article_categories_and && Array.isArray(section.meta.article_categories_and) && section.meta.article_categories_and.length > 0
            ? section.meta.article_categories_and.map((category: any) => ({
                categories: { some: { id: category.id } }
              }))
            : [])
        ],
        translations: {
          some: {
            status_code: 'PUBLISHED',
          },
        },
      },
      take: 4,
      orderBy: {
        created_at: 'desc'
      },
      include: {
        translations: {
          where: {language: getLocale()},
          select: {
            title: true,
            content: true,
            thumbnail: true,
            excerpt: true,
            slug: true
          }
        },
        categories: {
          select: {
            translations: {
              where: {language: getLocale()},
              select: {
                name: true
              }
            }
          }
        }
      }
    })
  ])
  return {
    content,
    article: article.map(article => ({
      ...article,
      slug: article.translations[0]?.slug,
      title: article.translations[0]?.title,
      excerpt: article.translations[0]?.excerpt,
      content: article.translations[0]?.content,
      thumbnail: article.translations[0]?.thumbnail,
      categories: article.categories.map(category => category.translations[0]?.name),
      translations: undefined,
    }))
  }
}