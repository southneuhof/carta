import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createBehaviorRuntime, createFrameworkQueryClient, FrameworkPlugin, FormView, registerResourceRuntime, resetResourceRuntimeForTests, resolveFields, resolveFrameworkAdapters, resolveFrameworkFieldDefaults } from '@southneuhof/is-vue-framework'
import { reactive } from 'vue'
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
const listProjectRoleAssignmentOptions = vi.fn(async () => ok({
  data: {
    divisions: [{ id: 'd1', name: 'Division 1', active: true }],
    projects: [{ id: 'p1', divisionId: 'd1', number: 'P-1', name: 'Project 1', active: true }],
  },
}))
const listProjectRoleAssignments = vi.fn(async () => ok({
  data: [{ id: 'r1', roleCode: 'project-admin', name: 'Project Administrator', description: null, active: true, direct: false, effective: false, locked: false, source: null }],
  total: 1,
}))
const assignProjectRole = vi.fn(async () => ok({ data: [{ id: 'r1', roleCode: 'project-admin', name: 'Project Administrator', description: null, active: true, direct: true, effective: true, locked: false, source: null }] }))
const revokeProjectRole = vi.fn(async () => ok({ data: [{ id: 'r1', roleCode: 'project-admin', name: 'Project Administrator', description: null, active: true, direct: false, effective: false, locked: false, source: null }] }))

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
        $get: vi.fn(async () => ok({
          data: [
            { id: 'r1', roleCode: 'admin', name: 'Admin', description: null, realm: 'system', active: true },
            { id: 'r2', roleCode: 'editor', name: 'Editor', description: null, realm: 'system', active: true },
          ],
          total: 2,
          limit: 100,
        })),
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
const { loadSystemRoleAssignments, setSystemRoleAssignment } = await import('./[userId]/detail/system-roles/system-role-assignments.operations')
const { projectRoleAssignments } = await import('./[userId]/detail/project-roles/project-role-assignments.resource')
const { loadProjectRoleAssignmentOptions, loadProjectRoleAssignments, setProjectRoleAssignment } = await import('./[userId]/detail/project-roles/project-role-assignments.operations')

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
    expect(users.table().detailRoute?.(record)).toEqual({ name: 'settings-users-detail', params: { userId: 'u1' } })
    expect(users.table().updateRoute?.(record)).toEqual({ name: 'settings-users-edit', params: { userId: 'u1' } })
  })

  it('does not declare unsupported table sorting', () => {
    const fields = users.table().table.fields as Record<string, { sortable?: boolean }>
    expect(fields.name?.sortable).toBeUndefined()
    expect(fields.email?.sortable).toBeUndefined()
    expect(fields.username?.sortable).toBeUndefined()
  })

  it('requires unique system roles and normalizes checkbox options to ids', () => {
    const schema = users.form({ context: { operation: 'create' } }).schema!
    const invalid = schema.validate({ ...createInput, systemRoleIds: [] })
    expect(invalid.success).toBe(false)

    const valid = schema.validate({
      ...createInput,
      systemRoleIds: [{ id: 'r1', name: 'Admin' }, { id: 'r2', name: 'Editor' }],
    })
    expect(valid).toMatchObject({ success: true, data: { systemRoleIds: ['r1', 'r2'] } })

    const duplicate = schema.validate({ ...createInput, systemRoleIds: [{ id: 'r1' }, { id: 'r1' }] })
    expect(duplicate.success).toBe(false)
  })

  it('filters the create role source to active system roles and keeps it create-only', () => {
    const createFields = users.form({ context: { operation: 'create' } }).fields as Record<string, { form?: { props?: Record<string, unknown> } }>
    expect(createFields.systemRoleIds.form?.props?.searchParameters).toEqual({ active: true, realm: 'system' })

    const updateFields = resolveFields({ fields: users.form({ id: 'u1', context: { operation: 'update' } }).fields, surface: 'form', defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
    const runtime = createBehaviorRuntime({ fields: updateFields as never, draft: reactive({}) as never, context: { operation: 'update' } })
    expect(runtime.visibleKeys.value).not.toContain('systemRoleIds')
  })

  it('keeps password create-only while exposing supported account and status fields on update', () => {
    const surface = users.form({ id: 'u1', context: { operation: 'update' } })
    const resolved = resolveFields({ fields: surface.fields, surface: 'form', defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
    const runtime = createBehaviorRuntime({ fields: resolved as never, draft: reactive({}) as never, context: { operation: 'update' } })

    expect(runtime.visibleKeys.value).toEqual(['name', 'username', 'imgPhotoUser', 'statusCode'])
  })

  it('resolves the update status field as a production radio and mounts the edit form', async () => {
    const surface = users.form({ id: 'u1', context: { operation: 'update' } })
    const resolved = resolveFields({ fields: surface.fields, surface: 'form', defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
    const statusField = resolved.find((field) => field.key === 'statusCode')!

    expect(statusField.renderer).toBe('radio')
    expect(statusField.source).toEqual(appFieldDefaults.fields.statusCode.form?.source)

    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div />' } }] })
    await router.push('/')
    await router.isReady()
    const view = mount(FormView, {
      props: { title: 'Edit User', resource: users, id: 'u1', formOptions: { context: { operation: 'update' } } },
      global: {
        plugins: [
          router,
          [FrameworkPlugin, {
            adapters: resolveFrameworkAdapters(),
            fieldDefaults: appFieldDefaults,
            inputProps: appInputProps,
            queryClient: createFrameworkQueryClient({ retry: 0, staleTime: 0 }),
          }],
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
    await expect(users.capabilities.create!.handler(createInput)).resolves.toEqual({ id: 'u2', name: 'New user' })
  })

  it('has no single-role field', () => {
    expect(users.table().table.fields).not.toHaveProperty('roleId')
    expect(Object.keys(users.form({ id: 'u1', context: { operation: 'update' } }).fields as Record<string, unknown>)).not.toContain('roleId')
  })
})

describe('system role assignments', () => {
  it('uses the view permission and the renamed child route', () => {
    expect(systemRoleAssignments.capabilities.list).toMatchObject({ permission: 'view-system-role-assignments', to: { name: 'settings-users-detail-system-roles' } })
  })

  it('loads all system roles with direct assignment state', async () => {
    await expect(loadSystemRoleAssignments('u1')).resolves.toMatchObject({ data: [{ id: 'r1', assigned: true }, { id: 'r2', assigned: false }], meta: { total: 2 } })
    expect(listSystemRoleAssignments).toHaveBeenCalledWith({ param: { userId: 'u1' } })
  })

  it('assigns and removes through the system assignment RPC', async () => {
    await expect(setSystemRoleAssignment('u1', 'r2', true)).resolves.toMatchObject({ id: 'r2', assigned: true })
    await expect(setSystemRoleAssignment('u1', 'r2', false)).resolves.toMatchObject({ id: 'r2', assigned: false })
    expect(assignRole).toHaveBeenCalledWith({ param: { userId: 'u1', roleId: 'r2' } })
    expect(revokeRole).toHaveBeenCalledWith({ param: { userId: 'u1', roleId: 'r2' } })
  })
})

describe('project role assignments', () => {
  it('uses the view permission and the project coverage child route', () => {
    expect(projectRoleAssignments.capabilities.list).toMatchObject({ permission: 'view-project-role-assignments', to: { name: 'settings-users-detail-project-roles' } })
  })

  it('loads options, each coverage, and both write methods through the project assignment RPC', async () => {
    await expect(loadProjectRoleAssignmentOptions('u1')).resolves.toEqual({
      divisions: [{ id: 'd1', name: 'Division 1', active: true }],
      projects: [{ id: 'p1', divisionId: 'd1', number: 'P-1', name: 'Project 1', active: true }],
    })
    await loadProjectRoleAssignments('u1', { coverageType: 'all_projects' })
    await loadProjectRoleAssignments('u1', { coverageType: 'division', divisionId: 'd1' })
    await loadProjectRoleAssignments('u1', { coverageType: 'project', projectId: 'p1' })
    await setProjectRoleAssignment('u1', 'r1', { coverageType: 'division', divisionId: 'd1' }, true)
    await setProjectRoleAssignment('u1', 'r1', { coverageType: 'project', projectId: 'p1' }, false)

    expect(listProjectRoleAssignmentOptions).toHaveBeenCalledWith({ param: { userId: 'u1' } })
    expect(listProjectRoleAssignments).toHaveBeenNthCalledWith(1, { param: { userId: 'u1' }, query: { coverageType: 'all_projects' } })
    expect(listProjectRoleAssignments).toHaveBeenNthCalledWith(2, { param: { userId: 'u1' }, query: { coverageType: 'division', divisionId: 'd1' } })
    expect(listProjectRoleAssignments).toHaveBeenNthCalledWith(3, { param: { userId: 'u1' }, query: { coverageType: 'project', projectId: 'p1' } })
    expect(assignProjectRole).toHaveBeenCalledWith({ param: { userId: 'u1', roleId: 'r1' }, json: { coverageType: 'division', divisionId: 'd1' } })
    expect(revokeProjectRole).toHaveBeenCalledWith({ param: { userId: 'u1', roleId: 'r1' }, json: { coverageType: 'project', projectId: 'p1' } })
  })
})
