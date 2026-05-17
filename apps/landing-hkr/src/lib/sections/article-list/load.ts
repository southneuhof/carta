import { getLocale } from "$lib/paraglide/runtime"
import prisma from "$lib/utils/prisma"

export async function load() {
  const data = await prisma.articleCategory.findMany({
    include: {
      translations: {
        where: {
          language: getLocale()
        }
      },
    }
  })
  console.log('rerun', getLocale(), data[0].translations)
  return {
    articleCategory: data.map(item => ({...item, name: item.translations[0].name, translations: undefined}))
  }
}