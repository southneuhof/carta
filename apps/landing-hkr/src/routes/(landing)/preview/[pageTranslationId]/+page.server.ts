import { error } from '@sveltejs/kit';
import { hydrateSectionsFromSchemas } from '@southneuhof/landing-sveltekit-framework/server/schema';
import sectionSchemas from '@southneuhof/landing-section-schema';
import prisma from '$lib/utils/prisma.js';

export async function load({ params }: { params: { pageTranslationId: string } }) {
  const { pageTranslationId } = params;

  if (!pageTranslationId) {
    throw error(400, 'Missing pageTranslationId');
  }

  const pageTranslation = await prisma.pageTranslation.findUnique({
    where: { id: pageTranslationId },
    include: { sectionGroups: true },
  });

  if (!pageTranslation) {
    throw error(404, 'Page translation not found');
  }

  const currentPageSectionGroup = pageTranslation.sectionGroups?.[0]?.id;

  if (!currentPageSectionGroup) {
    throw error(500, 'Section group not found for this page translation');
  }

  const pageSectionGroup = await prisma.sectionGroup.findUnique({
    where: { id: currentPageSectionGroup },
    include: {
      sections: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!pageSectionGroup) {
    throw error(500, 'Section group not found');
  }

  const sections = await hydrateSectionsFromSchemas(pageSectionGroup.sections, prisma, sectionSchemas);

  return {
    sections,
    pageTranslationId: pageTranslation.id,
    status_code: pageTranslation.status_code,
  };
}
