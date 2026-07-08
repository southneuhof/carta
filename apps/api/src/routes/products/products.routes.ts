import { defineRoute } from '@southneuhof/sprindle/routes'
import { getDb } from '../../db'
import { products } from './products.entity'

export const customProductRoute = defineRoute({
  method: 'post',
  action: (args) => args.c.json({ ok: true, route: args.context.name }),
})

export const customProductMaterialize = defineRoute({
  method: 'get',
  action: async ({ c, context }) => {
    const rows = await getDb().select().from(products)
    return c.json({ data: await context.entity.source.materialize(rows, { context }) })
  },
})

export const version1 = defineRoute({
  method: 'get',
  action: (args) => args.c.json({ version: 1 }),
})

export const versionTest = defineRoute({
  method: 'get',
  action: (args) => args.c.json({ ok: true, version: 'test' }),
})
