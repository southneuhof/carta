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
      childSectionGroups: {
        include: {
          sections: {
            orderBy: {
              order: 'asc'
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
                include: {
                  contents: {
                    orderBy: {
                      order: 'asc'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  return {
    content: data?.contents[0],
    childSections: data?.childSectionGroups[0].sections.map(section => ({
      ...section,
      content: section.contents[0],
      gallery: section.galleries[0].contents,
    }))
  }
}