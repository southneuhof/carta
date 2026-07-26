import { sql } from 'drizzle-orm'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { hashPassword } from 'better-auth/crypto'
import type { Context } from 'hono'
import { app as rawApp } from '../app'
import { getAuth } from '../routes/auth/auth'
import { accounts } from '../routes/auth/auth.entity'
import { closeDb, getDb } from '../db'
import { employees, jobPositions, sectionTypes, tollSections } from '../routes/organization/organization.entity'
import { permissions, rolePermissions, roles, userRoles } from '../routes/roles/roles.entity'
import { users } from '../routes/users/users.entity'
import { orgIdentity, requirePermission } from '../identity'
import type { RouteHandlerArgs } from '@southneuhof/sprindle/model'

const CALLER = 'user-caller'

let sessionCookie = ''
const app = {
  request(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers)
    if (sessionCookie) headers.set('Cookie', sessionCookie)
    return rawApp.request(path, { ...init, headers })
  },
}

/**
 * `orgIdentity` takes route handler args, not a request. These helpers build the
 * smallest thing that satisfies it: a Hono-shaped context with working get/set (for
 * the per-request memoization) and an `identity()` that returns a session-like object.
 */
function argsFor(userId: string | null): RouteHandlerArgs {
  const store = new Map<string, unknown>()
  const c = {
    get: (key: string) => store.get(key),
    set: (key: string, value: unknown) => store.set(key, value),
  } as unknown as Context
  return {
    c,
    context: {} as never,
    route: { method: 'get', path: '/', kind: 'custom' },
    state: {},
    identity: async () => (userId ? { user: { id: userId } } : null),
  } as unknown as RouteHandlerArgs
}

async function resetSchema() {
  const db = getDb()
  await db.execute(sql.raw(`
    drop table if exists sessions cascade;
    drop table if exists accounts cascade;
    drop table if exists verifications cascade;
    drop table if exists product_variant_assignments cascade;
    drop table if exists product_variants cascade;
    drop table if exists products cascade;
    drop table if exists employees cascade;
    drop table if exists section_groups cascade;
    drop table if exists section_rantings cascade;
    drop table if exists toll_sections cascade;
    drop table if exists section_types cascade;
    drop table if exists job_positions cascade;
    drop table if exists user_roles cascade;
    drop table if exists users cascade;
    drop table if exists role_permissions cascade;
    drop table if exists permissions cascade;
    drop table if exists roles cascade;

    create table roles (
      id text primary key, name text not null, scope text not null default 'section',
      active boolean not null default true,
      created_at timestamp not null default now(), updated_at timestamp not null default now()
    );
    create table permissions (
      id text primary key, code text not null unique, name text not null, active boolean not null default true
    );
    create table role_permissions (
      role_id text not null references roles(id) on delete cascade,
      permission_id text not null references permissions(id) on delete cascade,
      active boolean not null default true,
      primary key (role_id, permission_id)
    );
    create table users (
      id text primary key, name text not null, email text not null unique,
      email_verified boolean not null default false, image text,
      created_at timestamp not null default now(), updated_at timestamp not null default now()
    );
    create table user_roles (
      user_id text not null references users(id) on delete cascade,
      role_id text not null references roles(id) on delete cascade,
      active boolean not null default true,
      primary key (user_id, role_id)
    );
    create table sessions (
      id text primary key, expires_at timestamp not null, token text not null unique,
      created_at timestamp not null default now(), updated_at timestamp not null default now(),
      ip_address text, user_agent text, user_id text not null references users(id) on delete cascade
    );
    create table accounts (
      id text primary key, account_id text not null, provider_id text not null,
      user_id text not null references users(id) on delete cascade, access_token text,
      refresh_token text, id_token text, access_token_expires_at timestamp,
      refresh_token_expires_at timestamp, scope text, password text,
      created_at timestamp not null default now(), updated_at timestamp not null default now()
    );
    create table verifications (
      id text primary key, identifier text not null, value text not null, expires_at timestamp not null,
      created_at timestamp not null default now(), updated_at timestamp not null default now()
    );
    create table section_types (id text primary key, code text not null unique, name text not null);
    create table toll_sections (
      id text primary key, code text not null unique, name text not null,
      section_type_id text references section_types(id)
    );
    create table job_positions (id text primary key, code text not null unique, name text not null);
    create table section_groups (
      id text primary key, name text not null, section_id text references toll_sections(id), koreg_employee_id text
    );
    create table section_rantings (
      id text primary key, name text not null, section_id text references toll_sections(id), head_employee_id text
    );
    create table employees (
      id text primary key, full_name text not null, user_id text unique references users(id),
      section_id text references toll_sections(id), job_position_id text references job_positions(id),
      section_group_id text references section_groups(id), section_ranting_id text references section_rantings(id),
      active boolean not null default true,
      created_at timestamp not null default now(), updated_at timestamp not null default now()
    );
    create table products (
      id text primary key, name text not null, sku text not null,
      owner_id text references users(id), created_at timestamp not null default now()
    );
    create table product_variants (id text primary key, name text not null, created_at timestamp not null default now());
    create table product_variant_assignments (
      product_id text not null references products(id), variant_id text not null references product_variants(id),
      primary key (product_id, variant_id)
    );
  `))
}

describe('organizational identity', () => {
  beforeEach(async () => {
    const db = getDb()
    await resetSchema()

    await db.insert(roles).values([
      { id: 'role-admin', name: 'Administrator', scope: 'all' },
      { id: 'role-central', name: 'Pusat', scope: 'central' },
      { id: 'role-section', name: 'Petugas Ruas', scope: 'section' },
      { id: 'role-owner', name: 'Owner', scope: 'owner' },
      { id: 'role-inactive', name: 'Nonaktif', scope: 'all', active: false },
    ])
    await db.insert(permissions).values([
      { id: 'view-user', code: 'view-user', name: 'View users' },
      { id: 'create-user', code: 'create-user', name: 'Create user' },
      { id: 'retired', code: 'retired', name: 'Retired permission', active: false },
    ])
    await db.insert(sectionTypes).values({ id: 'type-toll', code: 'TOLL', name: 'Ruas Tol' })
    await db.insert(tollSections).values({ id: 'section-north', code: 'NORTH', name: 'Ruas Utara', sectionTypeId: 'type-toll' })
    await db.insert(jobPositions).values({ id: 'position-officer', code: 'OFFICER', name: 'Petugas' })

    await db.insert(users).values([
      { id: CALLER, name: 'Caller', email: 'caller@example.com' },
      { id: 'user-roleless', name: 'Roleless', email: 'roleless@example.com' },
      { id: 'user-admin', name: 'Admin', email: 'admin@example.com' },
    ])
    await db.insert(accounts).values({
      id: 'account-admin', accountId: 'user-admin', providerId: 'credential', userId: 'user-admin',
      password: await hashPassword('demo-password'),
    })
    await db.insert(userRoles).values({ userId: 'user-admin', roleId: 'role-admin' })

    const signedIn = await getAuth().api.signInEmail({
      body: { email: 'admin@example.com', password: 'demo-password' },
      returnHeaders: true,
    })
    sessionCookie = signedIn.headers.get('set-cookie')?.split(';')[0] ?? ''
  })

  afterAll(() => closeDb())

  it('collects every active role the caller holds', async () => {
    await getDb().insert(userRoles).values([
      { userId: CALLER, roleId: 'role-section' },
      { userId: CALLER, roleId: 'role-owner' },
    ])

    const identity = await orgIdentity(argsFor(CALLER))
    expect(identity?.roleIds.sort()).toEqual(['role-owner', 'role-section'])
  })

  it('takes the widest scope among several roles, not the first or the last', async () => {
    // Inserted narrowest-first and narrowest-last so neither ordering accidentally passes.
    await getDb().insert(userRoles).values([
      { userId: CALLER, roleId: 'role-owner' },
      { userId: CALLER, roleId: 'role-central' },
      { userId: CALLER, roleId: 'role-section' },
    ])

    const identity = await orgIdentity(argsFor(CALLER))
    expect(identity?.scope).toBe('central')
  })

  it('excludes an inactive user-role mapping and an inactive role', async () => {
    await getDb().insert(userRoles).values([
      { userId: CALLER, roleId: 'role-admin', active: false },
      { userId: CALLER, roleId: 'role-inactive', active: true },
      { userId: CALLER, roleId: 'role-section' },
    ])

    const identity = await orgIdentity(argsFor(CALLER))
    expect(identity?.roleIds).toEqual(['role-section'])
    expect(identity?.scope).toBe('section')
  })

  it('drops a permission when either the mapping or the permission itself is inactive', async () => {
    const db = getDb()
    await db.insert(userRoles).values({ userId: CALLER, roleId: 'role-section' })
    await db.insert(rolePermissions).values([
      { roleId: 'role-section', permissionId: 'view-user' },
      { roleId: 'role-section', permissionId: 'create-user', active: false },
      { roleId: 'role-section', permissionId: 'retired' },
    ])

    const identity = await orgIdentity(argsFor(CALLER))
    expect([...(identity?.permissions ?? [])]).toEqual(['view-user'])
  })

  it('resolves a caller with no employee row as unplaced rather than failing', async () => {
    await getDb().insert(userRoles).values({ userId: CALLER, roleId: 'role-section' })

    const identity = await orgIdentity(argsFor(CALLER))
    expect(identity).toMatchObject({ userId: CALLER, employeeId: null, sectionId: null, jobPositionId: null })
  })

  it('reads section and job position from the linked employee row', async () => {
    await getDb().insert(employees).values({
      id: 'employee-caller', fullName: 'Caller', userId: CALLER,
      sectionId: 'section-north', jobPositionId: 'position-officer',
    })

    const identity = await orgIdentity(argsFor(CALLER))
    expect(identity).toMatchObject({
      employeeId: 'employee-caller',
      sectionId: 'section-north',
      jobPositionId: 'position-officer',
    })
  })

  it('gives a caller with no roles the narrowest scope, never the widest', async () => {
    const identity = await orgIdentity(argsFor('user-roleless'))
    expect(identity?.roleIds).toEqual([])
    expect(identity?.scope).toBe('owner')
    expect(identity?.permissions.size).toBe(0)
  })

  it('returns null for an unauthenticated caller', async () => {
    expect(await orgIdentity(argsFor(null))).toBeNull()
  })

  it('refuses without the permission code and passes with it', async () => {
    const db = getDb()
    await db.insert(userRoles).values({ userId: CALLER, roleId: 'role-section' })
    const guard = requirePermission('view-user')

    await expect(guard(argsFor(CALLER))).rejects.toMatchObject({ status: 403, code: 'forbidden' })

    await db.insert(rolePermissions).values({ roleId: 'role-section', permissionId: 'view-user' })
    await expect(guard(argsFor(CALLER))).resolves.toBeUndefined()
  })

  it('serves the caller their own resolved identity, with permissions unioned across roles', async () => {
    const db = getDb()
    await db.insert(userRoles).values({ userId: 'user-admin', roleId: 'role-section' })
    await db.insert(rolePermissions).values([
      { roleId: 'role-admin', permissionId: 'view-user' },
      { roleId: 'role-section', permissionId: 'create-user' },
    ])
    await db.insert(employees).values({
      id: 'employee-admin', fullName: 'Admin', userId: 'user-admin',
      sectionId: 'section-north', jobPositionId: 'position-officer',
    })

    const response = await app.request('/me')
    expect(response.status).toBe(200)
    const body = (await response.json()) as { data: { permissions: string[]; scope: string; sectionId: string | null } }
    expect(body.data.permissions.sort()).toEqual(['create-user', 'view-user'])
    expect(body.data.scope).toBe('all')
    expect(body.data.sectionId).toBe('section-north')

    expect((await rawApp.request('/me')).status).toBe(401)
  })

  it('assigns and revokes a user role idempotently over HTTP', async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const assigned = await app.request(`/users/${CALLER}/roles/role-section`, { method: 'PUT' })
      expect(assigned.status).toBe(200)
      expect(await assigned.json()).toMatchObject({ data: { id: 'role-section', assigned: true } })
    }
    expect((await orgIdentity(argsFor(CALLER)))?.roleIds).toEqual(['role-section'])

    for (let attempt = 0; attempt < 2; attempt++) {
      const revoked = await app.request(`/users/${CALLER}/roles/role-section`, { method: 'DELETE' })
      expect(revoked.status).toBe(200)
      expect(await revoked.json()).toMatchObject({ data: { id: 'role-section', assigned: false } })
    }
    expect((await orgIdentity(argsFor(CALLER)))?.roleIds).toEqual([])

    const listed = await app.request(`/users/${CALLER}/roles`)
    expect(listed.status).toBe(200)
    expect(await listed.json()).toMatchObject({
      data: expect.arrayContaining([expect.objectContaining({ id: 'role-section', assigned: false })]),
    })

    expect((await app.request('/users/missing-user/roles')).status).toBe(404)
    expect((await app.request(`/users/${CALLER}/roles/missing-role`, { method: 'PUT' })).status).toBe(404)
  })
})
