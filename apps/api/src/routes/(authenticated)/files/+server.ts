import { defineRoute } from '@southneuhof/sprindle'
import { z } from 'zod/v4'
import { listObjects } from '../../../storage/s3'
import { storedAsset } from '../../../storage/assets'
import type { StoredAsset } from '../../../schema'

const prefixSchema = z.string().regex(/^uploads(?:\/[a-zA-Z0-9._-]+)*\/$/)

type FolderRecord = {
  id: string
  parentId: string | null
  kind: 'folder'
  name: string
}
type FileRecord = FolderRecord | StoredAsset

function fileName(key: string, prefix: string) {
  return key.slice(prefix.length).replace(/\/$/, '').split('/').pop() || key
}

export const GET = defineRoute({
  action: async ({ c }) => {
    const prefix = prefixSchema.parse(c.req.query('prefix') || 'uploads/')
    const result = await listObjects(prefix)
    const folders: FileRecord[] = (result.CommonPrefixes ?? [])
      .flatMap(({ Prefix }) => Prefix ? [{
        id: Prefix,
        parentId: prefix,
        kind: 'folder' as const,
        name: fileName(Prefix, prefix),
      }] : [])
    const files: FileRecord[] = (result.Contents ?? [])
      .flatMap((item) => item.Key && item.Key !== prefix ? [{
        ...storedAsset(item.Key, { size: item.Size, updatedAt: item.LastModified }),
      }] : [])

    const data = [...folders, ...files]
    return c.json({ data, meta: { total: data.length, totalPage: 1 } })
  },
})
