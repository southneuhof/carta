import { isBypassAllPermissionsEnabled, requireAuthenticatedUser } from '$lib/utils/routing';
import { fileManager } from '$lib/files/fileManager';

const upload = fileManager.createUploadHandler();

export const POST = async (event: any) => {
  if (!isBypassAllPermissionsEnabled()) {
    requireAuthenticatedUser(event.locals);
  }

  return upload(event);
};
