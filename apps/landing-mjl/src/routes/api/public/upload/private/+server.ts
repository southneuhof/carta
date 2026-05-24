import { fileManager } from '$lib/files/fileManager';

const upload = fileManager.createUploadHandler();

export const POST = (event: any) => upload({
  ...event,
  params: {
    ...event.params,
    destination: 'private',
  },
});
