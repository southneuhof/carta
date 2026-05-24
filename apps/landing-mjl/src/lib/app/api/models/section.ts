import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import type { Prisma } from "@prisma/client";
import { ensureDraftState } from '$lib/utils/page';

const ensureDraftPreHook = async (body: any) => {
	const { id, page_translation_id, ...rest } = body;
	if (!page_translation_id) return body;

	const { idMap } = await ensureDraftState(page_translation_id);

	if (idMap) {
		const newId = idMap.get(id);
		if (newId) {
			return { id: newId, page_translation_id, ...rest };
		}
	}

	return body;
};

export default {
  detail: {
    allow: true,
    by: ['id'],
    fieldsForeign: {
      contents: {
        fields: ['id', 'order', 'gallery_id'],
      },
      galleries: {
        fields: ['id', 'order']
      },
      childSections: {
        fields: ['id', 'order']
      },
      childSectionGroups: {
        fields: ['id', 'order'] 
      }
    },
    lifecycle: {
      async post(data) {
        data.contents = data.contents.sort((a: any, b: any) => a.order - b.order)
        data.galleries = data.galleries.sort((a: any, b: any) => a.order - b.order)
        data.childSections = data.childSections.sort((a: any, b: any) => a.order - b.order)
        data.childSectionGroups = data.childSectionGroups.sort((a: any, b: any) => a.order - b.order)
        // sort it descending by order
        const parsedStructure = [
          ...data.contents.map((item: any) => ({...item, type: 'content'})),
          ...data.galleries.map((item: any) => ({...item, type: 'gallery'})),
          ...data.childSections.map((item: any) => ({...item, type: 'section'})),
          ...data.childSectionGroups.map((item: any) => ({...item, type:'sectionGroup'}))
        ]
        return {
          ...data,
          structure: parsedStructure,
          contents: undefined,
          galleries: undefined,
          childSections: undefined,
          childSectionGroups: undefined
        }
      },
    }
  },

  delete: {
    allow: true,
    by: ['id'],
    lifecycle: {
      pre: ensureDraftPreHook
    }
  },

  update: {
    allow: true,
    by: ['id'],
    fields: ['name', 'description', 'visible', 'meta'],
    lifecycle: {
      pre: ensureDraftPreHook
    }
  },

  reorder: {
    allow: true,
    axis: ['section_group_id', 'parent_section_id'],
    lifecycle: {
      pre: ensureDraftPreHook
    }
  }
} as ModelConfig<Prisma.SectionGetPayload<{include: {contents: true, galleries: true, childSections: true, childSectionGroups: true}}>>