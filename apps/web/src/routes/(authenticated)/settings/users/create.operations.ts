import { parseHonoResponse } from '@southneuhof/is-vue-framework/hono'
import type { z } from 'zod/v4'
import { createUserSchema } from '@southneuhof/api/routes/users/users.create.contract'
import { user } from '@southneuhof/api/routes/users/users.entity'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'

type Endpoint = (typeof rpc.users)['create']['$post']
export type CreateUserInput = z.input<typeof createUserSchema>
export type CreatedUser = z.output<typeof user.schemas.select>

export async function createUser(input: CreateUserInput) {
  const body = await parseHonoResponse<Endpoint, 201>(await rpc.users.create.$post({ json: input }))
  const record = dataAdapter.normalizeRecord<CreatedUser>(body)
  if (!record) throw new Error('User creation returned no record.')
  return record
}
