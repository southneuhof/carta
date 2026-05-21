import { isBypassAllPermissionsEnabled, requireAuthenticatedUser } from '$lib/utils/routing';
import { exception, success } from '@southneuhof/landing-sveltekit-framework';
import { createPublicFolder } from '$lib/files/publicAssetManager';

export const POST = async ({ locals, request }: any) => {
  try {
    if (!isBypassAllPermissionsEnabled()) {
      requireAuthenticatedUser(locals);
    }

    const body = await request.json();
    const dir = String(body?.dir || '/storage/public');
    const folderName = String(body?.folder_name || '');

    const folder = await createPublicFolder({ dir, folderName });
    return success(folder);
  } catch (err) {
    return exception(err);
  }
};
