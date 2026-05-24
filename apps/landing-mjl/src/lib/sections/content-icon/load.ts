import prisma from "$lib/utils/prisma"

export async function load(section: Record<string, any>) {
  const data = await prisma.section.findUnique({
    where: {
      id: section.id
    },
    include: {
      contents: {
        where: {
          gallery_id: null
        },
        orderBy: {
          order: 'asc',
        }
      },
      galleries: {
        orderBy: {order: 'asc'},
        include: {
          contents: {
            orderBy: {order: 'asc'}
          }
        }
      }
    }
  })
  return {
    content: data?.contents[0],
    icons: data?.galleries[0].contents
  }
}