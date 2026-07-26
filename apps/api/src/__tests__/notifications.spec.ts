import { sql } from 'drizzle-orm'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { hashPassword } from 'better-auth/crypto'
import { app as rawApp } from '../app'
import { getAuth } from '../routes/auth/auth'
import { accounts } from '../routes/auth/auth.entity'
import { closeDb, getDb } from '../db'
import { employees, jobPositions, sectionTypes, tollSections } from '../routes/organization/organization.entity'
import { permissions, rolePermissions, roles, userRoles } from '../routes/roles/roles.entity'
import { users } from '../routes/users/users.entity'
import { notifications } from '../routes/notifications/notifications.entity'
import { resolveRecipients } from '../routes/notifications/recipients'
import { createMemoryTransport, notifyAfterCommit, setTransport } from '../notifications/transport'

const NORTH = 'section-north'
const SOUTH = 'section-south'

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

let sessionCookie = ''
function signedInAs(cookie: string) {
  return {
    request(path: string, init: RequestInit = {}) {
      const headers = new Headers(init.headers)
      headers.set('Cookie', cookie)
      return rawApp.request(path, { ...init, headers })
    },
  }
}
const app = {
  request(path: string, init: RequestInit = {}) {
    return signedInAs(sessionCookie).request(path, init)
  },
}

async function signIn(email: string) {
  const signedIn = await getAuth().api.signInEmail({ body: { email, password: 'demo-password' }, returnHeaders: true })
  return signedIn.headers.get('set-cookie')?.split(';')[0] ?? ''
}

async function resetSchema() {
  await getDb().execute(sql.raw(`
    drop table if exists notifications cascade;
    drop table if exists log_verifications cascade;
    drop table if exists config_verificators cascade;
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
      active boolean not null default true, primary key (role_id, permission_id)
    );
    create table users (
      id text primary key, name text not null, email text not null unique,
      email_verified boolean not null default false, image text,
      created_at timestamp not null default now(), updated_at timestamp not null default now()
    );
    create table user_roles (
      user_id text not null references users(id) on delete cascade,
      role_id text not null references roles(id) on delete cascade,
      active boolean not null default true, primary key (user_id, role_id)
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
    create table config_verificators (
      id text primary key, module_name text not null, section_type_id text references section_types(id),
      order_number integer not null, verificator_type text not null,
      job_position_id text references job_positions(id),
      created_at timestamp not null default now(), updated_at timestamp not null default now()
    );
    create table log_verifications (
      id text primary key, module_name text not null, module_id text not null, order_number integer not null,
      verificator_type text not null, job_position_id text references job_positions(id),
      recipient_employee_id text references employees(id),
      status_code text not null default 'pending', verified_by_user_id text references users(id),
      verified_at timestamp, verified_description text,
      created_at timestamp not null default now(), updated_at timestamp not null default now()
    );
    create table notifications (
      id text primary key,
      recipient_employee_id text references employees(id),
      job_position_id text references job_positions(id),
      role_id text references roles(id),
      section_id text references toll_sections(id),
      title text not null, content text not null,
      status_code text not null default 'unseen',
      notification_type text not null, module_name text not null, module_id text,
      payload jsonb, created_by_user_id text references users(id),
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

const transport = createMemoryTransport()

describe('notifications', () => {
  beforeEach(async () => {
    const db = getDb()
    await resetSchema()
    transport.reset()
    setTransport(transport)

    await db.insert(roles).values([
      { id: 'role-admin', name: 'Administrator', scope: 'all' },
      { id: 'role-officer', name: 'Petugas', scope: 'section' },
    ])
    await db.insert(permissions).values({ id: 'view-user', code: 'view-user', name: 'View users' })
    await db.insert(rolePermissions).values({ roleId: 'role-admin', permissionId: 'view-user' })
    await db.insert(sectionTypes).values({ id: 'type-toll', code: 'TOLL', name: 'Ruas Tol' })
    await db.insert(tollSections).values([
      { id: NORTH, code: 'NORTH', name: 'Ruas Utara', sectionTypeId: 'type-toll' },
      { id: SOUTH, code: 'SOUTH', name: 'Ruas Selatan', sectionTypeId: 'type-toll' },
    ])
    await db.insert(jobPositions).values([
      { id: 'position-officer', code: 'OFFICER', name: 'Petugas' },
      { id: 'position-manager', code: 'MANAGER', name: 'Manager' },
    ])

    await db.insert(users).values([
      { id: 'user-north', name: 'Utara', email: 'north@example.com' },
      { id: 'user-north-2', name: 'Utara Dua', email: 'north2@example.com' },
      { id: 'user-south', name: 'Selatan', email: 'south@example.com' },
      { id: 'user-admin', name: 'Admin', email: 'admin@example.com' },
      { id: 'user-unplaced', name: 'Tanpa Penempatan', email: 'unplaced@example.com' },
    ])
    await db.insert(accounts).values(
      await Promise.all(
        ['user-north', 'user-south', 'user-admin', 'user-unplaced'].map(async (id) => ({
          id: `account-${id}`, accountId: id, providerId: 'credential', userId: id,
          password: await hashPassword('demo-password'),
        })),
      ),
    )
    await db.insert(userRoles).values([
      { userId: 'user-north', roleId: 'role-officer' },
      { userId: 'user-north-2', roleId: 'role-officer' },
      { userId: 'user-south', roleId: 'role-officer' },
      { userId: 'user-admin', roleId: 'role-admin' },
    ])
    await db.insert(employees).values([
      { id: 'emp-north', fullName: 'Utara', userId: 'user-north', sectionId: NORTH, jobPositionId: 'position-officer' },
      { id: 'emp-north-2', fullName: 'Utara Dua', userId: 'user-north-2', sectionId: NORTH, jobPositionId: 'position-officer' },
      { id: 'emp-south', fullName: 'Selatan', userId: 'user-south', sectionId: SOUTH, jobPositionId: 'position-officer' },
      { id: 'emp-admin', fullName: 'Admin', userId: 'user-admin', sectionId: NORTH, jobPositionId: 'position-manager' },
      { id: 'emp-no-login', fullName: 'Tanpa Akun', sectionId: NORTH, jobPositionId: 'position-officer' },
      { id: 'emp-inactive', fullName: 'Nonaktif', sectionId: NORTH, jobPositionId: 'position-officer', active: false },
    ])

    sessionCookie = await signIn('north@example.com')
  })

  afterAll(async () => {
    setTransport(undefined)
    await closeDb()
  })

  describe('recipient resolution', () => {
    it('resolves an employee target to that employee’s user', async () => {
      expect(await resolveRecipients({ recipientEmployeeId: 'emp-north', jobPositionId: null, roleId: null, sectionId: NORTH })).toEqual(['user-north'])
    })

    it('resolves an employee with no login to nobody, without throwing', async () => {
      expect(await resolveRecipients({ recipientEmployeeId: 'emp-no-login', jobPositionId: null, roleId: null, sectionId: NORTH })).toEqual([])
    })

    it('resolves a job-position target across that section only', async () => {
      const north = await resolveRecipients({ recipientEmployeeId: null, jobPositionId: 'position-officer', roleId: null, sectionId: NORTH })
      expect(north.sort()).toEqual(['user-north', 'user-north-2'])

      const south = await resolveRecipients({ recipientEmployeeId: null, jobPositionId: 'position-officer', roleId: null, sectionId: SOUTH })
      expect(south).toEqual(['user-south'])
    })

    it('resolves a role target through active user-role rows only', async () => {
      const before = await resolveRecipients({ recipientEmployeeId: null, jobPositionId: null, roleId: 'role-officer', sectionId: NORTH })
      expect(before.sort()).toEqual(['user-north', 'user-north-2'])

      await getDb().execute(sql.raw(`update user_roles set active = false where user_id = 'user-north-2'`))
      const after = await resolveRecipients({ recipientEmployeeId: null, jobPositionId: null, roleId: 'role-officer', sectionId: NORTH })
      expect(after).toEqual(['user-north'])
    })

    it('unions two target kinds rather than letting the last one win', async () => {
      // The reference implementation assigns in each branch, so this row would fan
      // out to the role alone. Here it reaches the manager as well.
      const recipients = await resolveRecipients({ recipientEmployeeId: null, jobPositionId: 'position-manager', roleId: 'role-officer', sectionId: NORTH })
      expect(recipients.sort()).toEqual(['user-admin', 'user-north', 'user-north-2'])
    })

    it('deduplicates a user matched by more than one rule', async () => {
      const recipients = await resolveRecipients({ recipientEmployeeId: 'emp-north', jobPositionId: 'position-officer', roleId: 'role-officer', sectionId: NORTH })
      expect(recipients.sort()).toEqual(['user-north', 'user-north-2'])
    })
  })

  describe('scoped list', () => {
    beforeEach(async () => {
      await getDb().insert(notifications).values([
        { id: 'n-north-direct', recipientEmployeeId: 'emp-north', sectionId: NORTH, title: 'Utara langsung', content: 'x', notificationType: 'info', moduleName: 'overtimes' },
        { id: 'n-north-position', jobPositionId: 'position-officer', sectionId: NORTH, title: 'Utara posisi', content: 'x', notificationType: 'info', moduleName: 'overtimes' },
        { id: 'n-north-role', roleId: 'role-officer', sectionId: NORTH, title: 'Utara role', content: 'x', notificationType: 'info', moduleName: 'overtimes' },
        { id: 'n-south-role', roleId: 'role-officer', sectionId: SOUTH, title: 'Selatan role', content: 'x', notificationType: 'info', moduleName: 'overtimes' },
        // Targets the admin's role but sits in a section the admin is not placed in.
        // Only the scope dimension can let this through.
        { id: 'n-south-admin', roleId: 'role-admin', sectionId: SOUTH, title: 'Selatan admin', content: 'x', notificationType: 'info', moduleName: 'overtimes' },
        { id: 'n-old', roleId: 'role-officer', sectionId: NORTH, title: 'Kedaluwarsa', content: 'x', notificationType: 'info', moduleName: 'overtimes', createdAt: daysAgo(45) },
        { id: 'n-unset', roleId: 'role-officer', sectionId: NORTH, title: 'Belum giliran', content: 'x', statusCode: 'unset', notificationType: 'verification', moduleName: 'overtimes' },
      ])
    })

    it('shows a section-scoped caller only their own section', async () => {
      const response = await app.request('/notifications/list?limit=50')
      expect(response.status).toBe(200)
      const body = (await response.json()) as { data: { id: string }[]; total: number }
      const ids = body.data.map((row) => row.id).sort()

      expect(ids).toEqual(['n-north-direct', 'n-north-position', 'n-north-role', 'n-unset'])
      expect(ids).not.toContain('n-south-role')
    })

    it('lifts the section restriction for an all-scoped caller, but not the target one', async () => {
      const admin = signedInAs(await signIn('admin@example.com'))
      const body = (await (await admin.request('/notifications/list?limit=50')).json()) as { data: { id: string }[] }
      const ids = body.data.map((row) => row.id)

      // Placed in the north, reads a southern row because scope is 'all'.
      expect(ids).toContain('n-south-admin')
      // Still not a recipient of rows aimed at a role they do not hold. Wide scope
      // is not a wildcard — it only removes the section clause.
      expect(ids).not.toContain('n-south-role')
      expect(ids).not.toContain('n-north-role')
    })

    it('shows a caller with no employee row and no roles an empty page, not everything', async () => {
      const unplaced = signedInAs(await signIn('unplaced@example.com'))
      const response = await unplaced.request('/notifications/list?limit=50')

      expect(response.status).toBe(200)
      const body = (await response.json()) as { data: unknown[]; total: number }
      expect(body.data.length).toBe(0)
      expect(body.total).toBe(0)
    })

    it('excludes notifications older than the 30-day window', async () => {
      const body = (await (await app.request('/notifications/list?limit=50')).json()) as { data: { id: string }[] }
      expect(body.data.map((row) => row.id)).not.toContain('n-old')
    })

    it('paginates and totals like any other list route', async () => {
      const first = (await (await app.request('/notifications/list?limit=2&page=1&sort=id&order=asc')).json()) as { data: { id: string }[]; total: number; page: number }
      const second = (await (await app.request('/notifications/list?limit=2&page=2&sort=id&order=asc')).json()) as { data: { id: string }[] }

      expect(first.total).toBe(4)
      expect(first.page).toBe(1)
      expect(first.data).toHaveLength(2)
      expect(second.data.map((row) => row.id)).not.toEqual(first.data.map((row) => row.id))
    })

    it('serves a scoped detail and hides another section behind 404', async () => {
      expect((await app.request('/notifications/detail/n-north-direct')).status).toBe(200)
      expect((await app.request('/notifications/detail/n-south-role')).status).toBe(404)
    })
  })

  describe('unread count and mark-seen', () => {
    beforeEach(async () => {
      await getDb().insert(notifications).values([
        { id: 'u-1', recipientEmployeeId: 'emp-north', sectionId: NORTH, title: 'a', content: 'x', notificationType: 'info', moduleName: 'overtimes' },
        { id: 'u-2', roleId: 'role-officer', sectionId: NORTH, title: 'b', content: 'x', notificationType: 'info', moduleName: 'overtimes' },
        { id: 'u-seen', roleId: 'role-officer', sectionId: NORTH, title: 'c', content: 'x', statusCode: 'seen', notificationType: 'info', moduleName: 'overtimes' },
        { id: 'u-unset', roleId: 'role-officer', sectionId: NORTH, title: 'd', content: 'x', statusCode: 'unset', notificationType: 'info', moduleName: 'overtimes' },
        { id: 'u-south', roleId: 'role-officer', sectionId: SOUTH, title: 'e', content: 'x', notificationType: 'info', moduleName: 'overtimes' },
      ])
    })

    it('counts only unseen rows the caller can see, never unset ones', async () => {
      const body = (await (await app.request('/notifications/unread-count')).json()) as { data: { total: number } }
      expect(body.data.total).toBe(2)
    })

    it('marks the caller’s own notifications seen and drops the count', async () => {
      const response = await app.request('/notifications/mark-seen', {
        method: 'POST',
        body: JSON.stringify({ ids: ['u-1', 'u-2'] }),
        headers: { 'Content-Type': 'application/json' },
      })
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ data: { updated: 2 } })

      const count = (await (await app.request('/notifications/unread-count')).json()) as { data: { total: number } }
      expect(count.data.total).toBe(0)
    })

    it('updates nothing for another section’s id and still answers 200', async () => {
      const response = await app.request('/notifications/mark-seen', {
        method: 'POST',
        body: JSON.stringify({ ids: ['u-south'] }),
        headers: { 'Content-Type': 'application/json' },
      })

      // 200 with updated: 0, not 403 — a 403 would confirm the id exists.
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ data: { updated: 0 } })

      const rows = await getDb().execute(sql.raw(`select status_code from notifications where id = 'u-south'`))
      expect((rows.rows[0] as { status_code: string }).status_code).toBe('unseen')
    })
  })

  describe('transport', () => {
    it('records deliveries with the resolved user ids', async () => {
      const userIds = await resolveRecipients({ recipientEmployeeId: null, jobPositionId: 'position-officer', roleId: null, sectionId: NORTH })
      await notifyAfterCommit([{ notificationId: 'n-1', userIds, title: 'a', content: 'b' }])

      expect(transport.delivered).toEqual([{ notificationId: 'n-1', userIds, title: 'a', content: 'b' }])
    })

    it('skips a message with no recipients rather than delivering an empty fan-out', async () => {
      await notifyAfterCommit([{ notificationId: 'n-2', userIds: [], title: 'a', content: 'b' }])
      expect(transport.delivered).toEqual([])
    })

    it('does not fail the caller when the transport throws', async () => {
      transport.failNext()

      // A push service being down must never roll back the work that produced the
      // notification. This resolving is the whole assertion.
      await expect(notifyAfterCommit([{ notificationId: 'n-3', userIds: ['user-north'], title: 'a', content: 'b' }])).resolves.toBeUndefined()
      expect(transport.delivered).toEqual([])
    })
  })
})
