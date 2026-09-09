import type { TypedResponse } from 'hono'
import { z } from 'zod/v4'

type AuthHandler = { handler(request: Request): Promise<Response> }
type SignInOutput = {
  redirect: boolean
  token: string
  user: { id: string; name: string; email: string; emailVerified: boolean; image?: string | null; createdAt: Date; updatedAt: Date }
}
const signInInput = z.object({ email: z.string(), password: z.string() })

function handler(getAuth: () => AuthHandler) {
  return async ({ c }: { c: { req: { raw: Request } } }) => getAuth().handler(c.req.raw)
}

function signInHandler(getAuth: () => AuthHandler) {
  return async (args: { c: { req: { raw: Request } } }): Promise<TypedResponse<SignInOutput, 200, 'json'>> => handler(getAuth)(args) as never
}

export function createAuthRoutes(getAuth: () => AuthHandler) {
  return {
    signInEmail: { openapi: { requestBody: signInInput }, action: signInHandler(getAuth) },
    getSession: { action: handler(getAuth) },
    signOut: { action: handler(getAuth) },
  }
}
