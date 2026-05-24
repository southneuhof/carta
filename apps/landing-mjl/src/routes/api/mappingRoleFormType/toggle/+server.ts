import prisma from '$lib/utils/prisma';
import { exception, success } from '$lib/utils/response';
import { requirePermission } from '$lib/utils/routing';
import { requireFormTypeAccess } from '$lib/app/api/models/formType';

export async function POST(event) {
	const { request, locals } = event;
	try {
		requirePermission(locals, 'toggle-mappingRoleFormType');

		const { form_type_id, role_id, active } = await request.json();
		await requireFormTypeAccess(event, { id: form_type_id });

		if (!role_id || !form_type_id) {
			return exception('form_type_id and role_id are required', 400);
		}

		await prisma.formType.update({
			where: { id: form_type_id },
			data: {
				allowedRoles: active ? { connect: { id: role_id } } : { disconnect: { id: role_id } }
			}
		});

		return success({ data: { success: true } }, 200);
	} catch (error) {
		console.error('Failed to update form type role access control:', error);
		return exception('Failed to update form type role access control');
	}
}
