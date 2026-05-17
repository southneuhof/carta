import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import { languages, parseSlug } from "$lib/utils/common";
import { hasRoleScopedAccess, requireRoleScopedAccess } from "$lib/app/api/authorization";
import { exception } from "$lib/utils/response";
import prisma from "$lib/utils/prisma";
import type { RequestEvent } from "@sveltejs/kit";
import type { Prisma } from "@prisma/client";

export async function requireMenuItemAccess(event: RequestEvent, input: Record<string, any>) {
  const id = input.id ?? input.menu_item_id;
  if (!id) return;

  const record = await prisma.menuItem.findUnique({
    where: { id: String(id) },
    select: {
      allowedRoles: {
        select: { id: true },
      },
    },
  });

  if (!record) throw exception('Record not found', 404);
  requireRoleScopedAccess(event.locals, record.allowedRoles.map((role) => role.id));
}

export default {
  allow: true,
  fields: ['id', 'parent_id', 'role', 'visible', 'level', 'order', 'menu_item_type', 'show_submenu_below_navbar', 'url', 'slug'],
  types: {
    order: {
      type: 'number'
    }
  },

  create: {
    validation: {
      name: [
        {
          validator: (value: string) => typeof value === 'string' && value.length >= 0,
          message: 'Nama harus diisi'
        }
      ],
    },
    lifecycle: {
      pre: async (body) => {
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        if (!name) throw new Error('Nama harus diisi');

        let level = 1;
        if (!body.parent_id) {
          body.level = level;
        } else {
          const parent = await prisma.menuItem.findUnique({
            where: { id: body.parent_id },
            select: { level: true }
          });
          if (!parent) throw new Error('Parent not found');
          level = parent.level + 1;
          body.level = level;
        }

        // Find maximum order in the same level
        const maxOrderItem = await prisma.menuItem.findFirst({
          where: {
            level,
            parent_id: body.parent_id || null
          },
          orderBy: { order: 'desc' },
          select: { order: true }
        });

        body.order = (maxOrderItem?.order ?? 0) + 1;
        body.slug = parseSlug(body.slug || name);
        body.visible = false;
        return body;
      },
      main: async (body: any) => {
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const { name: _omitName, ...menuItemData } = body;

        const created = await prisma.$transaction(async (tx) => {
          const menuItem = await tx.menuItem.create({
            data: menuItemData,
          });

          await tx.menuItemTranslation.createMany({
            data: languages.map((language) => ({
              name,
              language,
              menu_item_id: menuItem.id,
            })),
          });

          return menuItem;
        });

        return {
          ...created,
          name,
        };
      }
    }
  },

  update: {
    authorize: requireMenuItemAccess,
    by: ['id'],
    fields: ['visible', 'url', 'role', 'show_submenu_below_navbar'],
    validation: {
      order: [
        {
          validator: (value) => typeof value === 'number' && value >= 0,
          message: 'Order must be a non-negative number'
        }
      ]
    },
    lifecycle: {
      pre: async (body) => {
        if (body.role) {
          await prisma.menuItem.updateMany({
            where: { role: body.role },
            data: { role: null }
          });
        }
        if (body.visible == null) body.visible = false
        return body
      },
      post: async (body, data) => {
        if (body.visible && body.role === 'primary') {
          await prisma.menuItem.update({
            where: {id: body.id},
            data: {visible: false}
          })
        }
        return data
      }
    }
  },

  list: {
    permission: 'view-website',
    searchableBy: ['id'],
    filterableBy: ['parent_id', "level"],
    orderBy: { order: 'asc' },
    fieldsForeign: {
      translations: {
        fields: ['name', 'language']
      },
      page: {
        fieldsForeign: {
          translations: {
            fields: ['language', 'status_code']
          }
        }
      },
      allowedRoles: {
        fields: ['id']
      }
    },
    lifecycle: {
      post: async (data, total, locals) => {
        // To add the 'can_edit' property, we must map over the data array
        // and return new objects, as the original `data` is read-only.
        return data.map((item: any) => {
          // We need to assert the type to get access to the 'allowedRoles' relation.
          const menuItem = item as Prisma.MenuItemGetPayload<{ include: { allowedRoles: true, page: true } }>;
          const can_edit = hasRoleScopedAccess(
            locals as App.Locals,
            (menuItem.allowedRoles ?? []).map((role) => role.id),
          );

          // Return a new object with all original properties plus 'can_edit'.
          // const page = {
            
          // }

          let prioritizedTranslations;
          if (menuItem.page[0]) {
            prioritizedTranslations = new Map();
            for (const translation of (menuItem.page[0] as any)?.translations) {
              const existing = prioritizedTranslations.get(translation.language);
              if (!existing || ['DRAFT', 'REVIEW'].includes(translation.status_code)) {
                prioritizedTranslations.set(translation.language, translation);
              }
            }
          }
          return {
            ...item,
            page: prioritizedTranslations
              ? Object.fromEntries(prioritizedTranslations.entries())
              : null,
            can_edit
          };
        });
      }
    }
  },

  detail: {
    permission: 'detail-menuItem',
    authorize: requireMenuItemAccess,
    by: ['id'],
    fieldsForeign: {
      translations: {
        fields: ['name', 'language']
      },
      allowedRoles: {
        fields: ['id']
      },
      page: {
        fields: ['id'],
        fieldsForeign: {
          translations: {
            fields: ['id', 'language', 'status_code'],
            fieldsForeign: {
              sectionGroups: {
                fields: ['id']
              }
            }
          }
        }
      },
      children: {
        fields: ['id', 'order'],
        fieldsForeign: {
          translations: {
            fields: ['name', 'language']
          }
        }
      },
    },
    lifecycle: {
      async post(data: Record<string, any>, _total?: number, locals?: Record<string, any>) {
        const can_edit = hasRoleScopedAccess(
          locals as App.Locals,
          (data.allowedRoles ?? []).map((role: { id: number | string }) => role.id),
        );

        if (data.page?.[0]?.translations) {
          const prioritizedTranslations = new Map();
          for (const translation of data.page[0].translations) {
            const existing = prioritizedTranslations.get(translation.language);
            if (!existing || ['DRAFT', 'REVIEW'].includes(translation.status_code)) {
              prioritizedTranslations.set(translation.language, translation);
            }
          }
          data.page[0].translations = Array.from(prioritizedTranslations.values());
        }

        return { 
          ...data, 
          has_page: !!(data.page && data.page[0]),
          can_edit
        };
      },
    }
  },

  delete: {
    authorize: requireMenuItemAccess,
    by: ['id'],
    allow: true
  },

  reorder: {
    allow: true,
    authorize: requireMenuItemAccess,
    axis: ['parent_id'],
    by: ['id']
  }
} as ModelConfig<Prisma.MenuItemGetPayload<{include: {allowedRoles: true, page: true}}>>;
