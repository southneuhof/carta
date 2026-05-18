import prisma from '$lib/utils/prisma'
import { exception, success } from '$lib/utils/response'
import { ensureDraftState } from '$lib/utils/page'
import { requirePermission } from '$lib/utils/routing'
import { requirePageTranslationAccess } from '$lib/app/api/models/pageTranslation'
import sectionSchemas from '@southneuhof/landing-section-schema'
import { createNestedSectionFromSchemaData, createSectionFromSchema } from '@southneuhof/landing-sveltekit-framework/server'

export async function POST(event) {
  const { request, locals } = event;
  const body = await request.json()
  try {
    requirePermission(locals, 'create-section')

    if (!body.section_group_id) throw 'section_group_id is required'
    if (body.page_translation_id) {
      await requirePageTranslationAccess(event, { id: body.page_translation_id })
    }

    let sectionGroupId = body.section_group_id

    // Handle draft state
    if (body.page_translation_id) {
      const { page, idMap } = await ensureDraftState(body.page_translation_id)

      if (idMap) {
        console.log('[addSection] New draft was created. ID Map is present.')
        // A new draft was created, so map the section group ID to the new one.
        const newSectionGroupId = idMap.get(sectionGroupId)
        if (newSectionGroupId) {
          sectionGroupId = newSectionGroupId
        }
      } else {
        // A draft already existed. We need to find the section group for that draft.
        const draftSectionGroup = await prisma.sectionGroup.findFirst({
          where: { page_translation_id: page.id }
        })
        if (draftSectionGroup) {
          sectionGroupId = draftSectionGroup.id
        } else {
          throw new Error('Draft page exists but has no section group.')
        }
      }
    }

    const result = body.section_type_code
      ? await createSectionFromSchema({
          prisma,
          sectionSchemas,
          sectionGroupId,
          sectionTypeCode: body.section_type_code,
          name: body.name,
          description: body.description,
          meta: body.meta,
        })
      : await createNestedSectionFromSchemaData({
          prisma,
          sectionSchemas,
          sectionGroupId,
          name: body.name,
          description: body.description,
        })

    return success({ message: 'Section created', data: result.section })
  } catch (err) {
    return exception(err)
  }
}
