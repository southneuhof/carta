import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import { languages, parseSlug } from "$lib/utils/common";
import { requireRoleScopedAccess } from "$lib/app/api/authorization";
import { exception } from "$lib/utils/response";
import prisma from "$lib/utils/prisma";
import type { RequestEvent } from "@sveltejs/kit";
import type { Prisma } from "@prisma/client";

export async function requireArticleAccess(event: RequestEvent, input: Record<string, any>) {
  const id = input.id ?? input.article_id;
  if (!id) return;

  const record = await prisma.article.findUnique({
    where: { id: String(id) },
    select: {
      categories: {
        select: {
          allowedRoles: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (!record) throw exception('Record not found', 404);

  const allowedRoleIds = record.categories.flatMap((category) =>
    category.allowedRoles.map((role) => role.id),
  );

  requireRoleScopedAccess(event.locals, allowedRoleIds);
}

export default {
  allow: true,
  fields: ["id", "created_at", "updated_at"], // Removed 'article_category_id'
  types: {
    categories: {
      type: "multi",
      params: {
        by: "id",
      },
    },
  },

  view: {
    fieldsForeign: {
      translations: {
        fields: [
          "language",
          "title",
          "slug",
          "excerpt",
          "thumbnail",
          "status_code",
        ],
      },
      categories: {
        // Changed from 'category' to 'categories'
        fields: ["id"], // Optionally specify fields from ArticleCategory itself
        fieldsForeign: {
          translations: {
            // Translations for each category
            fields: ["name", "language"],
          },
        },
      },
    },
    customFields: [
      {
        name: "category_name",
        generator(data: any) {
          // Assuming you want the name of the first category, and 'id' as default language
          return data.categories?.[0]?.translations?.find(
            (translation: any) => translation.language === "id",
          )?.name;
        },
      },
    ],
  },

  create: {
    allow: true,
    fields: ["categories", "created_at"], // Changed 'article_category_id' to 'categories', added 'title' as it's used in post lifecycle
    lifecycle: {
      post: async (body: any, data: any) => {
        const translations = languages.map((language) => ({
          title: body.title, // Ensure title is passed in body for create
          slug: parseSlug(body.title),
          language,
          status_code: "DRAFT",
          article_id: data.id,
        }));
        await prisma.articleTranslation.createMany({
          data: translations,
        });
        // prisma.article.create({
        //   data: {
        //     categories: {
        //       connect: body.categories.map((catId: string) => ({ id: catId }))
        //     }
        //   }
        // })
        // Handling for connecting categories would typically be here if 'categories' in body.fields is an array of IDs
        // For example, if body.categories is an array of category IDs:
        if (body.categories && Array.isArray(body.categories)) {
          await prisma.article.update({
            where: { id: data.id },
            data: {
              categories: {
                connect: body.categories.map((catId: string) => ({
                  id: catId,
                })),
              },
            },
          });
        }
        return { ...data, ...body };
      },
    },
  },

  update: {
    allow: true,
    authorize: requireArticleAccess,
    fields: ["categories", "created_at"], // Changed 'article_category_id' to 'categories'
    by: ["id"],
    validation: {
      translations: [
        {
          validator: (translations) => {
            console.log(
              "translations",
              translations,
              Array.isArray(translations),
            );
            return (
              typeof translations === "object" &&
              Object.keys(translations).length > 0
            );
          },
          message: "At least one translation is required",
        },
      ],
    },
  },

  list: {
    allow: true,
    filterableBy: ["categories"], // Changed 'article_category_id' to 'categories'
    orderBy: { created_at: "desc" },
    // fieldsForeign for list might also need categories if you display category info in the list
    fieldsForeign: {
      translations: {
        fields: [
          "language",
          "title",
          "slug",
          "excerpt",
          "thumbnail",
          "status_code",
        ],
      },
      categories: {
        fields: ["id"],
        fieldsForeign: {
          translations: {
            fields: ["name", "language"],
          },
        },
      },
    },
    where: async (event) => {
      const searchWhere = event.url.searchParams.get("search")
        ? {
            field: "translations",
            operator: "some" as const,
            value: {
              title: {
                contains: event.url.searchParams.get("search"),
                mode: "insensitive",
              },
            },
          }
        : undefined;

      if (event.locals.isPrivilegedRole)
        return event.url.searchParams.get("search")
          ? { AND: [searchWhere] }
          : undefined;

      // Get all category IDs that the user's role has access to
      const roleWithCategories = await prisma.role.findUnique({
        where: { id: event.locals.user?.role_id },
        select: {
          accessibleArticleCategory: {
            select: { id: true },
          },
        },
      });

      const accessibleCategoryIds =
        roleWithCategories?.accessibleArticleCategory.map(
          (cat: { id: string }) => cat.id,
        ) || [];

      // If role has no accessible categories, return no results
      if (accessibleCategoryIds.length === 0) {
        return {
          AND: [{ field: "id", operator: "equals", value: "non-existent-id" }],
        };
      }

      // Check that the article has ALL the categories that the role has access to
      return {
        AND: [
          searchWhere,
          {
            field: "categories",
            operator: "some" as const,
            value: { id: { in: accessibleCategoryIds } },
          },
        ].filter(Boolean),
      };
    },
    lifecycle: {
      post: async (data, total, locals) => {
        return data.map((item: any) => {
          const prioritizedTranslations = new Map();
          for (const translation of item.translations) {
            const existing = prioritizedTranslations.get(translation.language);
            if (
              !existing ||
              ["DRAFT", "REVIEW"].includes(translation.status_code)
            ) {
              prioritizedTranslations.set(translation.language, translation);
            }
          }
          return {
            ...item,
            translations: Object.fromEntries(
              prioritizedTranslations instanceof Map
                ? prioritizedTranslations.entries()
                : Object.entries(prioritizedTranslations),
            ),
          };
        });
      },
    },
  },

  detail: {
    authorize: requireArticleAccess,
    allow: true,
    by: ["id"],
    // Ensure fieldsForeign for detail also reflects 'categories'
    fieldsForeign: {
      translations: {
        fields: [
          "id",
          "language",
          "title",
          "slug",
          "excerpt",
          "thumbnail",
          "content",
          "status_code",
        ], // Added content for detail view and status_code for prioritization
      },
      categories: {
        fields: ["id"],
        fieldsForeign: {
          translations: {
            fields: ["name", "language", "description"], // Added description for category detail
          },
        },
      },
    },
    lifecycle: {
      post: async (data) => {
        if (data?.translations && Array.isArray(data.translations)) {
          const prioritizedTranslations = new Map<string, any>();
          for (const translation of data.translations) {
            const existing = prioritizedTranslations.get(translation.language);
            if (
              !existing ||
              ["DRAFT", "REVIEW"].includes(translation.status_code)
            ) {
              prioritizedTranslations.set(translation.language, translation);
            }
          }
          data.translations = Object.fromEntries(
            prioritizedTranslations instanceof Map
              ? prioritizedTranslations.entries()
              : Object.entries(prioritizedTranslations as any),
          );
        }
        return data;
      },
    },
  },

  delete: {
    authorize: requireArticleAccess,
    allow: true,
    by: ["id"],
  },
} as ModelConfig<
  Prisma.ArticleGetPayload<{
    include: {
      translations: true;
      categories: { include: { translations: true } };
    };
  }>
>; // Updated Prisma GetPayload
