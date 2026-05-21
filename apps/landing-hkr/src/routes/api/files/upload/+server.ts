import { isBypassAllPermissionsEnabled, requireAuthenticatedUser } from '$lib/utils/routing';
import { exception, success } from '@southneuhof/landing-sveltekit-framework';
import { savePublicUpload } from '$lib/files/publicAssetManager';

export const POST = async ({ locals, request }: any) => {
  try {
    if (!isBypassAllPermissionsEnabled()) {
      requireAuthenticatedUser(locals);
    }

    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      return exception('Invalid content type', 400);
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const dir = String(formData.get('dir') || '/storage/public');

    if (!(file instanceof File)) {
      return exception('No file uploaded', 400);
    }

    const item = await savePublicUpload(file, dir, process.env.PUBLIC_APP_URL);
    return success({ success: true, ...item, data: item.path });
  } catch (err) {
    return exception(err);
  }
};
