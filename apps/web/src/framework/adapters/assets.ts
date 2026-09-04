import type { UploadOperation } from '@southneuhof/loom'
import { toInputAssetValue, type InputAssetValue } from '@southneuhof/loom/components/inputs/assetValue'
import { storedAssetSchema, type StoredAsset } from '@southneuhof/api/schema'
import { uploadFile } from './storage'

export interface AssetPreview {
  imageURL: string
  thumbnailURL: string
}

function readOne(value: unknown): InputAssetValue | null {
  const parsed = storedAssetSchema.safeParse(value)
  return parsed.success ? toInputAssetValue(parsed.data) : null
}

function readValue(value: unknown): InputAssetValue | InputAssetValue[] | null {
  if (Array.isArray(value)) {
    const assets = value.map(readOne)
    return assets.every((asset): asset is InputAssetValue => Boolean(asset)) ? assets : null
  }
  return readOne(value)
}

function preview(value: unknown): AssetPreview {
  const resolved = readValue(value)
  const item = Array.isArray(resolved) ? resolved[0] : resolved
  const url = item?.url ?? ''
  return { imageURL: url, thumbnailURL: url }
}

export const assetAdapter = {
  read: readValue,
  preview,
  upload: (async (blob, { signal, onProgress }) => {
    if (!(blob instanceof File)) throw new Error('Input upload requires a File.')
    const asset: StoredAsset = await uploadFile(blob, { signal, onProgress })
    const value = readOne(asset)
    if (!value) throw new Error('Upload response is not a valid stored asset.')
    return value
  }) as UploadOperation<InputAssetValue>,
}
