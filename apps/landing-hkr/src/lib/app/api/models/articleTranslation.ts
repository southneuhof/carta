import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import { parseSlug } from "$lib/utils/common";
import type { ArticleTranslation } from "@prisma/client";
import type { RequestEvent } from "@sveltejs/kit";
import prisma from '$lib/utils/prisma';
import { ensureArticleDraftState } from '$lib/utils/article';
import { exception } from '$lib/utils/response';
import { hasGlobalPermissionAccess } from '$lib/utils/routing';
import { requireArticleAccess } from './article';

export async function requireArticleTranslationAccess(event: RequestEvent, input: Record<string, any>) {
  if (hasGlobalPermissionAccess(event.locals)) return;

  const id = input.id;
  if (id) {
    const record = await prisma.articleTranslation.findUnique({
      where: { id: String(id) },
      select: {
        article: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!record) throw exception('Record not found', 404);
    await requireArticleAccess(event, { id: record.article.id });
    return;
  }

  if (input.article_id) {
    await requireArticleAccess(event, { id: input.article_id });
  }
}

export default {
  allow: true,
  // fields: ['id', 'article_id', 'language', 'title'],

  create: {
    allow: false,
  },

  update: {
    allow: true,
    permission: 'update-article',
    authorize: requireArticleTranslationAccess,
    by: ['id'],
    fields: ['title', 'slug', 'content', 'excerpt', 'thumbnail', 'status_code'],
    validation: {
      title: [
        {
          validator: (value: string) => value && value.length > 0,
          message: 'Title is required'
        }
      ]
    },
    lifecycle: {
      async pre(body) {
        if (body.title) {
          body.slug = parseSlug(body.title);
        }
        // Removed automatic draft creation logic
        return body;
      }
    },
  },

  delete: {
    permission: 'delete-article',
    authorize: requireArticleTranslationAccess,
    by: ['id']
  },

  detail: {
    permission: 'view-article',
    authorize: requireArticleTranslationAccess,
    by: ['article_id', 'language'],
    lifecycle: {
      async main(where) {
        // Try to find a draft first
        const draft = await prisma.articleTranslation.findFirst({
          where: { ...where, OR: [{status_code: 'DRAFT'}, {status_code: 'REVIEW'}] }
        });
        if (draft) return draft;

        // If no draft, try to find published
        const published = await prisma.articleTranslation.findFirst({
          where: { ...where, status_code: 'PUBLISHED' }
        });
        if (published) return published;

        throw new Error('No draft or published translation found for this article/language.');
      }
    }
  },

  verify: {
    allow: true,
    permission: 'verify-article',
    authorize: requireArticleTranslationAccess,
    by: 'id',
    stateField: 'status_code',
    initialState: 'DRAFT',
    states: ['DRAFT', 'REVIEW', 'PUBLISHED'],
    transitions: {
      MARK_AS_UNDONE: {
        from: 'REVIEW',
        to: 'DRAFT'
      },
      MARK_AS_DONE: {
        from: 'DRAFT',
        to: 'REVIEW'
      },
      APPROVE: {
        from: 'DRAFT',
        to: 'PUBLISHED'
      },
      REVISE: {
        from: 'DRAFT',
        to: 'DRAFT'
      },
      RESET: {
        from: 'DRAFT',
        to: 'PUBLISHED'
      }
    },
    lifecycle: {
      async main(body, locals, where) {
        const { id, action } = body;

        if (!where) throw new Error('A "where" clause must be provided for this operation.');

        if (action === 'MARK_AS_UNDONE') {
          const record = await prisma.articleTranslation.findUnique({ where: where as any });
          if (!record) throw new Error('Record not found.');
          return await prisma.articleTranslation.update({
            where: where as any,
            data: {
              status_code: 'DRAFT',
            }
          });
        }

        if (action === 'MARK_AS_DONE') {
          const record = await prisma.articleTranslation.findUnique({ where: where as any });
          if (!record) throw new Error('Record not found.');
          return await prisma.articleTranslation.update({
            where: where as any,
            data: {
              status_code: 'REVIEW',
            }
          });
        }

        if (action === 'APPROVE') {
          const record = await prisma.articleTranslation.findUnique({ where: where as any });
          if (!record) throw new Error('Record not found.');

          if (!record.live_for_id) {
            // Not linked to a published article, just promote this draft
            return await prisma.articleTranslation.update({
              where: where as any,
              data: {
                status_code: 'PUBLISHED',
                live_for_id: null
              }
            });
          }

          // Linked to a published article, do the full swap
          return await prisma.$transaction(async (tx) => {
            await tx.articleTranslation.delete({ where: { id: record.live_for_id! } });
            return await tx.articleTranslation.update({
              where: where as any,
              data: {
                status_code: 'PUBLISHED',
                live_for_id: null
              }
            });
          });
        } else if (action === 'REVISE') {
          // For revision, we just return the record unchanged.
          // The log with the description is created by the generic handler.
          const record = await prisma.articleTranslation.findUnique({ where: where as any });
          if (!record) throw new Error('Record not found');
          return record;
        } else if (action === 'RESET') {
          // Delete the current Draft/Review record, so that it goes back to the current published
          // ONLY DELETE if there is a published record
          const current = await prisma.articleTranslation.findFirst({ where: { ...where } });
          if (!current?.live_for_id) throw new Error('Tidak ada artikel yang sudah dipublish untuk menggantikan artikel ini');
          const published = await prisma.articleTranslation.findFirst({ where: { id: current.live_for_id } });
          if (!published) throw new Error('Tidak ada artikel yang sudah dipublish untuk menggantikan artikel ini');
          else await prisma.articleTranslation.delete({ where: where as any });
          return {};
        }

        return {};
      }
    }
  }
} as ModelConfig<ArticleTranslation>;
