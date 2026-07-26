import { z } from 'zod'

export const listQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('asc'),
  })
  // Every other key is an equality filter; the source validates it against the table columns.
  .catchall(z.string())

export const idParamSchema = z.object({
  id: z.string().min(1),
})
