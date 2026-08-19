import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { permitAttachment } from '@southneuhof/api/routes/permit-attachment/permit-attachment.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type PermitAttachment = z.output<typeof permitAttachment.schemas.select>
export type PermitAttachmentCreate = z.input<typeof permitAttachment.schemas.create>
export type PermitAttachmentUpdate = z.input<typeof permitAttachment.schemas.update>

export const permitAttachmentsSchema = defineSchema<AppResourceContract<typeof rpc['permit-attachment']>>({
  identity: 'id',
  record: { schema: fromZod(permitAttachment.schemas.select) },
  create: { schema: fromZod(permitAttachment.schemas.create) },
  update: { schema: fromZod(permitAttachment.schemas.update) },
})
