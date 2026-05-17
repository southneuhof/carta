import { createModelAPI } from '@southneuhof/landing-sveltekit-framework/api';
import { authorizeOperation } from '$lib/app/api/authorization';
import { configs as models } from '$lib/app/api/models/_index';
import { fileManager } from '$lib/files/fileManager';
import prisma from '$lib/utils/prisma';

export const modelAPI = createModelAPI({
  data: {
    prisma,
    models,
  },
  auth: {
    authorizeOperation,
  },
  files: fileManager,
});
