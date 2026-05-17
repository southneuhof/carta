import prisma from '$lib/utils/prisma'
import { exception, success } from '$lib/utils/response'
import { buildSectionStructure } from '$lib/utils/section.js'
import { ensureDraftState } from '$lib/utils/page'
import type { $Enums, SectionType } from '@prisma/client'
import { requirePermission } from '$lib/utils/routing'
import { requirePageTranslationAccess } from '$lib/app/api/models/pageTranslation'

export async function POST(event) {
  const { request, locals } = event;
  let body = await request.json()
  try {
    requirePermission(locals, 'create-section')

    if (!body.section_group_id) throw 'section_group_id is required'
    if (!body.config) throw 'config is required'
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

    // Determine if this is a top-level section add (no parent_section_id in group)
    // We'll assume top-level if body.name is not present (per your previous logic)
    const isTopLevel = !body.name

    const maxOrderSection = await prisma.section.findFirst({
      where: { 
        section_group_id: sectionGroupId,
      },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    let sectionName: string
    if (isTopLevel) {
      // Top-level: derive name from config.info.name
      if (!body.config.info?.name) throw 'config.info.name is required for top-level section'
      sectionName = body.config.info.name
    } else {
      // Child section: use provided name
      if (!body.name) throw 'name is required'
      sectionName = body.name
    }

    const createData = {
      name: sectionName,
      order: (maxOrderSection?.order ?? 0) + 1,
      section_group_id: sectionGroupId,
      section_type_code: body.config.info?.code,
      meta: body.config.meta?.defaultValues
    };
    const newSection = await prisma.section.create({
      data: createData
    })

    await buildSectionStructure(newSection, body.config)

    return success({ message: 'Section created', data: newSection })
  } catch (err) {
    return exception(err)
  }
}
