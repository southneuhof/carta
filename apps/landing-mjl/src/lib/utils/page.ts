import { copySectionGroupContent } from '$lib/utils/section';
import prisma from '$lib/utils/prisma';

/**
 * Ensures that a draft exists for a given PageTranslation.
 * If the page is already a draft, it does nothing.
 * If the page is published, it checks for an existing draft.
 * If no draft exists, it creates one by copying the published content.
 *
 * @param pageTranslationId The ID of the page translation to check.
 * @returns An object containing the final state of the page (which will be a draft), and an ID map if a new draft was created.
 */
export async function ensureDraftState(pageTranslationId: string) {
	const pageTranslation = await prisma.pageTranslation.findUnique({
		where: { id: pageTranslationId },
		include: { draft: true }
	});

	if (!pageTranslation) {
		throw new Error('Page translation not found.');
	}

	// If it's already a draft, or if it's a published page that already has a draft, we're good.
	if (pageTranslation.status_code === 'DRAFT') {
		return { page: pageTranslation, idMap: null };
	}
	if (pageTranslation.draft) {
		return { page: pageTranslation.draft, idMap: null };
	}

	// If we're here, it's a PUBLISHED page with no draft. Let's create one.
	console.log('[ensureDraftState] No draft exists, creating new draft for page:', pageTranslation.id);
	const draftTranslation = await prisma.pageTranslation.create({
		data: {
			page_id: pageTranslation.page_id,
			language: pageTranslation.language,
			status_code: 'DRAFT',
			live_for_id: pageTranslation.id
		}
	});

	const originalSectionGroup = await prisma.sectionGroup.findFirst({
		where: { page_translation_id: pageTranslation.id }
	});

	if (!originalSectionGroup) {
		// This might happen for a new, empty page.
		console.log('[ensureDraftState] Original page has no section group to copy.');
		return { page: draftTranslation, idMap: new Map() };
	}

	const draftSectionGroup = await prisma.sectionGroup.create({
		data: {
			page_translation_id: draftTranslation.id,
			order: originalSectionGroup.order
		}
	});

	console.log(
		'[ensureDraftState] Copying section group content from',
		originalSectionGroup.id,
		'to',
		draftSectionGroup.id
	);
	const idMap = await copySectionGroupContent(originalSectionGroup.id, draftSectionGroup.id);

	return { page: draftTranslation, idMap };
} 