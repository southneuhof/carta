import prisma from "$lib/utils/prisma"

export async function load(section: Record<string, any>) {
  const data = await prisma.section.findUnique({
    where: {
      id: section.id
    },
    include: {
      galleries: {
        orderBy: {
          order: 'asc'
        },
        include: {
          contents: {
            orderBy: {
              order: 'asc'
            }
          }
        }
      }
    }
  })
  return {
    banner: data?.galleries[0].contents,
    quickAccess: data?.galleries[1].contents,
    projectCategory: data?.galleries[2].contents,
  }
}