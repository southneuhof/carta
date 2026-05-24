import prisma from '$lib/utils/prisma'
import { exception, success } from '$lib/utils/response'
import { ensureDraftState } from '$lib/utils/page'
import { requirePermission } from '$lib/utils/routing'
import { requirePageTranslationAccess } from '$lib/app/api/models/pageTranslation'
import sectionSchemas from '@client/section-schema'
import { createNestedSectionFromSchemaData, createSectionFromSchema } from '@southneuhof/landing-sveltekit-framework/server'
import { resolveDraftTargetSectionGroupId } from './resolveDraftTargetSectionGroupId'

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
      const { idMap } = await ensureDraftState(body.page_translation_id)
      sectionGroupId = resolveDraftTargetSectionGroupId({ sectionGroupId, idMap })
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
