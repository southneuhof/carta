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
  const contents = data?.contents ?? []
  const galleries = data?.galleries ?? []

  return {
    content: contents.find((content) => content.order === 1) ?? null,
    gallery_header: contents.find((content) => content.order === 2) ?? null,
    gallery: galleries.find((gallery) => gallery.order === 3)?.contents ?? []
  }
}
