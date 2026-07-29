import { eq, sql } from 'drizzle-orm'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hashPassword } from 'better-auth/crypto'
import { app as rawApp } from '../app'
import { getAuth } from '../routes/auth/auth'
import { accounts } from '../routes/auth/auth.entity'
import { closeDb, getDb } from '../db'
import { employees, jobPositions, sectionGroups, sectionTypes, tollSections } from '../routes/organization/organization.entity'
import { roles, userRoles } from '../routes/roles/roles.entity'
import { users } from '../routes/users/users.entity'
import { notifications } from '../routes/notifications/notifications.entity'
import { configVerificators, logVerifications } from '../routes/verification/verification.entity'
import { overtimes } from '../routes/overtimes/overtimes.entity'
import { createMemoryTransport, setTransport } from '../notifications/transport'

const NORTH = 'section-north'
const SOUTH = 'section-south'

function client(cookie: string) {
  return {
    request(path: string, init: RequestInit = {}) {
      const headers = new Headers(init.headers)
      headers.set('Cookie', cookie)
      if (init.body) headers.set('Content-Type', 'application/json')
      return rawApp.request(path, { ...init, headers })
    },
    post(path: string, body?: unknown) {
      return this.request(path, { method: 'POST', ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    },
  }
}

async function signIn(email: string) {
  const signedIn = await getAuth().api.signInEmail({ body: { email, password: 'demo-password' }, returnHeaders: true })
  return client(signedIn.headers.get('set-cookie')?.split(';')[0] ?? '')
}

async function resetSchema() {
  await getDb().execute(sql.raw(`
    drop table if exists overtimes cascade;
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
    create table permissions (id text primary key, code text not null unique, name text not null, active boolean not null default true);
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
      id text primary key, recipient_employee_id text references employees(id),
      job_position_id text references job_positions(id), role_id text references roles(id),
      section_id text references toll_sections(id),
      title text not null, content text not null, status_code text not null default 'unseen',
      notification_type text not null, module_name text not null, module_id text,
      payload jsonb, created_by_user_id text references users(id),
      created_at timestamp not null default now(), updated_at timestamp not null default now()
    );
    create table overtimes (
      id text primary key,
      section_id text not null references toll_sections(id),
      applicant_employee_id text not null references employees(id),
      date date not null, start_time time not null, estimated_minutes integer not null,
      description text, status_code text not null default 'draft',
      created_by_user_id text references users(id),
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
const DRAFT = { date: '2026-07-20', startTime: '18:00', estimatedMinutes: 120, description: 'Perbaikan gardu' }

/** Applicant, supervisor (step 1), group coordinator (step 2). */
let applicant: Awaited<ReturnType<typeof signIn>>
let supervisor: Awaited<ReturnType<typeof signIn>>
let coordinator: Awaited<ReturnType<typeof signIn>>

async function chainFor(moduleId: string) {
  return getDb().select().from(logVerifications).where(eq(logVerifications.moduleId, moduleId)).orderBy(logVerifications.orderNumber)
}

async function notificationsFor(moduleId: string) {
  return getDb().select().from(notifications).where(eq(notifications.moduleId, moduleId))
}

async function statusOf(id: string) {
  const rows = await getDb().select({ statusCode: overtimes.statusCode }).from(overtimes).where(eq(overtimes.id, id)).limit(1)
  return rows[0]?.statusCode
}

async function createDraft(as = applicant, body: Record<string, unknown> = DRAFT) {
  const response = await as.post('/overtimes/create', body)
  expect(response.status).toBe(201)
  return ((await response.json()) as { data: { id: string } }).data
}

describe('overtime workflow', () => {
  beforeEach(async () => {
    const db = getDb()
    await resetSchema()
    transport.reset()
    setTransport(transport)

    await db.insert(roles).values([
      { id: 'role-admin', name: 'Administrator', scope: 'all' },
      { id: 'role-officer', name: 'Petugas', scope: 'section' },
    ])
    await db.insert(sectionTypes).values({ id: 'type-toll', code: 'TOLL', name: 'Ruas Tol' })
    await db.insert(tollSections).values([
      { id: NORTH, code: 'NORTH', name: 'Ruas Utara', sectionTypeId: 'type-toll' },
      { id: SOUTH, code: 'SOUTH', name: 'Ruas Selatan', sectionTypeId: 'type-toll' },
    ])
    await db.insert(jobPositions).values([
      { id: 'pos-officer', code: 'OFFICER', name: 'Petugas' },
      { id: 'pos-supervisor', code: 'SUPERVISOR', name: 'Supervisor' },
    ])
    await db.insert(sectionGroups).values([
      { id: 'group-north', name: 'Regu Utara', sectionId: NORTH },
      { id: 'group-headless', name: 'Regu Tanpa Koordinator', sectionId: NORTH },
    ])

    await db.insert(users).values([
      { id: 'u-applicant', name: 'Pemohon', email: 'applicant@example.com' },
      { id: 'u-supervisor', name: 'Supervisor', email: 'supervisor@example.com' },
      { id: 'u-supervisor-south', name: 'Supervisor Selatan', email: 'supervisor-south@example.com' },
      { id: 'u-coordinator', name: 'Koordinator', email: 'coordinator@example.com' },
      { id: 'u-stranger', name: 'Orang Lain', email: 'stranger@example.com' },
      { id: 'u-admin', name: 'Admin', email: 'admin@example.com' },
      { id: 'u-unplaced', name: 'Tanpa Pegawai', email: 'unplaced@example.com' },
      { id: 'u-inactive', name: 'Inactive', email: 'inactive@example.com' },
    ])
    await db.insert(accounts).values(
      await Promise.all(
        ['u-applicant', 'u-supervisor', 'u-supervisor-south', 'u-coordinator', 'u-stranger', 'u-admin', 'u-unplaced'].map(async (id) => ({
          id: `acc-${id}`, accountId: id, providerId: 'credential', userId: id, password: await hashPassword('demo-password'),
        })),
      ),
    )
    await db.insert(userRoles).values([
      { userId: 'u-applicant', roleId: 'role-officer' },
      { userId: 'u-supervisor', roleId: 'role-officer' },
      { userId: 'u-supervisor-south', roleId: 'role-officer' },
      { userId: 'u-coordinator', roleId: 'role-officer' },
      { userId: 'u-stranger', roleId: 'role-officer' },
      { userId: 'u-admin', roleId: 'role-admin' },
    ])
    await db.insert(employees).values([
      { id: 'emp-coordinator', fullName: 'Koordinator', userId: 'u-coordinator', sectionId: NORTH, jobPositionId: 'pos-officer' },
      { id: 'emp-applicant', fullName: 'Pemohon', userId: 'u-applicant', sectionId: NORTH, jobPositionId: 'pos-officer', sectionGroupId: 'group-north' },
      { id: 'emp-supervisor', fullName: 'Supervisor', userId: 'u-supervisor', sectionId: NORTH, jobPositionId: 'pos-supervisor' },
      { id: 'emp-supervisor-south', fullName: 'Supervisor Selatan', userId: 'u-supervisor-south', sectionId: SOUTH, jobPositionId: 'pos-supervisor' },
      { id: 'emp-stranger', fullName: 'Orang Lain', userId: 'u-stranger', sectionId: NORTH, jobPositionId: 'pos-officer' },
      { id: 'emp-admin', fullName: 'Admin', userId: 'u-admin', sectionId: SOUTH, jobPositionId: 'pos-officer' },
      { id: 'emp-inactive', fullName: 'Inactive', userId: 'u-inactive', sectionId: NORTH, jobPositionId: 'pos-officer', active: false },
      { id: 'emp-unlinked', fullName: 'Unlinked', userId: null, sectionId: NORTH, jobPositionId: 'pos-officer' },
    ])
    await db.update(sectionGroups).set({ koregEmployeeId: 'emp-coordinator' }).where(eq(sectionGroups.id, 'group-north'))

    await db.insert(configVerificators).values([
      { id: 'cfg-1', moduleName: 'overtimes', sectionTypeId: 'type-toll', orderNumber: 1, verificatorType: 'jobPosition', jobPositionId: 'pos-supervisor' },
      { id: 'cfg-2', moduleName: 'overtimes', sectionTypeId: 'type-toll', orderNumber: 2, verificatorType: 'sectionGroupHead', jobPositionId: null },
    ])

    applicant = await signIn('applicant@example.com')
    supervisor = await signIn('supervisor@example.com')
    coordinator = await signIn('coordinator@example.com')
  })

  afterEach(() => vi.restoreAllMocks())

  afterAll(async () => {
    setTransport(undefined)
    vi.restoreAllMocks()
    await closeDb()
  })

  describe('applicant lookup', () => {
    it('lists active account-linked employees in caller section with search and pagination metadata', async () => {
      const response = await applicant.request(`/overtimes/applicants/list?sectionId=${NORTH}&search=Pem&page=1&limit=1`)
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({
        data: [{ id: 'emp-applicant', fullName: 'Pemohon', sectionId: NORTH }],
        page: 1,
        limit: 1,
        total: 1,
      })
    })

    it('excludes inactive and account-unlinked employees', async () => {
      const response = await applicant.request(`/overtimes/applicants/list?sectionId=${NORTH}&limit=100`)
      const body = await response.json() as { data: { id: string }[] }
      expect(body.data.map(({ id }) => id)).not.toEqual(expect.arrayContaining(['emp-inactive', 'emp-unlinked']))
    })

    it('rejects cross-section list requests for section-scoped callers', async () => {
      const response = await applicant.request(`/overtimes/applicants/list?sectionId=${SOUTH}`)
      expect(response.status).toBe(403)
    })

    it('allows all scope to select any section', async () => {
      const admin = await signIn('admin@example.com')
      const response = await admin.request(`/overtimes/applicants/list?sectionId=${NORTH}&search=Pem`)
      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({ data: [{ id: 'emp-applicant' }], total: 1 })
    })

    it('hydrates eligible same-section applicant detail', async () => {
      const response = await applicant.request('/overtimes/applicants/detail/emp-applicant')
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ data: { id: 'emp-applicant', fullName: 'Pemohon', sectionId: NORTH } })
    })

    it.each(['emp-supervisor-south', 'emp-inactive', 'emp-unlinked'])('hides forbidden or ineligible detail %s', async (id) => {
      expect((await applicant.request(`/overtimes/applicants/detail/${id}`)).status).toBe(404)
    })
  })

  describe('creation', () => {
    it('derives applicant and section from the caller, ignoring anything the client sends', async () => {
      const response = await applicant.post('/overtimes/create', {
        ...DRAFT,
        applicantEmployeeId: 'emp-stranger',
        sectionId: SOUTH,
        statusCode: 'approved',
      })
      expect(response.status).toBe(201)

      const created = ((await response.json()) as { data: { id: string; applicantEmployeeId: string; sectionId: string; statusCode: string } }).data
      expect(created.applicantEmployeeId).toBe('emp-applicant')
      expect(created.sectionId).toBe(NORTH)
      expect(created.statusCode).toBe('draft')
    })

    it('refuses a caller with no employee row with 403, not a 500', async () => {
      const unplaced = await signIn('unplaced@example.com')
      const response = await unplaced.post('/overtimes/create', DRAFT)

      expect(response.status).toBe(403)
      expect(await response.json()).toMatchObject({ error: 'forbidden' })
    })

    it('allows editing a draft and refuses once it is waiting', async () => {
      const draft = await createDraft()

      const edited = await applicant.request(`/overtimes/update/${draft.id}`, { method: 'PATCH', body: JSON.stringify({ description: 'Diubah' }) })
      expect(edited.status).toBe(200)

      await applicant.post(`/overtimes/submit/${draft.id}`)

      const late = await applicant.request(`/overtimes/update/${draft.id}`, { method: 'PATCH', body: JSON.stringify({ description: 'Terlambat' }) })
      expect(late.status).toBe(409)
      expect(await late.json()).toMatchObject({ error: 'not_draft' })
    })
  })

  describe('chain seeding', () => {
    it('seeds one ordered log row per configured verificator, only the first waiting', async () => {
      const draft = await createDraft()
      expect((await applicant.post(`/overtimes/submit/${draft.id}`)).status).toBe(200)

      const chain = await chainFor(draft.id)
      expect(chain.map((step) => [step.orderNumber, step.statusCode])).toEqual([
        [1, 'waiting'],
        [2, 'pending'],
      ])
      // No sentinel step: order numbers start at 1.
      expect(chain.map((step) => step.orderNumber)).not.toContain(0)
      expect(await statusOf(draft.id)).toBe('waiting')
    })

    it('inserts one notification per step, later steps unset rather than unread', async () => {
      const draft = await createDraft()
      await applicant.post(`/overtimes/submit/${draft.id}`)

      const rows = await notificationsFor(draft.id)
      expect(rows).toHaveLength(2)
      expect(rows.map((row) => row.statusCode).sort()).toEqual(['unseen', 'unset'])
    })

    it('fails at submit when a required head is unset, and writes nothing', async () => {
      await getDb().update(employees).set({ sectionGroupId: 'group-headless' }).where(eq(employees.id, 'emp-applicant'))
      const draft = await createDraft()

      const response = await applicant.post(`/overtimes/submit/${draft.id}`)
      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({ message: expect.stringContaining('Koordinator Regu') })

      // The whole submit rolls back: no half-seeded chain, no orphan notifications.
      expect(await chainFor(draft.id)).toHaveLength(0)
      expect(await notificationsFor(draft.id)).toHaveLength(0)
      expect(await statusOf(draft.id)).toBe('draft')
    })

    it('fails at submit when the module has no configured chain, rather than auto-approving', async () => {
      await getDb().delete(configVerificators)
      const draft = await createDraft()

      const response = await applicant.post(`/overtimes/submit/${draft.id}`)
      expect(response.status).toBe(400)
      expect(await statusOf(draft.id)).toBe('draft')
    })
  })

  describe('verification', () => {
    async function submitted() {
      const draft = await createDraft()
      await applicant.post(`/overtimes/submit/${draft.id}`)
      return draft
    }

    it('accepts the job-position holder in the same section', async () => {
      const record = await submitted()
      expect((await supervisor.post(`/overtimes/verify/${record.id}`, { decision: 'approved' })).status).toBe(200)
    })

    it('refuses the same job position in a different section', async () => {
      const record = await submitted()
      const southSupervisor = await signIn('supervisor-south@example.com')

      // The section clause is the whole point: without it, holding the right
      // position anywhere would authorize verifying any section's request.
      const response = await southSupervisor.post(`/overtimes/verify/${record.id}`, { decision: 'approved' })
      expect(response.status).toBe(403)
    })

    it('refuses an unrelated caller', async () => {
      const record = await submitted()
      const stranger = await signIn('stranger@example.com')
      expect((await stranger.post(`/overtimes/verify/${record.id}`, { decision: 'approved' })).status).toBe(403)
    })

    it('lets an all-scoped caller verify regardless of position or section', async () => {
      const record = await submitted()
      const admin = await signIn('admin@example.com')
      expect((await admin.post(`/overtimes/verify/${record.id}`, { decision: 'approved' })).status).toBe(200)
    })

    it('accepts the named recipient on a head step', async () => {
      const record = await submitted()
      await supervisor.post(`/overtimes/verify/${record.id}`, { decision: 'approved' })

      expect((await coordinator.post(`/overtimes/verify/${record.id}`, { decision: 'approved' })).status).toBe(200)
    })

    it('activates the next step on a non-final approval and keeps the record waiting', async () => {
      const record = await submitted()
      await supervisor.post(`/overtimes/verify/${record.id}`, { decision: 'approved' })

      const chain = await chainFor(record.id)
      expect(chain.map((step) => step.statusCode)).toEqual(['approved', 'waiting'])
      expect(await statusOf(record.id)).toBe('waiting')

      const rows = await notificationsFor(record.id)
      const second = rows.find((row) => (row.payload as { orderNumber?: number } | null)?.orderNumber === 2)
      // unset → unseen exactly when its turn arrives, which is what `unset` is for.
      expect(second?.statusCode).toBe('unseen')
    })

    it('approves the record once the final step is approved', async () => {
      const record = await submitted()
      await supervisor.post(`/overtimes/verify/${record.id}`, { decision: 'approved' })
      await coordinator.post(`/overtimes/verify/${record.id}`, { decision: 'approved' })

      expect(await statusOf(record.id)).toBe('approved')
      expect((await chainFor(record.id)).map((step) => step.statusCode)).toEqual(['approved', 'approved'])
    })

    it('rejects the record at any step and leaves later steps unactivated', async () => {
      const record = await submitted()
      expect((await supervisor.post(`/overtimes/verify/${record.id}`, { decision: 'rejected', description: 'Tidak sesuai' })).status).toBe(200)

      expect(await statusOf(record.id)).toBe('rejected')
      expect((await chainFor(record.id)).map((step) => step.statusCode)).toEqual(['rejected', 'pending'])
    })

    it('answers 409 for a record that is not waiting, and never double-advances', async () => {
      const draft = await createDraft()
      expect((await supervisor.post(`/overtimes/verify/${draft.id}`, { decision: 'approved' })).status).toBe(409)

      const record = await submitted()
      await supervisor.post(`/overtimes/verify/${record.id}`, { decision: 'approved' })
      // Step 1 is decided; the same caller is not the step-2 verificator.
      const again = await supervisor.post(`/overtimes/verify/${record.id}`, { decision: 'approved' })
      expect(again.status).toBe(403)
      expect((await chainFor(record.id)).map((step) => step.statusCode)).toEqual(['approved', 'waiting'])
    })
  })

  describe('transactionality', () => {
    it('persists nothing when the record update fails after the chain is written', async () => {
      const record = await createDraft()
      await applicant.post(`/overtimes/submit/${record.id}`)
      await supervisor.post(`/overtimes/verify/${record.id}`, { decision: 'approved' })

      const before = (await chainFor(record.id)).map((step) => step.statusCode)
      expect(before).toEqual(['approved', 'waiting'])

      // Let every write in the transaction happen, then fail before it commits.
      // Injecting at the transaction boundary rather than on `db.update` is what
      // actually exercises the boundary: inside the callback the code writes
      // through `tx`, which a spy on the database object never sees.
      const db = getDb()
      const realTransaction = db.transaction.bind(db)
      vi.spyOn(db, 'transaction').mockImplementationOnce((async (fn: (tx: unknown) => Promise<unknown>) =>
        realTransaction(async (tx) => {
          await fn(tx)
          throw new Error('injected failure before commit')
        })) as never)

      const response = await coordinator.post(`/overtimes/verify/${record.id}`, { decision: 'approved' })
      expect(response.status).toBeGreaterThanOrEqual(400)

      // Nothing moved: the log row is still waiting and the record still waiting.
      expect((await chainFor(record.id)).map((step) => step.statusCode)).toEqual(before)
      expect(await statusOf(record.id)).toBe('waiting')
    })

    it('does not roll back an approval when the transport throws', async () => {
      const record = await createDraft()
      await applicant.post(`/overtimes/submit/${record.id}`)

      transport.failNext()
      const response = await supervisor.post(`/overtimes/verify/${record.id}`, { decision: 'approved' })

      expect(response.status).toBe(200)
      // The decision stands even though delivery failed — a push service being
      // down must never undo a verification.
      expect((await chainFor(record.id)).map((step) => step.statusCode)).toEqual(['approved', 'waiting'])
      expect(await statusOf(record.id)).toBe('waiting')
      expect(transport.delivered.map((message) => message.notificationId)).not.toContain(undefined)
    })

    it('dispatches the activated notification after commit, to the resolved recipients', async () => {
      const record = await createDraft()
      await applicant.post(`/overtimes/submit/${record.id}`)

      // Step 1 is a jobPosition step: it fans out to the supervisor of that section.
      expect(transport.delivered).toHaveLength(1)
      expect(transport.delivered[0]!.userIds).toEqual(['u-supervisor'])

      transport.reset()
      await supervisor.post(`/overtimes/verify/${record.id}`, { decision: 'approved' })

      // Step 2 names an individual: the group coordinator.
      expect(transport.delivered).toHaveLength(1)
      expect(transport.delivered[0]!.userIds).toEqual(['u-coordinator'])
    })
  })

  describe('scoped list', () => {
    it('shows a section-scoped caller only their own section', async () => {
      await createDraft()
      await getDb().insert(overtimes).values({
        id: 'other-section', sectionId: SOUTH, applicantEmployeeId: 'emp-supervisor-south',
        date: '2026-07-20', startTime: '18:00', estimatedMinutes: 60, statusCode: 'draft',
      })

      const body = (await (await applicant.request('/overtimes/list?limit=50')).json()) as { data: { sectionId: string }[] }
      expect(body.data.every((row) => row.sectionId === NORTH)).toBe(true)
      expect(body.data.map((row) => row.sectionId)).not.toContain(SOUTH)
    })

    it('shows an unplaced caller nothing rather than everything', async () => {
      await createDraft()
      const unplaced = await signIn('unplaced@example.com')

      const body = (await (await unplaced.request('/overtimes/list?limit=50')).json()) as { data: unknown[]; total: number }
      expect(body.data).toHaveLength(0)
      expect(body.total).toBe(0)
    })
  })
})
