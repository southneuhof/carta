import prisma from '$lib/utils/prisma';

/**
 * Ensures that a draft exists for a given ArticleTranslation.
 * If the translation is already a draft, it does nothing.
 * If the translation is published, it checks for an existing draft.
 * If no draft exists, it creates one by copying the published content.
 *
 * @param articleTranslationId The ID of the article translation to check.
 * @returns An object containing the final state of the translation (which will be a draft), and a boolean indicating if a new draft was created.
 */
export async function ensureArticleDraftState(articleTranslationId: string) {
	const articleTranslation = await prisma.articleTranslation.findUnique({
		where: { id: articleTranslationId },
		include: { draft: true }
	});

	if (!articleTranslation) {
		throw new Error('Article translation not found.');
	}

	// If it's already a draft, or if it's a published translation that already has a draft, we're good.
	if (articleTranslation.status_code === 'DRAFT') {
		return { translation: articleTranslation, created: false };
	}
	if (articleTranslation.draft) {
		return { translation: articleTranslation.draft, created: false };
	}

	const draftTranslation = await prisma.articleTranslation.create({
		data: {
			article_id: articleTranslation.article_id,
			language: articleTranslation.language,
			title: articleTranslation.title,
			slug: articleTranslation.slug,
			excerpt: articleTranslation.excerpt,
			thumbnail: articleTranslation.thumbnail,
			content: articleTranslation.content,
			status_code: 'DRAFT',
			live_for_id: articleTranslation.id
		}
	});

	return { translation: draftTranslation, created: true };
} 