import type { HonoRequestOf } from '@southneuhof/is-vue-framework/hono'
import { rpc } from '@/framework/rpc'

type Endpoint = (typeof rpc.users)['create']['$post']
export type CreateUserInput = HonoRequestOf<Endpoint>['json']
export async function createUser(input: CreateUserInput) {
  const response = await rpc.users.create.$post({ json: input })
  const body = await response.json()
  if (!response.ok) throw body
  return body
}
