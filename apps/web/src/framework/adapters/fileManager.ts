import type { FileManagerPluginOptions, ManagedAsset } from '@southneuhof/is-vue-framework/file-manager'
import { deleteFile, fileUrl, listFiles, uploadFile } from './storage'

export function canonicalAsset(input: any, parentId: string | null = null): ManagedAsset {
  const source = input?.data && typeof input.data === 'object' ? input.data : input
  const id = String(source.id ?? source.uuid ?? source.path ?? source.url ?? '')
  if (!id) throw new Error('File Manager returned an asset without identity.')
  const mimeType = source.mimeType ?? source.mime_type ?? source.content_type
  return {
    id,
    parentId: source.parentId ?? source.parent_id ?? parentId,
    kind: source.kind === 'folder' || source.type === 'folder' || mimeType === 'inode/directory' ? 'folder' : 'file',
    name: String(source.name ?? source.filename ?? id.split('/').pop() ?? id),
    mimeType,
    size: source.size == null ? undefined : Number(source.size),
    updatedAt: source.updatedAt ?? source.updated_at,
    previewUrl: source.previewUrl ?? source.url ?? fileUrl(id),
    metadata: { source },
  }
}

export const fileManagerOptions: FileManagerPluginOptions<any> = {
  root: 'uploads/',
  operations: {
    async list({ parentId, sort, signal }) {
      void sort
      const data = (await listFiles(parentId ?? 'uploads/', signal)).map((asset) => canonicalAsset(asset, parentId))
      return { data, meta: { total: data.length, totalPage: 1 } }
    },
    async upload(file, { parentId, onProgress, signal }) {
      const response = await uploadFile(file, { signal, onProgress })
      return canonicalAsset({ id: response.key, name: response.file.name, size: response.file.size, mimeType: response.file.type, url: response.url }, parentId)
    },
    async remove({ id, signal }) {
      await deleteFile(id, signal)
    },
  },
  values: {
    async fromModel(value) {
      if (!value) return undefined
      return canonicalAsset(value)
    },
    async toModel(asset) {
      if (asset.kind !== 'file') throw new Error('Folders cannot be persisted as input asset values.')
      return {
        kind: 'file' as const,
        path: asset.id,
        url: asset.previewUrl ?? fileUrl(asset.id),
        name: asset.name,
        size: asset.size,
        mimeType: asset.mimeType,
        updatedAt: asset.updatedAt,
      }
    },
  },
}
