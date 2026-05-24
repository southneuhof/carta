import prisma from "$lib/utils/prisma"

export async function load(section: Record<string, any>) {
  const [filter, data] = await Promise.all([
    prisma.collection.findMany({
      where: {
        OR: [
          {
            code: {
              in: ['project-category', 'project-location', 'projects']
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
  ])
  return {
    banner: data?.galleries[0].contents,
    filter: {
      category: filter.find(item => item.code === 'project-category')?.data,
      location: filter.find(item => item.code === 'project-location')?.data,
      // projects: filter.find(item => item.code === 'projects')?.data
    },
    projects: filter.find(item => item.code === 'projects')?.data
  }
}