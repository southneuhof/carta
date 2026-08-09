#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const targetRoot = process.argv[2] ? resolve(process.argv[2]) : null

if (!targetRoot) {
  console.error('Usage: node scripts/instantiate-carta-app.mjs <empty-directory>')
  process.exit(1)
}

if (targetRoot === repoRoot || targetRoot.startsWith(`${repoRoot}/`)) {
  throw new Error('Target must be outside the Carta source repository.')
}

mkdirSync(targetRoot, { recursive: true })
if (readdirSync(targetRoot).length) throw new Error(`Target is not empty: ${targetRoot}`)

function write(relativePath, contents) {
  const destination = join(targetRoot, relativePath)
  mkdirSync(dirname(destination), { recursive: true })
  writeFileSync(destination, contents.trimStart() + '\n')
}

function writeJson(relativePath, value) {
  write(relativePath, JSON.stringify(value, null, 2))
}

function copyTrackedTree(relativePath) {
  const files = execFileSync('git', ['ls-files', '--', relativePath], { cwd: repoRoot, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)

  for (const sourceRelativePath of files) {
    if (sourceRelativePath.includes('/node_modules/') || sourceRelativePath.includes('/.turbo/')) continue
    if (sourceRelativePath.includes('/.vitest-attachments/') || sourceRelativePath.endsWith('.DS_Store')) continue
    if (sourceRelativePath.includes('/__tests__/') || sourceRelativePath.includes('/__type-tests__/')) continue
    if (sourceRelativePath.endsWith('.tsbuildinfo')) continue

    const source = join(repoRoot, sourceRelativePath)
    if (!existsSync(source)) continue
    const destination = join(targetRoot, sourceRelativePath)
    mkdirSync(dirname(destination), { recursive: true })
    copyFileSync(source, destination)
  }
}

write('.gitignore', `
node_modules
.pnpm-store
.turbo
dist
coverage
*.log
*.tsbuildinfo
*.local
.env
.DS_Store
`)
write('.npmrc', readFileSync(join(repoRoot, '.npmrc'), 'utf8'))
write('pnpm-workspace.yaml', 'packages:\n  - apps/*\n  - packages/*')
write('turbo.json', `
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": { "cache": false, "persistent": true },
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "type-check": { "dependsOn": ["^type-check"], "outputs": [] },
    "test": { "dependsOn": ["^build"], "outputs": [] }
  }
}
`)
write('tsconfig.base.json', `
{
  "compilerOptions": {
    "target": "es2022",
    "baseUrl": ".",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "lib": ["dom", "es2022"],
    "verbatimModuleSyntax": true,
    "strict": false,
    "noImplicitAny": false,
    "skipLibCheck": true,
    "paths": {
      "@southneuhof/api": ["apps/api/src/index.ts"],
      "@southneuhof/api/*": ["apps/api/src/*"],
      "@southneuhof/sdk": ["packages/sdk/src/index.ts"],
      "@southneuhof/sdk/*": ["packages/sdk/src/*"],
      "@southneuhof/sprindle": ["packages/sprindle/src/index.ts"],
      "@southneuhof/sprindle/*": ["packages/sprindle/src/*"]
    }
  }
}
`)
write('README.md', `
# Carta App

Blank Carta application template with a Hono + Better Auth backend and a Vue frontend.

## Setup

\`\`\`sh
pnpm install
cp apps/api/.env.example apps/api/.env
pnpm --filter @southneuhof/api db:push
pnpm dev
\`\`\`

The API runs on port 3000 and the frontend on port 5173. Add application routes under
\`apps/api/src/routes\` and frontend screens under \`apps/web/src/views\`.
\`apps/api/src/routes/index.ts\` is the only place that installs backend routes.
\`apps/api/src/db.ts\` is the only place that binds the domain schema.
\`apps/web/src/router/index.ts\` is the frontend route registry.
\`apps/web/src/views/DashboardView.vue\` is intentionally empty-state content.
\`apps/web/src/views/LoginView.vue\` is a working Better Auth login surface.
\`pnpm --filter @southneuhof/api db:seed\` creates \`admin@example.com\` with password \`demo-password\`.
\`pnpm --filter @southneuhof/api db:generate\` creates a migration after schema changes.
\`pnpm --filter @southneuhof/api db:migrate\` applies committed migrations.
\`pnpm build\` and \`pnpm type-check\` validate the workspace.
` )

writeJson('package.json', {
  name: 'carta',
  private: true,
  version: '0.0.0',
  packageManager: 'pnpm@10.8.0',
  engines: { node: '^20.19.0 || >=22.12.0' },
  scripts: {
    dev: 'turbo run dev --filter=@southneuhof/api --filter=@southneuhof/framework-web',
    'dev:api': 'pnpm --filter @southneuhof/api dev',
    'dev:web': 'pnpm --filter @southneuhof/framework-web dev',
    build: 'turbo run build --filter=@southneuhof/api --filter=@southneuhof/framework-web',
    test: 'turbo run test --filter=@southneuhof/api --filter=@southneuhof/framework-web',
    'type-check': 'turbo run type-check --filter=@southneuhof/api --filter=@southneuhof/framework-web',
  },
  devDependencies: { turbo: '^2.0.14', typescript: '^5.9.3' },
})

for (const packagePath of ['packages/sprindle', 'packages/is-vue-framework', 'packages/utilities', 'packages/sdk']) {
  copyTrackedTree(packagePath)
}

write('packages/sdk/tsconfig.json', `
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "composite": true, "rootDir": "../..", "strict": true },
  "include": ["src/**/*.ts", "../../apps/api/src/**/*", "../sprindle/src/**/*"],
  "exclude": ["src/**/__tests__/**", "src/**/*.spec.ts"]
}
`)

write('packages/is-vue-framework/env.d.ts', `
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly GOOGLE_MAP_API_KEY?: string
  readonly VITE_GOOGLE_MAP_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'html2pdf.js' {
  const html2pdf: any
  export default html2pdf
}
`)

writeJson('apps/api/package.json', {
  name: '@southneuhof/api',
  private: true,
  version: '0.0.0',
  type: 'module',
  scripts: {
    dev: 'tsx scripts/dev.ts',
    build: 'tsc -p tsconfig.json --noEmit',
    'type-check': 'tsc -p tsconfig.json --noEmit',
    'db:push': 'drizzle-kit push',
    'db:generate': 'drizzle-kit generate',
    'db:migrate': 'drizzle-kit migrate',
    'db:reset': 'tsx --env-file-if-exists=.env scripts/reset-db.ts',
    'db:seed': 'tsx --env-file-if-exists=.env scripts/seed.ts',
  },
  exports: { '.': './src/index.ts', './app': './src/app.ts', './rpc': './src/rpc.ts' },
  dependencies: {
    '@better-auth/drizzle-adapter': '^1.6.23',
    '@hono/node-server': '^2.0.6',
    '@southneuhof/sprindle': 'workspace:*',
    'better-auth': '^1.6.23',
    'drizzle-orm': '1.0.0-rc.4',
    hono: '^4.12.27',
    pg: '^8.22.0',
    zod: '^3.25.0',
  },
  devDependencies: {
    '@types/pg': '^8.20.0',
    'drizzle-kit': '1.0.0-rc.4',
    tsx: '^4.22.4',
    typescript: '^5.9.3',
  },
})

write('apps/api/.env.example', `
API_PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/carta
BETTER_AUTH_SECRET=replace-with-at-least-32-random-characters
BETTER_AUTH_URL=http://localhost:3000
APP_ORIGIN=http://localhost:5173
`)
write('apps/api/README.md', `
# Carta API

Hono + Better Auth backend. Add entities and models under ` + '`src/routes`' + ` and register them in ` + '`src/routes/index.ts`' + `.
`)
write('apps/api/tsconfig.json', `
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "strict": true, "module": "esnext", "moduleSuffixes": [".server", ""] },
  "include": ["src/**/*", "scripts/**/*", "drizzle.config.ts"]
}
`)
write('apps/api/drizzle.config.ts', `
import { defineConfig } from 'drizzle-kit'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for Drizzle commands.')

export default defineConfig({
  schema: './src/routes/**/*.entity.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL },
})
`)
write('apps/api/src/index.ts', `
export { app } from './app'
export type { AppType } from './app'
`)
write('apps/api/src/rpc.ts', `
export type { AppType } from './app'
`)
write('apps/api/src/server.ts', `
import { serve } from '@hono/node-server'
import { app } from './app'

const port = Number(process.env.API_PORT)
if (!port) {
  console.error('API_PORT is not set')
  process.exit(1)
}

serve({ fetch: app.fetch, port })
console.log('Listening on port ' + port)
`)
write('apps/api/scripts/dev.ts', `
import { spawn } from 'node:child_process'

const child = spawn('tsx', ['watch', '--env-file-if-exists=.env', 'src/server.ts'], { stdio: 'inherit' })
child.on('exit', (code) => process.exit(code ?? 0))
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => child.kill(signal))
`)
write('apps/api/scripts/reset-db.ts', `
import { sql } from 'drizzle-orm'
import { closeDb, getDb } from '../src/db'

async function main() {
  await getDb().execute(sql.raw('drop schema if exists public cascade; create schema public;'))
  await closeDb()
}

main().catch(async (error) => {
  await closeDb()
  throw error
})
`)
write('apps/api/scripts/seed.ts', `
import { closeDb } from '../src/db'
import { createAuth } from '../src/routes/auth/auth'

async function main() {
  const auth = createAuth({ allowSignUp: true })
  const existing = await auth.api.getSession({ headers: new Headers() })
  if (existing) console.log('A session already exists; seed is idempotent.')
  await auth.api.signUpEmail({
    body: { name: 'Carta Administrator', email: 'admin@example.com', password: 'demo-password' },
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    if (!message.toLowerCase().includes('already')) throw error
  })
  console.log('Seeded admin@example.com / demo-password')
  await closeDb()
}

main().catch(async (error) => {
  await closeDb()
  throw error
})
`)
write('apps/api/src/app.ts', `
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { consoleLogger, installSprindle, requestContext, sprindleNotFound, sprindleOnError } from '@southneuhof/sprindle/hono'
import { getDb } from './db'
import { routes } from './routes'
import { getAuth } from './routes/auth/auth'

const appOrigin = process.env.APP_ORIGIN
if (!appOrigin) throw new Error('APP_ORIGIN is required.')

export const app = installSprindle(
  new Hono()
    .onError(sprindleOnError)
    .notFound(sprindleNotFound)
    .use('*', requestContext())
    .use('*', cors({
      origin: appOrigin,
      allowHeaders: ['Content-Type', 'Authorization'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      exposeHeaders: ['Set-Cookie'],
      credentials: true,
    }))
    .use('*', async (_c, next) => {
      getDb()
      await next()
    }),
  routes,
  { identity: (c) => getAuth().api.getSession({ headers: c.req.raw.headers }), logger: consoleLogger },
)

export type AppType = typeof app
`)
write('apps/api/src/db.ts', `
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { bindDomainDatabase, defineDomainSchema } from '@southneuhof/sprindle/model'
import { domainParts } from './routes'

let pool: Pool | undefined
let db: ReturnType<typeof drizzle> | undefined
let domainSchema: ReturnType<typeof defineDomainSchema> | undefined

function getDomainSchema() {
  return (domainSchema ??= defineDomainSchema(domainParts))
}

export function getDb() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required.')
  const schema = getDomainSchema()
  pool ??= new Pool({ connectionString })
  db ??= drizzle({ client: pool, relations: schema.relations as never })
  bindDomainDatabase(schema, db)
  return db
}

export async function closeDb() {
  await pool?.end()
  pool = undefined
  db = undefined
}
`)
write('apps/api/src/routes/index.ts', `
import { openapiRoute } from '@southneuhof/sprindle/openapi'
import { authRoutes, domain as authDomain } from './auth/auth'
import { healthRoute } from './health/health'
import { domain as usersDomain } from './users/users'

export const domainParts = [usersDomain, authDomain] as const
const installedRoutes = [healthRoute, authRoutes.signInEmail, authRoutes.getSession, authRoutes.signOut] as const

export const routes = [...installedRoutes, openapiRoute(installedRoutes, { title: 'Carta API', version: '0.0.0' })] as const
`)
write('apps/api/src/routes/health/health.ts', `
import { defineRoute } from '@southneuhof/sprindle/routes'

export const healthRoute = defineRoute({ path: '/health', method: 'get', action: async () => ({ ok: true }) })
`)
write('apps/api/src/routes/users/users.entity.ts', `
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
})
`)
write('apps/api/src/routes/users/users.ts', `
import { defineDomainPart } from '@southneuhof/sprindle/model'
import { users } from './users.entity'

export const domain = defineDomainPart({ tables: { users }, entities: [] })
`)
write('apps/api/src/routes/auth/auth.entity.ts', `
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from '../users/users.entity'

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
})

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
`)
write('apps/api/src/routes/auth/auth.routes.ts', `
import { defineRoute } from '@southneuhof/sprindle/routes'
import type { ModelRuntimeContext } from '@southneuhof/sprindle/model'

type AuthHandler = { handler(request: Request): Promise<Response> }
type SignInOutput = { redirect: boolean; token: string; user: { id: string; name: string; email: string } }

function handler(getAuth: () => AuthHandler) {
  return async ({ c }: { c: { req: { raw: Request } } }) => getAuth().handler(c.req.raw)
}

export function createAuthRoutes(getAuth: () => AuthHandler) {
  return {
    signInEmail: defineRoute<SignInOutput, ModelRuntimeContext, 'post', '/api/auth/sign-in/email', { json: { email: string; password: string } }>({
      path: '/api/auth/sign-in/email', method: 'post', action: handler(getAuth) as never,
    }),
    getSession: defineRoute({ path: '/api/auth/get-session', method: 'get', action: handler(getAuth) }),
    signOut: defineRoute({ path: '/api/auth/sign-out', method: 'post', action: handler(getAuth) }),
  }
}
`)
write('apps/api/src/routes/auth/auth.ts', `
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
  if (!value) throw new Error(name + ' is required.')
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

export const domain = defineDomainPart({ tables: { sessions, accounts, verifications }, entities: [] })
let auth: ReturnType<typeof createAuth> | undefined
export function getAuth() { return (auth ??= createAuth()) }
export const authRoutes = createAuthRoutes(getAuth)
`)

writeJson('apps/web/package.json', {
  name: '@southneuhof/framework-web',
  version: '0.0.0',
  private: true,
  scripts: {
    dev: 'vite',
    build: 'vite build',
    preview: 'vite preview --port 3100',
    'type-check': 'vue-tsc --noEmit -p tsconfig.app.json',
  },
  dependencies: {
    '@southneuhof/api': 'workspace:*',
    '@southneuhof/is-vue-framework': 'workspace:*',
    '@southneuhof/sdk': 'workspace:*',
    '@southneuhof/utilities': 'workspace:*',
    pinia: '^3.0.4',
    vue: '^3.5.39',
    'vue-router': '^5.1.0',
  },
  devDependencies: {
    '@vitejs/plugin-vue': '^6.0.7',
    typescript: '^5.9.3',
    vite: '^8.1.4',
    'vue-tsc': '^3.3.7',
  },
})
write('apps/web/.env.example', 'VITE_API_URL=http://localhost:3000')
write('apps/web/index.html', `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Carta</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`)
write('apps/web/tsconfig.app.json', `
{
  "extends": "../../tsconfig.base.json",
  "include": ["env.d.ts", "src/**/*", "../../apps/api/src/**/*", "../../packages/is-vue-framework/env.d.ts", "../../packages/is-vue-framework/src/**/*", "../../packages/utilities/src/**/*", "../../packages/sdk/src/**/*"],
  "exclude": ["src/**/*.spec.ts", "../../packages/*/src/**/__tests__/*"],
  "compilerOptions": {
    "composite": false,
    "baseUrl": ".",
    "strict": true,
    "module": "esnext",
    "target": "es2017",
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./src/*"],
      "@southneuhof/api": ["../api/src/index.ts"],
      "@southneuhof/api/*": ["../api/src/*"],
      "@southneuhof/sdk": ["../../packages/sdk/src/index.ts"],
      "@southneuhof/sdk/*": ["../../packages/sdk/src/*"],
      "@southneuhof/is-vue-framework": ["../../packages/is-vue-framework/src/index.ts"],
      "@southneuhof/is-vue-framework/*": ["../../packages/is-vue-framework/src/*"],
      "@southneuhof/utilities": ["../../packages/utilities/src/index.ts"],
      "@southneuhof/utilities/*": ["../../packages/utilities/src/*"]
    }
  },
  "vueCompilerOptions": {
    "strictTemplates": true,
    "checkUnknownProps": false,
    "checkUnknownEvents": false,
    "checkUnknownComponents": false
  }
}
`)
write('apps/web/tsconfig.json', '{"files": [], "references": [{"path": "./tsconfig.app.json"}]}')
write('apps/web/env.d.ts', `
/// <reference types="vite/client" />
interface ImportMetaEnv { readonly VITE_API_URL?: string }
interface ImportMeta { readonly env: ImportMetaEnv }
`)
write('apps/web/vite.config.ts', `
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@southneuhof/api': fileURLToPath(new URL('../api/src', import.meta.url)),
      '@southneuhof/sdk': fileURLToPath(new URL('../../packages/sdk/src', import.meta.url)),
      '@southneuhof/is-vue-framework': fileURLToPath(new URL('../../packages/is-vue-framework/src', import.meta.url)),
      '@southneuhof/utilities': fileURLToPath(new URL('../../packages/utilities/src', import.meta.url)),
    },
  },
})
`)
write('apps/web/src/main.ts', `
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { FrameworkPlugin } from '@southneuhof/is-vue-framework'
import App from './App.vue'
import router from './router'
import './style.css'

createApp(App).use(createPinia()).use(FrameworkPlugin).use(router).mount('#app')
`)
write('apps/web/src/App.vue', `
<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template><RouterView /></template>
`)
write('apps/web/src/rpc.ts', `
import { createRpcClient } from '@southneuhof/sdk'

const raw = import.meta.env.VITE_API_URL ?? ''
export const rpc = createRpcClient(raw.endsWith('/') ? raw.slice(0, -1) : raw)
`)
write('apps/web/src/router/index.ts', `
import { createRouter, createWebHistory } from 'vue-router'
import AuthenticatedLayout from '@/views/AuthenticatedLayout.vue'
import DashboardView from '@/views/DashboardView.vue'
import LoginView from '@/views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    {
      path: '/', component: AuthenticatedLayout, meta: { requiresAuth: true },
      children: [{ path: '', name: 'dashboard', component: DashboardView }],
    },
  ],
})

router.beforeEach((to) => {
  const authenticated = Boolean(localStorage.getItem('carta-profile'))
  if (to.meta.requiresAuth && !authenticated) return { name: 'login' }
  if (authenticated && to.name === 'login') return { name: 'dashboard' }
  return true
})

export default router
`)
write('apps/web/src/views/LoginView.vue', `
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { rpc } from '@/rpc'

const router = useRouter()
const email = ref('admin@example.com')
const password = ref('demo-password')
const error = ref('')
const loading = ref(false)

async function login() {
  loading.value = true
  error.value = ''
  try {
    const response = await rpc.api.auth['sign-in'].email.$post({ json: { email: email.value, password: password.value } })
    if (!response.ok) throw new Error('Invalid email or password.')
    const body = await response.json()
    localStorage.setItem('carta-profile', JSON.stringify(body.user))
    await router.push({ name: 'dashboard' })
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Unable to sign in.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <form class="card auth-card" @submit.prevent="login">
      <p class="eyebrow">Carta</p>
      <h1>Sign in</h1>
      <label>Email <input v-model="email" type="email" autocomplete="email" required /></label>
      <label>Password <input v-model="password" type="password" autocomplete="current-password" required /></label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button :disabled="loading" type="submit">{{ loading ? 'Signing in…' : 'Sign in' }}</button>
    </form>
  </main>
</template>
`)
write('apps/web/src/views/AuthenticatedLayout.vue', `
<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { rpc } from '@/rpc'

const router = useRouter()

async function signOut() {
  await rpc.api.auth['sign-out'].$post().catch(() => undefined)
  localStorage.removeItem('carta-profile')
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <RouterLink class="brand" to="/">Carta</RouterLink>
      <nav><RouterLink to="/">Dashboard</RouterLink><button type="button" @click="signOut">Sign out</button></nav>
    </header>
    <main class="content"><RouterView /></main>
  </div>
</template>
`)
write('apps/web/src/views/DashboardView.vue', `
<template>
  <section class="empty-state">
    <p class="eyebrow">Carta app</p>
    <h1>Ready for your first resource</h1>
    <p>Add a backend domain part and a frontend view to start building.</p>
  </section>
</template>
`)
write('apps/web/src/style.css', `
:root { font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: #1f2937; background: #f8fafc; }
* { box-sizing: border-box; }
body { margin: 0; min-width: 320px; }
button, input { font: inherit; }
button { cursor: pointer; }
.auth-page { min-height: 100vh; display: grid; place-items: center; padding: 1.5rem; }
.card { background: white; border: 1px solid #e5e7eb; border-radius: 1rem; box-shadow: 0 12px 32px #0f172a12; }
.auth-card { display: grid; gap: 1rem; width: min(100%, 28rem); padding: 2rem; }
.auth-card h1, .empty-state h1 { margin: 0; font-size: 1.75rem; }
label { display: grid; gap: .4rem; font-weight: 600; }
input { width: 100%; border: 1px solid #cbd5e1; border-radius: .5rem; padding: .7rem .8rem; }
button { border: 0; border-radius: .5rem; padding: .7rem 1rem; background: #2563eb; color: white; }
button:disabled { cursor: wait; opacity: .6; }
.eyebrow { margin: 0; color: #2563eb; font-size: .75rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.error { margin: 0; color: #b91c1c; }
.app-shell { min-height: 100vh; }
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.5rem; background: white; border-bottom: 1px solid #e5e7eb; }
.topbar nav { display: flex; align-items: center; gap: 1rem; }
a { color: inherit; text-decoration: none; }
.brand { font-weight: 800; }
.topbar a.router-link-active { color: #2563eb; }
.topbar button { padding: .45rem .75rem; }
.content { width: min(100%, 72rem); margin: 0 auto; padding: 2rem 1.5rem; }
.empty-state { display: grid; gap: .75rem; padding: 4rem 0; }
.empty-state p:last-child { margin: 0; color: #64748b; }
`)

copyFileSync(join(repoRoot, 'pnpm-lock.yaml'), join(targetRoot, 'pnpm-lock.yaml'))
const install = spawnSync('pnpm', ['install', '--lockfile-only', '--ignore-scripts'], { cwd: targetRoot, stdio: 'inherit' })
if (install.status !== 0) process.exit(install.status ?? 1)

console.log(`Created blank Carta app at ${isAbsolute(targetRoot) ? targetRoot : resolve(targetRoot)}`)
