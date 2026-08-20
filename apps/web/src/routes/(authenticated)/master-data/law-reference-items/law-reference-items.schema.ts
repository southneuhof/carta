import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { lawReferenceItemCreateSchema, lawReferenceItemFlatSelectSchema, lawReferenceItemUpdateSchema } from '@southneuhof/api/routes/law-reference-items/law-reference-items.entity'
import type { z } from 'zod/v4'

const lawReferenceItemFormCreateSchema = lawReferenceItemCreateSchema.strip()
const lawReferenceItemFormUpdateSchema = lawReferenceItemUpdateSchema.strip()

export type LawReferenceItem = z.infer<typeof lawReferenceItemFlatSelectSchema>
export type LawReferenceItemCreate = z.input<typeof lawReferenceItemFormCreateSchema>
export type LawReferenceItemUpdate = z.input<typeof lawReferenceItemFormUpdateSchema>

export const lawReferenceItemsSchema = defineSchema({
  identity: 'id',
  record: { schema: fromZod(lawReferenceItemFlatSelectSchema) },
  create: { schema: fromZod(lawReferenceItemFormCreateSchema) },
  update: { schema: fromZod(lawReferenceItemFormUpdateSchema) },
})
