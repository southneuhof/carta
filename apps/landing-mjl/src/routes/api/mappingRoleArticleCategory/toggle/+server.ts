import prisma from '$lib/utils/prisma';
import { exception, success } from '$lib/utils/response';
import { requirePermission } from '$lib/utils/routing';
import { requireArticleCategoryAccess } from '$lib/app/api/models/articleCategory';

export async function POST(event) {
	const { request, locals } = event;
	try {
		requirePermission(locals, 'toggle-mappingRoleArticleCategory');

		const { article_category_id, role_id, active } = await request.json();
		await requireArticleCategoryAccess(event, { id: article_category_id });

		if (!role_id || !article_category_id) {
			return exception('article_category_id and role_id are required', 400);
		}

		await prisma.articleCategory.update({
			where: { id: article_category_id },
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
