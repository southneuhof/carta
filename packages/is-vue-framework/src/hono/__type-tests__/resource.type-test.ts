import type { HonoResourceOperations } from '../resource'

type EmptyRoute = { list: { $get: unknown } }
type Operations = HonoResourceOperations<EmptyRoute>
void (undefined as unknown as Operations)
