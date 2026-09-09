import { randomUUID } from 'node:crypto'
import { defineRoute } from '@southneuhof/sprindle'
import { z } from 'zod/v4'
import { createPresignedUpload } from '../../../../storage/s3'
import { readJsonBody } from '../../../../request-body'
import { storedAsset } from '../../../../storage/assets'

// ponytail: fixed proof limit; make configurable when product limits vary.
const MAX_UPLOAD_SIZE = 25 * 1024 * 1024

const presignedUploadSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(127).regex(/^[^/\s]+\/[^/\s]+$/),
  size: z.number().int().positive().max(MAX_UPLOAD_SIZE),
})

function objectKey(filename: string) {
  const extension = filename.match(/\.([a-zA-Z0-9]{1,16})$/)?.[1]?.toLowerCase()
  return `uploads/${randomUUID()}${extension ? `.${extension}` : ''}`
}

export const POST = defineRoute({
  openapi: { requestBody: presignedUploadSchema },
  action: async ({ c }) => {
    const input = presignedUploadSchema.parse(await readJsonBody(c))
    const key = objectKey(input.filename)
    const signed = await createPresignedUpload({ key, contentType: input.contentType })

    const asset = storedAsset(key, { size: input.size, metadata: { contentType: input.contentType } })
    return c.json({
      data: {
        uploadUrl: signed.url,
        asset,
        method: 'PUT',
        headers: { 'Content-Type': input.contentType },
        expiresIn: signed.expiresIn,
      },
    })
  },
})
