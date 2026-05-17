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
        orderBy: {
          order: 'asc'
        },
        include: {
          sections: {
            orderBy: {
              order: 'asc'
            },
            include: {
              childSectionGroups: {
                orderBy: {
                  order: 'asc'
                },
                include: {
                  sections: {
                    orderBy: {
                      order: 'asc'
                    },
                    include: {
                      contents: {
                        orderBy: {
                          order: 'asc',
                        },
                        where: {
                          gallery_id: null
                        },
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
          }
        }
      }
    }
  })
  
  return {
    content: data?.contents[0],
    productType: data?.childSectionGroups[0].sections.map(productType => ({
      name: productType.name,
      sections: productType.childSectionGroups[0].sections.map(section => ({
        name: section.name,
        content: section.contents[0],
        feature: section.galleries[0].contents,
        gallery: section.galleries[1].contents,
      }))
    }))
  }
}