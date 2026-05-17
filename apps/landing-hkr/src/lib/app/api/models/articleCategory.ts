import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import { languages } from "$lib/utils/common";
import { requireRoleScopedAccess } from "$lib/app/api/authorization";
import { exception } from "$lib/utils/response";
import prisma from "$lib/utils/prisma";
import type { RequestEvent } from "@sveltejs/kit";
import type { ArticleCategory, Language } from "@prisma/client";

export async function requireArticleCategoryAccess(event: RequestEvent, input: Record<string, any>) {
  const id = input.id ?? input.article_category_id;
  if (!id) return;

  const record = await prisma.articleCategory.findUnique({
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
  fields: ['id', 'created_at', 'updated_at'],
  view: {
    fieldsForeign: {
      translations: {
        fields: ['language', 'name', 'description']
      }
    },
    customFields: [
      {
        name: 'name',
        generator: (data: any) => {
          return data?.translations?.find((translation: any) => translation.language === 'id')?.name;
        }
      } 
    ]
  },

  create: {
    allow: true,
    lifecycle: {
      post: async (body: any, data: any) => {
        const translations = languages.map(language => ({
          name: body.name,
          language,
          article_category_id: data.id
        }));
        await prisma.articleCategoryTranslation.createMany({
          data: translations
        });
        return {...data, ...body};
      }
    }
  },

  list: {
    allow: true,
    orderBy: { created_at: 'desc' },
    fieldsForeign: {
      translations: {
        fields: ['language', 'name', 'description']
      }
    },
    where: ({locals}) => {
      const isAdmin = Boolean(locals?.isPrivilegedRole);
      if (isAdmin) return undefined
      const roleId = locals.user?.role_id;
      if (!roleId) {
        return { id: '__no_access__' };
      }
      return {
        allowedRoles: {
          some: {
            id: roleId
          }
        }
      };
    }
  },

  detail: {
    permission: 'detail-articleCategory',
    authorize: requireArticleCategoryAccess,
    allow: true,
    by: ['id'],
    fieldsForeign: {
      translations: {
        fields: ['language', 'name', 'description']
      }
    }
  },

  update: {
    authorize: requireArticleCategoryAccess,
  },

  delete: {
    authorize: requireArticleCategoryAccess,
    allow: true,
    by: ['id']
  }
} as ModelConfig<ArticleCategory>;
