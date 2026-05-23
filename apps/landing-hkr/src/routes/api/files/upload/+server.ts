import { isBypassAllPermissionsEnabled, requireAuthenticatedUser } from '$lib/utils/routing';
import { exception, success } from '@southneuhof/landing-sveltekit-framework';
import type { FileObject } from '@southneuhof/landing-sveltekit-framework/server/files';
import { lookup } from 'mime-types';
import { stat } from 'node:fs/promises';
import { fileLocations, fileManager } from '$lib/files/fileManager';
import { normalizePublicStoragePath, toAbsolutePublicPath } from '$lib/files/publicAssetManager';

type ProcessingFileManager = typeof fileManager & {
  writeProcessedFile(file: FileObject, bytes: Buffer): Promise<FileObject>;
};

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

    const targetDir = normalizePublicStoragePath(dir);
    const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const targetPath = normalizePublicStoragePath(`${targetDir}/${safeFilename}`);
    const target = fileLocations.fromUrl(targetPath);
    if (!target) return exception('Invalid upload target', 400);

    const bytes = Buffer.from(await file.arrayBuffer());
    const written = await (fileManager as ProcessingFileManager).writeProcessedFile({
      ...target,
      contentType: file.type || (lookup(safeFilename) || undefined),
      visibility: 'public',
      size: bytes.length,
    }, bytes);
    const writtenStat = await stat(toAbsolutePublicPath(written.url));
    const writtenContentType = written.contentType || file.type || (lookup(written.filename) || 'application/octet-stream');
    const item = {
      type: 'file' as const,
      path: written.url,
      url: toAssetUrl(written.url, process.env.PUBLIC_APP_URL),
      filename: written.filename,
      size: written.size ?? writtenStat.size,
      content_type: writtenContentType,
      updated_at: writtenStat.mtime.toISOString(),
    };

    return success({ success: true, ...item, data: item.path });
  } catch (err) {
    return exception(err);
  }
};

function toAssetUrl(pathname: string, baseUrl?: string): string {
  if (!baseUrl) return pathname;
  try {
    return new URL(pathname, baseUrl).toString();
  } catch {
    return pathname;
  }
}
