import { defineRoute } from '@southneuhof/sprindle'
import { z } from 'zod/v4'
import { createPresignedDownload, deleteObject } from '../../../../storage/s3'
import { readJsonBody } from '../../../../request-body'
import { uploadKey } from '../../../../schema'

const deleteObjectSchema = z.object({ key: uploadKey })

export const GET = defineRoute({
  action: async ({ c }) => {
    const key = uploadKey.parse(c.req.query('key'))
    const signed = await createPresignedDownload(key)
    return c.redirect(signed.url)
  },
})

export const DELETE = defineRoute({
  openapi: { requestBody: deleteObjectSchema },
  action: async ({ c }) => {
    const input = deleteObjectSchema.parse(await readJsonBody(c))
    await deleteObject(input.key)
    return c.json({ ok: true })
  },
})
