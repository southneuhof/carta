import prisma from '$lib/utils/prisma';
import { exception, success } from '$lib/utils/response';
import { requirePermission } from '$lib/utils/routing';
import { requireMenuItemAccess } from '$lib/app/api/models/menuItem';

export async function POST(event) {
	const { request, locals } = event;
	try {
		requirePermission(locals, 'toggle-mappingRoleMenuItem');

		const { menu_item_id, role_id, active } = await request.json();
		await requireMenuItemAccess(event, { id: menu_item_id });

		if (!role_id || !menu_item_id) {
			return exception('menu_item_id and role_id are required', 400);
		}

		await prisma.menuItem.update({
			where: { id: menu_item_id },
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
