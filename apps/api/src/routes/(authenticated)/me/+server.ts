import { defineRoute } from '@southneuhof/sprindle'
import { orgIdentity } from '../../../identity'

export const GET = defineRoute({ action: async (args) => {
  const identity = await orgIdentity(args)
  return args.c.json({ data: { ...identity!, permissions: [...identity!.permissions] } })
} })
