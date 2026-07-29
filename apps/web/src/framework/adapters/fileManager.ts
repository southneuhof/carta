import type { FileManagerPluginOptions, ManagedAsset } from '@southneuhof/is-vue-framework/file-manager'
import services from '@/utils/services'

function canonicalAsset(input: any, parentId: string | null = null): ManagedAsset {
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
    previewUrl: source.previewUrl ?? source.url,
    metadata: { source },
  }
}

function rows(response: any): any[] {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.files)) return response.files
  if (response?.data && typeof response.data === 'object') return Object.values(response.data)
  return []
}

export const fileManagerOptions: FileManagerPluginOptions<any> = {
  root: '/storage/public',
  operations: {
    async list({ parentId, sort, signal }) {
      const response = await services.get('files', { dir: parentId, sort_by: sort?.field, sort: sort?.direction }, { init: { signal } })
      const data = rows(response).map((asset) => canonicalAsset(asset, parentId))
      return { data, meta: { total: Number(response?.total ?? data.length), totalPage: Number(response?.totalPage ?? 1) } }
    },
    async upload(file, { parentId, onProgress, signal }) {
      const response = await services.fileUpload(file, parentId ?? '', (progress) => onProgress?.(progress), { init: { signal } })
      return canonicalAsset(response, parentId)
    },
    async createFolder({ parentId, name, signal }) {
      const response = await services.get('sync-file', { dir: parentId, folder_name: name }, { init: { signal } })
      return canonicalAsset(response, parentId)
    },
    async remove({ id, signal }) {
      await services.post('delete-file', { path: id }, { init: { signal } })
    },
  },
  values: {
    async fromModel(value) {
      if (!value) return undefined
      return canonicalAsset(value)
    },
    async toModel(asset) {
      const source = asset.metadata?.source as any
      return source ?? { path: asset.id, url: asset.previewUrl, filename: asset.name, content_type: asset.mimeType, size: asset.size }
    },
  },
}
