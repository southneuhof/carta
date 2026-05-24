import { success } from '$lib/utils/response.js';
import { json } from '@sveltejs/kit';
import { copySectionGroupContent } from '$lib/utils/section.js';
import type { RequestHandler } from './$types.js';
import { requirePermission } from '$lib/utils/routing';

export const POST: RequestHandler = async ({ request, locals }) => {
	requirePermission(locals, 'update-section');

	const { source_id, destination_id } = await request.json();

	if (!source_id || !destination_id) {
		return json({ error: 'source_id and destination_id are required' }, { status: 400 });
	}

	await copySectionGroupContent(source_id, destination_id);

	return success({ success: true });
};
