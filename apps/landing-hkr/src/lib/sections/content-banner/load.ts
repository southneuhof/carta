import prisma from "$lib/utils/prisma"

export async function load(section: Record<string, any>) {
  const data = await prisma.section.findUnique({
    where: {
      id: section.id
    },
    include: {
      contents: {
        orderBy: {
          order: 'asc'
        }
      },
      galleries: {
        orderBy: {
          order: 'asc'
        },
        select: {
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
    content: data?.contents[0],
    gallery: data?.galleries[0].contents
  }
}