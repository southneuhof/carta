import { error } from '@sveltejs/kit';
import { loadSectionData, loadSectionResources } from '@southneuhof/landing-sveltekit-framework/server';
import { hydrateSectionsFromSchemas } from '@southneuhof/landing-sveltekit-framework/server/schema';
import sectionSchemas from '@southneuhof/landing-section-schema';
import { getLocale } from '$lib/paraglide/runtime.js';
import { sectionLoaders } from '$lib/sections/section-loaders.server.js';
import { sectionResourceResolvers } from '$lib/sections/section-resource-resolvers.server.js';
import prisma from '$lib/utils/prisma.js';

export async function load({ params, url }: { params: { pageTranslationId: string }, url: URL }) {
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

  const hydratedSections = await hydrateSectionsFromSchemas(pageSectionGroup.sections, prisma, sectionSchemas);
  const resourceLoadedSections = await loadSectionResources(
    hydratedSections,
    sectionSchemas,
    sectionResourceResolvers,
    {
      prisma,
      getLocale,
      url,
    },
  );
  const sections = await loadSectionData(resourceLoadedSections, sectionLoaders, {
    prisma,
    getLocale,
    url,
  });

  return {
    sections,
    pageTranslationId: pageTranslation.id,
    status_code: pageTranslation.status_code,
  };
}
