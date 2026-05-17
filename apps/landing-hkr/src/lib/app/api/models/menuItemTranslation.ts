import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import { parseSlug } from "$lib/utils/common";
import prisma from "$lib/utils/prisma";
import type { Language, MenuItemTranslation } from "@prisma/client";

export default {
  allow: true,
  fields: ['id', 'menu_item_id', 'language', 'name', 'description', 'media'],

  create: {
    allow: false,
  },

  update: {
    by: ['id'],
    fields: ['name', 'description', 'media'],
    validation: {
      name: [
        {
          validator: (value: string) => typeof value === 'string' && value.length > 0,
          message: 'Name is required'
        }
      ]
    },
    lifecycle: {
      post: async (body: any, data: any) => {
        // update parent menu item slug
        const menuItem = await prisma.menuItem.findUnique({ where: { id: data.menu_item_id } });
        if (!menuItem) return body;
        if (body.language !== 'id') return body;
        await prisma.menuItem.update({
          where: { id: menuItem.id },
          data: { slug: parseSlug(body.name) }
        })
        return body;
      }
    }
  },

  detail: {
    by: ['menu_item_id', 'language'],
    fields: ['id', 'menu_item_id', 'language', 'name', 'description', 'media'],
  },
} as ModelConfig<MenuItemTranslation>