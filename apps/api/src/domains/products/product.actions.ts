import { defineAction } from '@southneuhof/sprindle/actions'
import { getDb } from '../../db'
import { products } from './product.entity'

export const customProductAction = defineAction({
  method: 'post',
  handler: (args) => args.c.json({ ok: true, action: args.context.name }),
})

export const customProductMaterialize = defineAction({
  method: 'get',
  handler: async ({ c, context }) => {
    const rows = await getDb().select().from(products)
    return c.json({ data: await context.entity.source.materialize(rows, { context }) })
  },
})

export const version1 = defineAction({
  method: 'get',
  handler: (args) => args.c.json({ version: 1 }),
})

export const versionTest = defineAction({
  method: 'get',
  handler: (args) => args.c.json({ ok: true, version: 'test' }),
})
