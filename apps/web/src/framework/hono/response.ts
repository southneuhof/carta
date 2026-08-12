import type { StatusCode } from 'hono/utils/http-status'
import type { HonoResponseOf } from './contracts'

export async function parseHonoResponse<TEndpoint, TStatus extends StatusCode = 200>(response: Response): Promise<HonoResponseOf<TEndpoint, TStatus>> {
  const value: unknown = await response.json()
  if (!response.ok) throw value
  return value as HonoResponseOf<TEndpoint, TStatus>
}
