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
      childSectionGroups: {
        orderBy: {
          order: 'asc',
        },
        include: {
          sections: {
            orderBy: {
              order: 'asc',
            },
            include: {
              childSectionGroups: {
                orderBy: {
                  order: 'asc',
                },
                include: {
                  sections: {
                    orderBy: {
                      order: 'asc',
                    },
                    include: {
                      contents: {
                        where: {
                          gallery_id: null
                        },
                        orderBy: {
                          order: 'asc',
                        },
                      },
                      galleries: {
                        orderBy: {
                          order: 'asc',
                        },
                        include: {
                          contents: {
                            orderBy: {
                              order: 'asc',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }
  })

  return {
    content: data?.contents.find((content) => content.order === 1) ?? data?.contents[0] ?? null,
    sectionGroups: data?.childSectionGroups.flatMap((sectionGroup) =>
      sectionGroup.sections.map((groupSection) => ({
        ...groupSection,
        leafSections: groupSection.childSectionGroups.flatMap((leafSectionGroup) =>
          leafSectionGroup.sections.map((leafSection) => ({
            ...leafSection,
            content: leafSection.contents.find((content) => content.order === 1) ?? leafSection.contents[0] ?? null,
            gallery: leafSection.galleries.find((gallery) => gallery.order === 2)?.contents ?? leafSection.galleries[0]?.contents ?? [],
            contents: undefined,
            galleries: undefined,
          }))
        ),
        childSectionGroups: undefined,
      }))
    ) ?? [],
  }
}
