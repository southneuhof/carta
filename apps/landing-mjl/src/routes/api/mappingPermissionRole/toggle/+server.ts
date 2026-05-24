import prisma from '$lib/utils/prisma';
import { exception, success } from '$lib/utils/response';
import { requirePermission } from '$lib/utils/routing';

export async function POST({ request, locals }) {
	try {
		requirePermission(locals, 'toggle-mappingPermissionRole');

		const { role_id, permission_code, active } = await request.json();
		const normalizedRoleId = Number(role_id);

		if (!normalizedRoleId || !permission_code) {
			return exception('role_id and permission_code are required', 400);
		}

		if (typeof active !== 'boolean') {
			return exception('active must be a boolean', 400);
		}

		const updatedRole = await prisma.role.update({
			where: { id: normalizedRoleId },
			data: {
				permissions: active ? { connect: { code: permission_code } } : { disconnect: { code: permission_code } }
			},
			select: {
				permissions: {
					where: { code: permission_code },
					select: { code: true }
				}
			}
		});

		return success(
			{
				data: {
					success: true,
					role_id: normalizedRoleId,
					permission_code,
					active: updatedRole.permissions.length > 0
				}
			},
			200
		);
	} catch (error) {
		console.error('Failed to update permission:', error);
		return exception('Failed to update permission');
	}
}
