import prisma from "$lib/utils/prisma"

export async function load(section: Record<string, any>) {
  const [filter, data] = await Promise.all([
    prisma.collection.findMany({
      where: {
        OR: [
          {
            code: {
              in: ['project-category', 'project-location']
            }
          }
        ]
      }
    }),
    prisma.section.findUnique({
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
  ])
  return {
    header: data?.contents[0],
    filter: {
      category: filter.find(item => item.code === 'project-category')?.data,
      location: filter.find(item => item.code === 'project-location')?.data
    },
    projects: data?.galleries[0].contents
  }
}