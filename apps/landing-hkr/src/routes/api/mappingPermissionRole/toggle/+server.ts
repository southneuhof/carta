import prisma from '$lib/utils/prisma';
import { exception, success } from '$lib/utils/response';
import { requirePermission } from '$lib/utils/routing';

export async function POST({ request, locals }) {
	try {
		requirePermission(locals, 'toggle-mappingPermissionRole');

		const { role_id, permission_code, active } = await request.json();

		if (!role_id || !permission_code) {
			return exception('role_id and permission_code are required', 400);
		}

		await prisma.role.update({
			where: { id: role_id },
			data: {
				permissions: active ? { connect: { code: permission_code } } : { disconnect: { code: permission_code } }
			}
		});

		return success({ data: { success: true } }, 200);
	} catch (error) {
		console.error('Failed to update permission:', error);
		return exception('Failed to update permission');
	}
}
