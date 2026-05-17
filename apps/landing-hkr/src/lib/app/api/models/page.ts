import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import { languages } from '$lib/utils/common';
import prisma from '$lib/utils/prisma';
import type { Page } from '@prisma/client';

export default {
  create: {
    allow: true,
    fields: ['menu_item_id'],
    lifecycle: {
      pre: async (body: any) => {
        if (body.menu_item_id) {
          body.menuItem = { connect: { id: body.menu_item_id } };
          delete body.menu_item_id;
        }
        delete body.slug;
        return body;
      },
      post: async (body: any, data: any) => {
        const translations = languages.map(language => ({
          language,
          page_id: data.id,
          status_code: 'DRAFT' as const
        }));
        const pageTranslations = await prisma.pageTranslation.createManyAndReturn({
          data: translations,
        });
        // create SectionGroups for each pageTranslations
        const sectionGroups = await prisma.sectionGroup.createManyAndReturn({
          data: pageTranslations.map(pt => ({
            page_translation_id: pt.id,
          }))
        });
        return sectionGroups;
      }
    }
  },
  delete: {
    allow: true,
    by: ['id']
  }
} satisfies ModelConfig<Page>;
