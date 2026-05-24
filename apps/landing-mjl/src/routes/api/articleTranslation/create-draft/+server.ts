import prisma from '$lib/utils/prisma';
import { success, exception } from '$lib/utils/response';
import type { ArticleTranslation } from '@prisma/client';
import { requirePermission } from '$lib/utils/routing';
import { requireArticleTranslationAccess } from '$lib/app/api/models/articleTranslation';

/**
 * Creates a draft copy of a published article translation.
 * @param {string} articleTranslationId - The ID of the published article translation to copy.
 * @returns {Promise<ArticleTranslation>} The newly created draft translation.
 */
async function createDraftFromPublished(articleTranslationId: string): Promise<ArticleTranslation> {
  // Find the published translation
  const published = await prisma.articleTranslation.findUnique({
    where: { id: articleTranslationId },
  });
  if (!published) throw new Error('Published article translation not found');
  if (published.status_code !== 'PUBLISHED') throw new Error('Only PUBLISHED translations can be copied to draft');

  // Check if a draft already exists for this published translation
  const existingDraft = await prisma.articleTranslation.findFirst({
    where: { live_for_id: published.id, status_code: 'DRAFT' },
  });
  if (existingDraft) return existingDraft;

  // Create a draft copy
  const { id, status_code, ...data } = published as any;
  const draft = await prisma.articleTranslation.create({
    data: {
      ...data,
      status_code: 'DRAFT',
      live_for_id: published.id,
    },
  });
  return draft;
}

export async function POST(event) {
  const { request, locals } = event;
  try {
    requirePermission(locals, 'update-article');

    const { article_translation_id } = await request.json();
    if (!article_translation_id) throw new Error('Missing article_translation_id');
    await requireArticleTranslationAccess(event, { id: article_translation_id });
    const draft = await createDraftFromPublished(article_translation_id);
    return success({ data: draft });
  } catch (err) {
    return exception(err);
  }
} 
