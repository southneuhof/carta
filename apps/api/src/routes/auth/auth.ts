import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { defineDomainPart } from '@southneuhof/sprindle/model'
import { getDb } from '../../db'
import { users } from '../users/users.entity'
import { accounts, sessions, verifications } from './auth.entity'
import { createAuthRoutes } from './auth.routes'

const schema = { users, sessions, accounts, verifications }

function requiredEnv(name: 'BETTER_AUTH_SECRET' | 'BETTER_AUTH_URL' | 'APP_ORIGIN') {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required.`)
  return value
}

export function createAuth({ allowSignUp = false }: { allowSignUp?: boolean } = {}) {
  return betterAuth({
    secret: requiredEnv('BETTER_AUTH_SECRET'),
    baseURL: requiredEnv('BETTER_AUTH_URL'),
    trustedOrigins: [requiredEnv('APP_ORIGIN')],
    database: drizzleAdapter(getDb(), { provider: 'pg', schema, usePlural: true }),
    emailAndPassword: { enabled: true, disableSignUp: !allowSignUp },
  })
}

export const domain = defineDomainPart({
  tables: { sessions, accounts, verifications },
  entities: [],
})

let auth: ReturnType<typeof createAuth> | undefined
export function getAuth() {
  return (auth ??= createAuth())
}

export const authRoutes = createAuthRoutes(getAuth)

export default { domain, authRoutes }
