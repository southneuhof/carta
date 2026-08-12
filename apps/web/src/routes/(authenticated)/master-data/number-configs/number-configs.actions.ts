import { parseHonoResponse } from '@/framework/hono'
import { rpc } from '@/framework/rpc'

export const numberConfigsActions = {
  reorder: async (id: string, direction: 'up' | 'down') => {
    const endpoint = rpc['number-configs'][':id'].reorder.$post
    return parseHonoResponse<typeof endpoint>(await endpoint({ param: { id }, json: { direction } }))
  },
}
