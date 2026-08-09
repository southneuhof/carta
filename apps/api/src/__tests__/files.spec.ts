import { sql } from 'drizzle-orm'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { hashPassword } from 'better-auth/crypto'
import { closeDb, getDb } from '../db'
import { app as rawApp } from '../app'
import { getAuth } from '../routes/auth/auth'
import { accounts } from '../routes/auth/auth.entity'
import { users } from '../routes/users/users.entity'
import { createPresignedUpload } from '../storage/s3'

vi.mock('../storage/s3', () => ({ createPresignedUpload: vi.fn() }))
const signer = vi.mocked(createPresignedUpload)

let sessionCookie = ''

function request(body: unknown, cookie = sessionCookie) {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (cookie) headers.set('Cookie', cookie)
  return rawApp.request('/files/presigned-url', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

async function resetSchema() {
  await getDb().execute(sql.raw(`
    drop table if exists sessions cascade;
    drop table if exists accounts cascade;
    drop table if exists verifications cascade;
    drop table if exists users cascade;

    create table users (
      id text primary key,
      name text not null,
      email text not null unique,
      email_verified boolean not null default false,
      image text,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    );
    create table sessions (
      id text primary key,
      expires_at timestamp not null,
      token text not null unique,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now(),
      ip_address text,
      user_agent text,
      user_id text not null references users(id) on delete cascade
    );
    create table accounts (
      id text primary key,
      account_id text not null,
      provider_id text not null,
      user_id text not null references users(id) on delete cascade,
      access_token text,
      refresh_token text,
      id_token text,
      access_token_expires_at timestamp,
      refresh_token_expires_at timestamp,
      scope text,
      password text,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    );
    create table verifications (
      id text primary key,
      identifier text not null,
      value text not null,
      expires_at timestamp not null,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    );
  `))
}

describe('file upload presign route', () => {
  beforeEach(async () => {
    signer.mockReset()
    signer.mockResolvedValue({ url: 'https://storage.test/upload', expiresIn: 900 })
    await resetSchema()

    await getDb().insert(users).values({ id: 'user-files', name: 'File User', email: 'files@example.com' })
    await getDb().insert(accounts).values({
      id: 'account-files',
      accountId: 'user-files',
      providerId: 'credential',
      userId: 'user-files',
      password: await hashPassword('demo-password'),
    })

    const signedIn = await getAuth().api.signInEmail({
      body: { email: 'files@example.com', password: 'demo-password' },
      returnHeaders: true,
    })
    sessionCookie = signedIn.headers.get('set-cookie')?.split(';')[0] ?? ''
  })

  afterAll(() => closeDb())

  it('requires an authenticated session', async () => {
    const response = await request({ filename: 'report.txt', contentType: 'text/plain', size: 12 }, '')

    expect(response.status).toBe(401)
    expect(signer).not.toHaveBeenCalled()
  })

  it('returns a server-generated direct upload URL', async () => {
    const response = await request({ filename: '../../secret.txt', contentType: 'text/plain', size: 12 })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toMatchObject({
      data: {
        uploadUrl: 'https://storage.test/upload',
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain' },
        expiresIn: 900,
      },
    })

    const call = signer.mock.calls[0]?.[0]
    expect(call?.key).toMatch(/^uploads\/[0-9a-f-]+\.txt$/)
    expect(call?.key).not.toContain('secret')
    expect(call?.contentType).toBe('text/plain')
    expect(body.data.key).toBe(call?.key)
  })

  it('rejects invalid upload metadata before signing', async () => {
    const invalidBodies: unknown[] = [
      '{not-json',
      {},
      { filename: 'report.txt', contentType: 'textplain', size: 12 },
      { filename: 'report.txt', contentType: 'text/plain', size: 0 },
      { filename: 'report.txt', contentType: 'text/plain', size: 25 * 1024 * 1024 + 1 },
    ]

    for (const body of invalidBodies) {
      signer.mockClear()
      const response = await request(body)
      expect(response.status).toBe(400)
      expect(signer).not.toHaveBeenCalled()
    }
  })

  it('hides signer failures behind the internal error contract', async () => {
    signer.mockRejectedValueOnce(new Error('storage secret should not leak'))
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      const response = await request({ filename: 'report.txt', contentType: 'text/plain', size: 12 })

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body).toEqual({ error: 'internal_error' })
      expect(JSON.stringify(body)).not.toContain('storage secret')
    } finally {
      log.mockRestore()
    }
  })
})
