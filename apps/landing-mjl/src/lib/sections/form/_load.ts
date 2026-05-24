import content from "$lib/app/api/models/content"
import gallery from "$lib/app/api/models/gallery"
import { getLocale } from "$lib/paraglide/runtime"
import prisma from "$lib/utils/prisma"

export async function load(section: Record<string, any>) {
  const [formTypeData, sectionData] = await Promise.all([
    prisma.formType.findUnique({
      where: {
        id: section.meta.form_type_id
      },
      include: {
        fields: {
          orderBy: {
            order: 'asc'
          }
        },
      }
    }),
    prisma.section.findUnique({
      where: {id: section.id},
      select: {
        contents: true,
        childSections: {
          orderBy: {order: 'asc'},
          select: {
            visible: true,
            contents: {
              orderBy: {order: 'asc'},
              where: {
                gallery_id: null
              },
              select: {
                title: true,
                description: true
              }
            },
            galleries: {
              orderBy: {order: 'asc'},
              select: {
                contents: {
                  orderBy: {order: 'asc'},
                  select: {
                    title: true,
                    media: true,
                    url: true,
                    content: true,
                    attachment: true
                  }
                }
              }
            }
          },
        }
      }
    })
  ])
  return {
    formType: formTypeData,
    formDataTemplate: {
      form_type_id: section.meta.form_type_id,
      data: formTypeData?.fields.map(field => ({...field, value: undefined}))
    },
    content: sectionData?.contents[0],
    contactDetail: {
      visible: sectionData?.childSections[0].visible,
      content: sectionData?.childSections[0].contents[0],
      contact: sectionData?.childSections[0].galleries[0].contents,
      socialMedia: sectionData?.childSections[0].galleries[1].contents,
    },
    postSubmission: {
      visible: sectionData?.childSections[1].visible,
      content: sectionData?.childSections[1].contents[0],
      gallery: sectionData?.childSections[1].galleries[0].contents
    },
  }
}