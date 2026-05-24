import { createFormSubmissionHandler, exception } from '@southneuhof/landing-sveltekit-framework';
import prisma from '$lib/utils/prisma.js';
import { validateField } from '$lib/utils/form';

const submitHandler = createFormSubmissionHandler({
  findFormTypeWithFields: async (formTypeId) => {
    return prisma.formType.findUnique({
      where: { id: formTypeId },
      include: { fields: { orderBy: { order: 'asc' } } },
    });
  },
  saveSubmission: async ({ form_type_id, data }: { form_type_id: string; data: Record<string, unknown> }) => {
    return prisma.formSubmission.create({
      data: {
        form_type_id,
        data: data as any,
      },
    });
  },
  requiredMessage: (field) => `${field.label} harus diisi`,
  invalidFormatMessage: (field) => `Format ${field.validation_type_code} tidak valid`,
  validateField: (value, code) => validateField(value, code as any),
});

export async function POST({ request }) {
  try {
    const body = await request.json();
    return await submitHandler(body);
  } catch (error) {
    console.error('Form submission error:', error);
    return exception('Failed to process form submission');
  }
}
