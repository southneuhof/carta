import { defineRoute } from '@southneuhof/sprindle/routes'
import type { ModelRuntimeContext } from '@southneuhof/sprindle/model'

type AuthHandler = { handler(request: Request): Promise<Response> }
type SignInOutput = {
  redirect: boolean
  token: string
  user: { id: string; name: string; email: string; emailVerified: boolean; image?: string | null; createdAt: Date; updatedAt: Date }
}

function handler(getAuth: () => AuthHandler) {
  return async ({ c }: { c: { req: { raw: Request } } }) => getAuth().handler(c.req.raw)
}

export function createAuthRoutes(getAuth: () => AuthHandler) {
  return {
    signInEmail: defineRoute<SignInOutput, ModelRuntimeContext, 'post', '/api/auth/sign-in/email', { json: { email: string; password: string } }>({
      path: '/api/auth/sign-in/email',
      method: 'post',
      action: handler(getAuth) as never,
    }),
    getSession: defineRoute({ path: '/api/auth/get-session', method: 'get', action: handler(getAuth) }),
    signOut: defineRoute({ path: '/api/auth/sign-out', method: 'post', action: handler(getAuth) }),
  }
}
