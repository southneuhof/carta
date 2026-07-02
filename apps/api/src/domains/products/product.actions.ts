import { defineAction } from '@southneuhof/sprindle/actions'

export const customProductAction = defineAction({
  method: 'post',
  handler: (args) => args.c.json({ ok: true, action: args.context.name }),
})

export const version1 = defineAction({
  method: 'get',
  handler: (args) => args.c.json({ version: 1 }),
})

export const versionTest = defineAction({
  method: 'get',
  handler: (args) => args.c.json({ ok: true, version: 'test' }),
})
