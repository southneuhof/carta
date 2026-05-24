import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import { languages } from '$lib/utils/common';
import prisma from '$lib/utils/prisma';
import type { Page } from '@prisma/client';
import { requireMenuItemAccess } from './menuItem';

export default {
  create: {
    allow: true,
    fields: ['menu_item_id'],
    authorize: requireMenuItemAccess,
    lifecycle: {
      pre: async (body: any) => {
        if (!body.menu_item_id) throw new Error('menu_item_id is required');

        body.menuItem = { connect: { id: body.menu_item_id } };
        delete body.menu_item_id;
        delete body.slug;
        return body;
      },
      main: async (body: any) => {
        return prisma.page.create({
          data: {
            menuItem: body.menuItem,
            translations: {
              create: languages.map((language) => ({
                language,
                status_code: 'DRAFT' as const,
                sectionGroups: {
                  create: {},
                },
              })),
            },
          },
          include: {
            translations: {
              include: {
                sectionGroups: {
                  select: { id: true },
                },
              },
            },
          },
        });
      }
    }
  },
  delete: {
    allow: true,
    by: ['id']
  }
} satisfies ModelConfig<Page>;
