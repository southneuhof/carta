import { randomUUID } from 'node:crypto'
import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import { z } from 'zod/v4'
import { createPresignedUpload } from '../../storage/s3'

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

export const presignedUploadRoute = defineRoute({
  path: '/files/presigned-url',
  method: 'post',
  authorize: [authenticated()],
  action: async (args) => {
    const input = presignedUploadSchema.parse(await args.c.req.json().catch(() => ({})))
    const key = objectKey(input.filename)
    const signed = await createPresignedUpload({ key, contentType: input.contentType })

    return args.c.json({
      data: {
        key,
        uploadUrl: signed.url,
        method: 'PUT',
        headers: { 'Content-Type': input.contentType },
        expiresIn: signed.expiresIn,
      },
    })
  },
})

export default { presignedUploadRoute }
