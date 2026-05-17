import { requireAuthenticatedUser } from '$lib/utils/routing';
import { fileManager } from '$lib/files/fileManager';

const upload = fileManager.createUploadHandler();

export const POST = async (event: any) => {
  requireAuthenticatedUser(event.locals);
  return upload(event);
};
