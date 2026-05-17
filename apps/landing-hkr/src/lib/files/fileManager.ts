import path from 'node:path';
import {
  createFileManager,
  createImageManifestHandler as createFrameworkImageManifestHandler,
  createLocalFileStorageDriver,
  createStorageUrlLocationStrategy,
  imageProcessor,
  type FileMetadataRecord,
  type FileMetadataStore,
  type ImageMetadata,
} from '@southneuhof/landing-sveltekit-framework/server/files';
import prisma from '$lib/utils/prisma';

const publicBaseUrl = process.env.PUBLIC_APP_URL;

export const fileLocations = createStorageUrlLocationStrategy({
  publicBaseUrl,
  basePath: '/storage',
  defaultVisibility: 'private',
});

export const fileStorage = createLocalFileStorageDriver({
  root: path.join(process.cwd(), 'storage'),
});

export const fileMetadataStore: FileMetadataStore = {
  async get(fileKey: string, processor?: string): Promise<FileMetadataRecord | null> {
    if (processor && processor !== 'image') return null;

    const row = await (prisma as any).imageManifest.findUnique({
      where: { original_path: toManifestPath(fileKey) },
    });
    if (!row) return null;

    const variants = normalizeVariants(fileKey, row.variants ?? []);
    const data: ImageMetadata = {
      width: row.width,
      height: row.height,
      aspectRatio: row.aspect_ratio,
      format: row.format,
      size: row.size,
      placeholder: row.placeholder,
      variants,
    };

    return {
      fileKey,
      fileUrl: toStorageUrl(fileKey),
      processor: 'image',
      data: data as unknown as Record<string, unknown>,
      derivatives: data.variants.map((variant) => ({
        key: variant.key,
        url: variant.url,
        filename: path.basename(variant.key),
        contentType: `image/${variant.format}`,
        size: variant.size,
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },
  async upsert(record: FileMetadataRecord): Promise<void> {
    if (record.processor !== 'image') return;
    const data = record.data as unknown as ImageMetadata;

    await (prisma as any).imageManifest.upsert({
      where: { original_path: toManifestPath(record.fileKey) },
      create: {
        original_path: toManifestPath(record.fileKey),
        width: data.width,
        height: data.height,
        aspect_ratio: data.aspectRatio,
        format: data.format,
        size: data.size,
        placeholder: data.placeholder,
        variants: data.variants as unknown as object,
      },
      update: {
        width: data.width,
        height: data.height,
        aspect_ratio: data.aspectRatio,
        format: data.format,
        size: data.size,
        placeholder: data.placeholder,
        variants: data.variants as unknown as object,
      },
    });
  },
  async delete(fileKey: string, processor?: string): Promise<void> {
    if (processor && processor !== 'image') return;
    await (prisma as any).imageManifest.delete({
      where: { original_path: toManifestPath(fileKey) },
    }).catch(() => undefined);
  },
};

export const fileManager = createFileManager({
  storage: fileStorage,
  locations: fileLocations,
  metadataStore: fileMetadataStore,
  processors: [imageProcessor()],
  upload: {
    allowedVisibilities: ['public', 'private'],
    defaultVisibility: 'private',
  },
});

export const createImageManifestHandler = () => createFrameworkImageManifestHandler({
  metadataStore: fileMetadataStore,
  keyFromRequest: ({ params }) => {
    const pathParam = (params as any).path ?? '';
    return pathParam.startsWith('/') ? pathParam : `/${pathParam}`;
  },
});

function toManifestPath(fileKey: string): string {
  return fileKey.startsWith('/storage/') ? fileKey : `/storage/${fileKey}`;
}

function toStorageUrl(fileKey: string): string {
  const pathName = toManifestPath(fileKey);
  return publicBaseUrl ? new URL(pathName, publicBaseUrl).toString() : pathName;
}

function normalizeVariants(fileKey: string, variants: any[]): ImageMetadata['variants'] {
  const normalizedFileKey = fileKey.replace(/^\/storage\//, '');
  const baseKey = path.dirname(normalizedFileKey);

  return variants.map((variant) => {
    const key = variant.key ?? path.join(baseKey, variant.path);
    return {
      width: variant.width,
      format: variant.format,
      key,
      url: variant.url ?? toStorageUrl(key),
      size: variant.size,
    };
  });
}
