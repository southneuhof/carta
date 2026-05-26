import { getLocale } from '$lib/paraglide/runtime.js';
import prisma from '$lib/utils/prisma.js';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
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
  const formTypeId = job.jobCategory?.form_type_id ?? null;

  if (!translation?.name || !categoryName || !formTypeId) {
    throw error(404, 'Career apply form is not available');
  }

  const formType = await prisma.formType.findUnique({
    where: { id: formTypeId },
    include: {
      fields: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!formType) {
    throw error(404, 'Career apply form is not available');
  }

  return {
    career: {
      id: job.id,
      category: categoryName,
      name: translation.name,
      description: translation.description ?? '',
      form_type_id: formTypeId,
    },
    formType: {
      id: formType.id,
      name: formType.name,
      description: formType.description ?? '',
    },
    formDataTemplate: {
      form_type_id: formTypeId,
      data: formType.fields.map((field) => ({ ...field, value: undefined })),
    },
  };
}
