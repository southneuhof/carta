import { getLocale } from '$lib/paraglide/runtime.js';
import prisma from '$lib/utils/prisma.js';
import { error } from '@sveltejs/kit';

export async function load({ params, url }) {
  const locale = getLocale();
  const id = params.id?.trim();

  if (!id) throw error(404, 'Career not found');

  const job = await prisma.job.findFirst({
    where: {
      id,
      active: true,
      jobCategory: {
        active: true,
        translations: {
          some: { language: locale },
        },
      },
      translations: {
        some: { language: locale },
      },
    },
    include: {
      translations: {
        where: { language: locale },
        select: {
          name: true,
          description: true,
          qualification: true,
          minimum_education: true,
          location: true,
        },
      },
      jobCategory: {
        select: {
          form_type_id: true,
          translations: {
            where: { language: locale },
            select: { name: true },
          },
        },
      },
    },
  });

  if (!job) throw error(404, 'Career not found');

  const translation = job.translations?.[0];
  const categoryName = job.jobCategory?.translations?.[0]?.name ?? '';

  if (!translation?.name || !translation?.minimum_education || !translation?.location || !categoryName) {
    throw error(404, 'Career not found');
  }

  return {
    career: {
      id: job.id,
      category: categoryName,
      name: translation.name,
      description: translation.description ?? '',
      qualification: translation.qualification ?? '',
      minimum_education: translation.minimum_education,
      location: translation.location,
      form_type_id: job.jobCategory?.form_type_id ?? null,
    },
    siteOrigin: url.origin,
  };
}
