import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  createFrameworkQueryClient,
  FrameworkPlugin,
  FormView,
  registerResourceRuntime,
  resetResourceRuntimeForTests,
  resolveFields,
  resolveFrameworkAdapters,
  resolveFrameworkFieldDefaults,
} from '@southneuhof/is-vue-framework'
import { appFieldDefaults } from '@/configs/defaults'

const ok = (payload: unknown) => ({ ok: true, json: async () => payload })
const assignRole = vi.fn(async () => ok({ data: { id: 'r2', roleCode: 'editor', name: 'Editor', description: null, active: true, assigned: true } }))
const revokeRole = vi.fn(async () => ok({ data: { id: 'r2', roleCode: 'editor', name: 'Editor', description: null, active: true, assigned: false } }))
const listSystemRoleAssignments = vi.fn(async () =>
  ok({
    data: [
      { id: 'r1', roleCode: 'admin', name: 'Admin', description: null, active: true, assigned: true },
      { id: 'r2', roleCode: 'editor', name: 'Editor', description: null, active: true, assigned: false },
    ],
    total: 2,
  })
)
const listProjectRoleAssignmentOptions = vi.fn(async () =>
  ok({
    data: {
      divisions: [{ id: 'd1', name: 'Division 1', active: true }],
      projects: [{ id: 'p1', divisionId: 'd1', number: 'P-1', name: 'Project 1', active: true }],
    },
  })
)
const listProjectRoleAssignments = vi.fn(async () =>
  ok({
    data: [{ id: 'r1', roleCode: 'project-admin', name: 'Project Administrator', description: null, active: true, direct: false, effective: false, locked: false, source: null }],
    total: 1,
  })
)
const assignProjectRole = vi.fn(async () =>
  ok({ data: [{ id: 'r1', roleCode: 'project-admin', name: 'Project Administrator', description: null, active: true, direct: true, effective: true, locked: false, source: null }] })
)
const revokeProjectRole = vi.fn(async () =>
  ok({ data: [{ id: 'r1', roleCode: 'project-admin', name: 'Project Administrator', description: null, active: true, direct: false, effective: false, locked: false, source: null }] })
)

vi.mock('@/framework/rpc', () => ({
  rpc: {
    users: {
      list: { $get: vi.fn(async () => ok({ data: [{ id: 'u1', name: 'Admin' }], total: 1, limit: 10 })) },
      detail: { ':id': { $get: vi.fn(async () => ok({ data: { id: 'u1', name: 'Admin', statusCode: 'active' } })) } },
      create: { $post: vi.fn(async () => ok({ data: { id: 'u2', name: 'New user' } })) },
      update: { ':id': { $patch: vi.fn(async () => ok({ data: { id: 'u1' } })) } },
      ':userId': {
        'system-role-assignments': Object.assign({ $get: listSystemRoleAssignments }, { ':roleId': { $put: assignRole, $delete: revokeRole } }),
        'project-role-assignment-options': { $get: listProjectRoleAssignmentOptions },
        'project-role-assignments': Object.assign({ $get: listProjectRoleAssignments }, { ':roleId': { $put: assignProjectRole, $delete: revokeProjectRole } }),
      },
    },
    roles: {
      list: {
        $get: vi.fn(async () =>
          ok({
            data: [
              { id: 'r1', roleCode: 'admin', name: 'Admin', description: null, realm: 'system', active: true },
              { id: 'r2', roleCode: 'editor', name: 'Editor', description: null, realm: 'system', active: true },
            ],
            total: 2,
            limit: 100,
          })
        ),
      },
      detail: { ':id': { $get: vi.fn(async () => ok({ data: {} })) } },
      create: { $post: vi.fn(async () => ok({ data: {} })) },
      update: { ':id': { $patch: vi.fn(async () => ok({ data: {} })) } },
      delete: { ':id': { $delete: vi.fn(async () => ok({ ok: true })) } },
    },
  },
}))

const { users } = await import('./users.resource')
const { appInputProps } = await import('@/framework/inputs/registry')
const { systemRoleAssignments } = await import('./[userId]/detail/system-roles/system-role-assignments.resource')
const { projectRoleAssignments } = await import('./[userId]/detail/project-roles/project-role-assignments.resource')

beforeEach(() => {
  registerResourceRuntime({
    adapters: resolveFrameworkAdapters(),
    queryClient: createFrameworkQueryClient(),
    fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults),
  })
  assignRole.mockClear()
  revokeRole.mockClear()
  listSystemRoleAssignments.mockClear()
  listProjectRoleAssignmentOptions.mockClear()
  listProjectRoleAssignments.mockClear()
  assignProjectRole.mockClear()
  revokeProjectRole.mockClear()
})

afterEach(() => resetResourceRuntimeForTests())

const createInput = {
  name: 'New user',
  username: 'new-user',
  email: 'new@example.test',
  password: 'password-123',
  imgPhotoUser: null,
  systemRoleIds: ['r1', 'r2'],
}

describe('users resource', () => {
  it('provides detail and update routes', () => {
    const record = {
      id: 'u1',
      name: 'Admin',
      email: 'a@b.c',
      username: 'admin',
      emailVerified: false,
      image: null,
      imgPhotoUser: null,
      statusCode: 'active',
      employeeId: null,
      failedAttemptCount: 0,
      lastLoginAt: null,
      passwordChangedAt: null,
      createdAt: '',
      updatedAt: '',
    }
    expect(users.list().detailRoute?.(record)).toEqual({ name: 'settings-users-detail', params: { userId: 'u1' } })
    expect(users.list().updateRoute?.(record)).toEqual({ name: 'settings-users-edit', params: { userId: 'u1' } })
  })

  it('does not declare unsupported table sorting', () => {
    const listFields = resolveFields({ fields: users.list().fields, surface: 'table', defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
    expect(listFields.find((field) => field.key === 'name')?.sortable).toBeUndefined()
    expect(listFields.find((field) => field.key === 'email')?.sortable).toBeUndefined()
    expect(listFields.find((field) => field.key === 'username')?.sortable).toBeUndefined()
  })

  it('requires unique system roles and normalizes checkbox options to ids', () => {
    const schema = users.create().schema!
    const invalid = schema.validate({ ...createInput, systemRoleIds: [] })
    expect(invalid.success).toBe(false)

    const valid = schema.validate({
      ...createInput,
      systemRoleIds: [
        { id: 'r1', name: 'Admin' },
        { id: 'r2', name: 'Editor' },
      ],
    })
    expect(valid).toMatchObject({ success: true, data: { systemRoleIds: ['r1', 'r2'] } })

    const duplicate = schema.validate({ ...createInput, systemRoleIds: [{ id: 'r1' }, { id: 'r1' }] })
    expect(duplicate.success).toBe(false)
  })

  it('filters the create role source to active system roles and keeps it create-only', () => {
    const createFields = resolveFields({ fields: users.create().fields, surface: 'form', defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
    expect(createFields.find((field) => field.key === 'systemRoleIds')?.props.searchParameters).toEqual({ active: true, realm: 'system' })

    const updateFields = resolveFields({ fields: users.update({ id: 'u1' }).fields, surface: 'form', defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
    expect(updateFields.map((field) => field.key)).not.toContain('systemRoleIds')
  })

  it('keeps password create-only while exposing supported account and status fields on update', () => {
    const surface = users.update({ id: 'u1' })
    const resolved = resolveFields({ fields: surface.fields, surface: 'form', defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })

    expect(resolved.map((field) => field.key)).toEqual(['name', 'username', 'imgPhotoUser', 'statusCode'])
  })

  it('resolves the update status field as a production radio and mounts the edit form', async () => {
    const surface = users.update({ id: 'u1' })
    const resolved = resolveFields({ fields: surface.fields, surface: 'form', defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
    const statusField = resolved.find((field) => field.key === 'statusCode')!

    expect(statusField.renderer).toBe('radio')
    expect(statusField.source).toEqual(appFieldDefaults.fields.statusCode.form?.source)

    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div />' } }] })
    await router.push('/')
    await router.isReady()
    const view = mount(FormView, {
      props: { ...surface, title: 'Edit User' },
      global: {
        plugins: [
          router,
          [
            FrameworkPlugin,
            {
              adapters: resolveFrameworkAdapters(),
              fieldDefaults: appFieldDefaults,
              inputProps: appInputProps,
              queryClient: createFrameworkQueryClient({ retry: 0, staleTime: 0 }),
            },
          ],
        ],
      },
    })
    await flushPromises()
    await vi.waitFor(() => expect(view.findAll('input[type="radio"]')).toHaveLength(2))
    expect(view.text()).toContain('Aktif')
    expect(view.text()).toContain('Nonaktif')
    view.unmount()
  })

  it('creates one account request with all selected system roles', async () => {
    await expect(users.create().run(createInput)).resolves.toEqual({ id: 'u2', name: 'New user' })
  })

  it('has no single-role field', () => {
    expect(resolveFields({ fields: users.list().fields, surface: 'table' }).map((field) => field.key)).not.toContain('roleId')
    expect(resolveFields({ fields: users.update({ id: 'u1' }).fields, surface: 'form' }).map((field) => field.key)).not.toContain('roleId')
  })
})

describe('system role assignments', () => {
  it('exposes the assignment list fields and child route', () => {
    const fields = resolveFields({ fields: systemRoleAssignments.list().fields, surface: 'table' })
    expect(fields.find((field) => field.key === 'roleCode')).toMatchObject({ label: 'Code' })
    expect(fields.find((field) => field.key === 'assigned')).toMatchObject({ label: 'Assigned' })
    expect(systemRoleAssignments.list().detailRoute).toBeUndefined()
  })

  it('loads all system roles with direct assignment state', async () => {
    const action = systemRoleAssignments.list({ searchParameters: { userId: 'u1' } })
    await expect(action.run({ query: {}, searchParameters: action.searchParameters })).resolves.toMatchObject({
      data: [
        { id: 'r1', assigned: true },
        { id: 'r2', assigned: false },
      ],
      meta: { total: 2 },
    })
    expect(listSystemRoleAssignments).toHaveBeenCalledWith({ param: { userId: 'u1' } })
  })

  it('assigns and removes through the system assignment RPC', async () => {
    await expect(systemRoleAssignments.actions.set.run('u1', 'r2', true)).resolves.toMatchObject({ id: 'r2', assigned: true })
    await expect(systemRoleAssignments.actions.set.run('u1', 'r2', false)).resolves.toMatchObject({ id: 'r2', assigned: false })
    expect(assignRole).toHaveBeenCalledWith({ param: { userId: 'u1', roleId: 'r2' } })
    expect(revokeRole).toHaveBeenCalledWith({ param: { userId: 'u1', roleId: 'r2' } })
  })
})

describe('project role assignments', () => {
  it('exposes the assignment list fields', () => {
    const fields = resolveFields({ fields: projectRoleAssignments.list().fields, surface: 'table' })
    expect(fields.find((field) => field.key === 'roleCode')).toMatchObject({ label: 'Code' })
    expect(fields.find((field) => field.key === 'effective')).toMatchObject({ label: 'Assigned' })
  })

  it('loads options, each coverage, and both write methods through the project assignment RPC', async () => {
    await expect(projectRoleAssignments.actions.options.run('u1')).resolves.toEqual({
      divisions: [{ id: 'd1', name: 'Division 1', active: true }],
      projects: [{ id: 'p1', divisionId: 'd1', number: 'P-1', name: 'Project 1', active: true }],
    })
    for (const coverage of [{ coverageType: 'all_projects' }, { coverageType: 'division', divisionId: 'd1' }, { coverageType: 'project', projectId: 'p1' }] as const) {
      const action = projectRoleAssignments.list({ searchParameters: { userId: 'u1', ...coverage } })
      await action.run({ query: {}, searchParameters: action.searchParameters })
    }
    await projectRoleAssignments.actions.set.run('u1', 'r1', { coverageType: 'division', divisionId: 'd1' }, true)
    await projectRoleAssignments.actions.set.run('u1', 'r1', { coverageType: 'project', projectId: 'p1' }, false)

    expect(listProjectRoleAssignmentOptions).toHaveBeenCalledWith({ param: { userId: 'u1' } })
    expect(listProjectRoleAssignments).toHaveBeenNthCalledWith(1, { param: { userId: 'u1' }, query: { coverageType: 'all_projects' } })
    expect(listProjectRoleAssignments).toHaveBeenNthCalledWith(2, { param: { userId: 'u1' }, query: { coverageType: 'division', divisionId: 'd1' } })
    expect(listProjectRoleAssignments).toHaveBeenNthCalledWith(3, { param: { userId: 'u1' }, query: { coverageType: 'project', projectId: 'p1' } })
    expect(assignProjectRole).toHaveBeenCalledWith({ param: { userId: 'u1', roleId: 'r1' }, json: { coverageType: 'division', divisionId: 'd1' } })
    expect(revokeProjectRole).toHaveBeenCalledWith({ param: { userId: 'u1', roleId: 'r1' }, json: { coverageType: 'project', projectId: 'p1' } })
  })
})
