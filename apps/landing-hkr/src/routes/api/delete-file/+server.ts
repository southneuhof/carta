import { isBypassAllPermissionsEnabled, requireAuthenticatedUser } from '$lib/utils/routing';
import { exception, success } from '@southneuhof/landing-sveltekit-framework';
import { fileManager } from '$lib/files/fileManager';
import { deletePublicAsset, normalizePublicStoragePath } from '$lib/files/publicAssetManager';

export const POST = async ({ locals, request }: any) => {
  try {
    if (!isBypassAllPermissionsEnabled()) {
      requireAuthenticatedUser(locals);
    }

    const body = await request.json();
    const targetPath = normalizePublicStoragePath(String(body?.path || ''));

    await deletePublicAsset(targetPath, {
      deleteFile: (path) => fileManager.deleteFile(path),
    });
    return success({ path: targetPath, deleted: true });
  } catch (err) {
    return exception(err);
  }
};
