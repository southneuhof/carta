import { promises as fs } from 'node:fs';
import path from 'node:path';
import { lookup } from 'mime-types';

export type PublicAssetItem = {
  type: 'file' | 'folder';
  path: string;
  url: string;
  filename: string;
  size: number;
  content_type: string;
  updated_at: string;
};

const STORAGE_ROOT = path.join(process.cwd(), 'storage');
const PUBLIC_ROOT = path.join(STORAGE_ROOT, 'public');
const PUBLIC_PREFIX = '/storage/public';

export function isPublicStoragePath(storagePath: string): boolean {
  const normalized = normalizeStoragePath(storagePath);
  return normalized === PUBLIC_PREFIX || normalized.startsWith(`${PUBLIC_PREFIX}/`);
}

export function normalizePublicStoragePath(input?: string | null): string {
  const value = normalizeStoragePath(input ?? PUBLIC_PREFIX);
  if (!isPublicStoragePath(value)) {
    throw new Error('Only /storage/public paths are allowed');
  }
  return value;
}

export function normalizeStoragePath(input: string): string {
  const raw = (input || '').trim();
  if (!raw) return PUBLIC_PREFIX;

  let pathname = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      pathname = new URL(raw).pathname;
    } catch {
      pathname = raw;
    }
  }

  if (!pathname.startsWith('/')) pathname = `/${pathname}`;
  pathname = pathname.replace(/\\/g, '/').replace(/\/+/g, '/');

  if (!pathname.startsWith('/storage/')) {
    throw new Error('Path must start with /storage');
  }

  const parts = pathname.split('/').filter(Boolean);
  const normalizedParts: string[] = [];
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      throw new Error('Path traversal is not allowed');
    }
    normalizedParts.push(part);
  }

  return `/${normalizedParts.join('/')}`;
}

export function toAbsolutePublicPath(storagePath: string): string {
  const normalized = normalizePublicStoragePath(storagePath);
  const relative = normalized.replace(/^\/storage\//, '');
  const absolute = path.resolve(STORAGE_ROOT, relative);
  const publicRootResolved = path.resolve(PUBLIC_ROOT);

  if (absolute !== publicRootResolved && !absolute.startsWith(`${publicRootResolved}${path.sep}`)) {
    throw new Error('Path is outside /storage/public');
  }

  return absolute;
}

export async function ensurePublicRoot(): Promise<void> {
  await fs.mkdir(PUBLIC_ROOT, { recursive: true });
}

export async function listPublicAssets(params: {
  dir?: string;
  type?: 'file' | 'folder';
  sort_by?: 'filename' | 'size' | 'content_type' | 'updated_at';
  sort?: 'asc' | 'desc';
  limit?: number;
  baseUrl?: string;
}): Promise<PublicAssetItem[]> {
  const dir = normalizePublicStoragePath(params.dir ?? PUBLIC_PREFIX);
  const absoluteDir = toAbsolutePublicPath(dir);
  await ensurePublicRoot();

  const entries = await fs.readdir(absoluteDir, { withFileTypes: true });
  const items: PublicAssetItem[] = [];

  for (const entry of entries) {
    const absoluteItemPath = path.join(absoluteDir, entry.name);
    const stat = await fs.stat(absoluteItemPath);
    const rel = path.relative(STORAGE_ROOT, absoluteItemPath).split(path.sep).join('/');
    const storagePath = normalizePublicStoragePath(`/storage/${rel}`);
    const type = entry.isDirectory() ? 'folder' : 'file';

    if (params.type && params.type !== type) continue;

    const contentType = type === 'folder' ? 'inode/directory' : (lookup(entry.name) || 'application/octet-stream');
    const size = type === 'folder' ? 0 : stat.size;
    const updatedAt = stat.mtime.toISOString();

    items.push({
      type,
      path: storagePath,
      url: toAssetUrl(storagePath, params.baseUrl),
      filename: entry.name,
      size,
      content_type: contentType,
      updated_at: updatedAt,
    });
  }

  const sortBy = params.sort_by ?? 'updated_at';
  const sortDirection = params.sort === 'asc' ? 1 : -1;

  items.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;

    const left = a[sortBy];
    const right = b[sortBy];

    if (typeof left === 'number' && typeof right === 'number') return sortDirection * (left - right);
    return sortDirection * String(left).localeCompare(String(right));
  });

  if (typeof params.limit === 'number' && params.limit > 0) {
    return items.slice(0, params.limit);
  }

  return items;
}

export async function createPublicFolder(params: { dir: string; folderName: string }): Promise<PublicAssetItem> {
  const dir = normalizePublicStoragePath(params.dir);
  const folderName = (params.folderName || '').trim();

  if (!folderName) throw new Error('folder_name is required');
  if (folderName.includes('/') || folderName.includes('\\')) throw new Error('folder_name cannot contain slashes');
  if (folderName === '.' || folderName === '..') throw new Error('Invalid folder_name');

  const folderStoragePath = normalizePublicStoragePath(`${dir}/${folderName}`);
  const folderAbsolutePath = toAbsolutePublicPath(folderStoragePath);
  await fs.mkdir(folderAbsolutePath, { recursive: true });

  const stat = await fs.stat(folderAbsolutePath);

  return {
    type: 'folder',
    path: folderStoragePath,
    url: folderStoragePath,
    filename: folderName,
    size: 0,
    content_type: 'inode/directory',
    updated_at: stat.mtime.toISOString(),
  };
}

export async function deletePublicAsset(storagePath: string, options: {
  deleteFile?: (path: string) => Promise<void>;
} = {}): Promise<void> {
  const normalized = normalizePublicStoragePath(storagePath);
  const absolute = toAbsolutePublicPath(normalized);
  const stat = await fs.stat(absolute);

  if (stat.isDirectory()) {
    if (options.deleteFile) {
      await deleteContainedFiles(normalized, absolute, options.deleteFile);
    }
    await fs.rm(absolute, { recursive: true, force: false });
    return;
  }

  if (options.deleteFile) {
    await options.deleteFile(normalized);
    return;
  }

  await fs.unlink(absolute);
}

async function deleteContainedFiles(storagePath: string, absolutePath: string, deleteFile: (path: string) => Promise<void>): Promise<void> {
  const entries = await fs.readdir(absolutePath, { withFileTypes: true });

  for (const entry of entries) {
    const childStoragePath = normalizePublicStoragePath(`${storagePath}/${entry.name}`);
    const childAbsolutePath = path.join(absolutePath, entry.name);

    if (entry.isDirectory()) {
      await deleteContainedFiles(childStoragePath, childAbsolutePath, deleteFile);
      continue;
    }

    await deleteFile(childStoragePath);
  }
}

export async function savePublicUpload(file: File, dir?: string | null, baseUrl?: string): Promise<PublicAssetItem> {
  const targetDir = normalizePublicStoragePath(dir ?? PUBLIC_PREFIX);
  const targetAbsoluteDir = toAbsolutePublicPath(targetDir);
  await fs.mkdir(targetAbsoluteDir, { recursive: true });

  const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const fileStoragePath = normalizePublicStoragePath(`${targetDir}/${safeFilename}`);
  const fileAbsolutePath = toAbsolutePublicPath(fileStoragePath);

  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fileAbsolutePath, bytes);

  const stat = await fs.stat(fileAbsolutePath);
  return {
    type: 'file',
    path: fileStoragePath,
    url: toAssetUrl(fileStoragePath, baseUrl),
    filename: safeFilename,
    size: stat.size,
    content_type: file.type || (lookup(safeFilename) || 'application/octet-stream'),
    updated_at: stat.mtime.toISOString(),
  };
}

function toAssetUrl(pathname: string, baseUrl?: string): string {
  if (!baseUrl) return pathname;
  try {
    return new URL(pathname, baseUrl).toString();
  } catch {
    return pathname;
  }
}
