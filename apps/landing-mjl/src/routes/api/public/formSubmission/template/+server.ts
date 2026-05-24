import { createFormTemplateHandler, exception } from '@southneuhof/landing-sveltekit-framework';
import prisma from '$lib/utils/prisma.js';

const templateHandler = createFormTemplateHandler({
  findFields: async (formTypeId) => {
    return prisma.formField.findMany({
      where: { form_type_id: formTypeId },
      orderBy: { order: 'asc' },
    });
  },
});

export async function GET({ url }) {
  try {
    return await templateHandler(url.searchParams);
  } catch (err) {
    return exception(err);
  }
}
