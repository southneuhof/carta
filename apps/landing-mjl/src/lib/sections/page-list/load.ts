import prisma from "$lib/utils/prisma"

export async function load(section: Record<string, any>) {
  const data = await prisma.section.findUnique({
    where: {
      id: section.id
    },
    include: {
      contents: {
        orderBy: {order: 'asc'},
      },
      galleries: {
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
    header: data?.contents[0],
    menu: data?.galleries[0].contents
  }
}