import prisma from '$lib/utils/prisma.js';
import { success } from '$lib/utils/response';
import { json } from '@sveltejs/kit';
import { requirePermission } from '$lib/utils/routing';
import { requireArticleTranslationAccess } from '$lib/app/api/models/articleTranslation';

export async function POST(event) {
  const { request, locals } = event;
  requirePermission(locals, 'update-article');

  const { source_id, destination_id } = await request.json();
  await requireArticleTranslationAccess(event, { id: source_id });
  await requireArticleTranslationAccess(event, { id: destination_id });

  if (!source_id || !destination_id) {
    return json({ error: 'source_id and destination_id are required' }, { status: 400 });
  }

  const sourceData = await prisma.articleTranslation.findUnique({
    where: { id: source_id },
    select: {
      title: true,
      slug: true,
      content: true,
      excerpt: true,
      thumbnail: true
    }
  });

  if (!sourceData) {
    return json({ error: 'source data not found' }, { status: 404 });
  }

  await prisma.articleTranslation.update({
    where: { id: destination_id },
    data: sourceData
  })

  return success({ success: true });
}
