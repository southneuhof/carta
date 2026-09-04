import { z } from 'zod/v4'

export const optionalText = (max = 255) => z.preprocess(
  (value) => typeof value === 'string' ? value.trim() || null : value,
  z.string().max(max).nullable().optional(),
)

// Public intake uploads use a link-scoped temporary directory below the
// canonical uploads prefix.  The file routes still require authentication;
// public routes only accept keys issued for the current link.
export const uploadKey = z.string().trim().regex(/^uploads\/[a-z0-9-]+(?:\.[a-z0-9]{1,16})?$/, 'File must use an uploaded file.')

export const storedAssetSchema = z.object({
  kind: z.literal('file'),
  id: uploadKey,
  url: z.string().url(),
  name: z.string().min(1),
  mimeType: z.string().optional(),
  size: z.number().nonnegative().optional(),
  updatedAt: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).strict()

export type StoredAsset = z.output<typeof storedAssetSchema>
export const storedAssetInput = storedAssetSchema.transform(({ id }) => id)

export const selectionValues = <TItem extends z.ZodObject>(itemSchema: TItem) => {
  const markedItem = itemSchema.meta({ contract: 'selection' })
  return z.array(markedItem).meta({ contract: 'selection' })
}

export const selectionQuery = <TItem extends z.ZodObject>(itemSchema: TItem) =>
  z.preprocess(
    (value) => {
      if (typeof value !== 'string') return value
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    },
    selectionValues(itemSchema),
  )
