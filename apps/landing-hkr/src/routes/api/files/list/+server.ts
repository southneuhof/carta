import { isBypassAllPermissionsEnabled, requireAuthenticatedUser } from '$lib/utils/routing';
import { exception, success } from '@southneuhof/landing-sveltekit-framework';
import { listPublicAssets } from '$lib/files/publicAssetManager';

export const GET = async ({ locals, url }: any) => {
  try {
    if (!isBypassAllPermissionsEnabled()) {
      requireAuthenticatedUser(locals);
    }

    const dir = url.searchParams.get('dir') || '/storage/public';
    const type = (url.searchParams.get('type') || undefined) as 'file' | 'folder' | undefined;
    const sort_by = (url.searchParams.get('sort_by') || undefined) as 'filename' | 'size' | 'content_type' | 'updated_at' | undefined;
    const sort = (url.searchParams.get('sort') || undefined) as 'asc' | 'desc' | undefined;
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? Number(limitParam) : undefined;

    const items = await listPublicAssets({
      dir,
      type,
      sort_by,
      sort,
      limit: Number.isFinite(limit) ? limit : undefined,
      baseUrl: process.env.PUBLIC_APP_URL,
    });

    return success(items);
  } catch (err) {
    return exception(err);
  }
};
