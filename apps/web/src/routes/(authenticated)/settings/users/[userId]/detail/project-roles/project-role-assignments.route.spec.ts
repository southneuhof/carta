import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { FrameworkPlugin, createFrameworkQueryClient, resetResourceRuntimeForTests, resolveFrameworkAdapters } from '@southneuhof/is-vue-framework'
import { createRouteQueryAdapter } from '@/framework/adapters/query/routeQuery'
import { appInputProps } from '@/framework/inputs/registry'

const mocks = vi.hoisted(() => ({
  loadOptions: vi.fn(),
  loadRows: vi.fn(),
  set: vi.fn(),
  toastError: vi.fn(),
  rows: [] as any[],
  resolveSet: (() => undefined) as () => void,
}))

vi.mock('./project-role-assignments.actions', () => ({
  projectRoleAssignmentsActions: {
    options: (userId: string) => mocks.loadOptions(userId),
    list: ({ searchParameters }: { searchParameters: Record<string, unknown> }) => {
      const coverage =
        searchParameters.coverageType === 'division'
          ? { coverageType: 'division', divisionId: searchParameters.divisionId }
          : searchParameters.coverageType === 'project'
          ? { coverageType: 'project', projectId: searchParameters.projectId }
          : { coverageType: 'all_projects' }
      return mocks.loadRows(String(searchParameters.userId ?? ''), coverage)
    },
    set: mocks.set,
  },
}))
vi.mock('@/stores/permissions', () => ({ permissions: () => ({ has: () => true }) }))
vi.mock('vue-sonner', () => ({ toast: { error: mocks.toastError } }))

const ProjectRolesRoute = (await import('./index.route.vue')).default

const options = {
  divisions: [
    { id: 'd1', name: 'Division 1', active: true },
    { id: 'd2', name: 'Division 2', active: false },
  ],
  projects: [
    { id: 'p1', divisionId: 'd1', number: 'P-1', name: 'Project 1', active: true },
    { id: 'p2', divisionId: 'd2', number: 'P-2', name: 'Project 2', active: false },
  ],
}

const baseRows = [
  { id: 'r1', roleCode: 'project-admin', name: 'Project Administrator', description: 'Manage projects', active: true, direct: true, effective: true, locked: false, source: null },
  {
    id: 'r2',
    roleCode: 'project-auditor',
    name: 'Project Auditor',
    description: 'Read projects',
    active: true,
    direct: false,
    effective: true,
    locked: true,
    source: { coverageType: 'all_projects', divisionId: null, projectId: null, divisionName: undefined, label: 'Assigned for All Projects' },
  },
  { id: 'r3', roleCode: 'project-reader', name: 'Project Reader', description: null, active: true, direct: false, effective: false, locked: false, source: null },
  { id: 'r4', roleCode: 'legacy-project', name: 'Legacy Project', description: 'Cleanup only', active: false, direct: true, effective: true, locked: false, source: null },
]

async function flush(times = 8) {
  for (let attempt = 0; attempt < times; attempt += 1) {
    await Promise.resolve()
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

function exactText(host: HTMLElement, text: string) {
  const element = Array.from(host.ownerDocument.body.querySelectorAll<HTMLElement>('*')).find((candidate) => candidate.children.length === 0 && candidate.textContent?.trim() === text)
  if (!element) throw new Error(`Could not find visible text "${text}". Body: ${host.ownerDocument.body.textContent} Field: ${host.querySelector('#field-divisionId')?.outerHTML}`)
  return element
}

async function mountRoute(path = '/settings/users/u1/detail/project-roles') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/settings/users/:userId/detail/project-roles', name: 'settings-users-detail-project-roles', component: ProjectRolesRoute }],
  })
  await router.push(path)
  await router.isReady()
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(defineComponent(() => () => h(ProjectRolesRoute)))
  app.use(router)
  app.use(FrameworkPlugin, {
    adapters: resolveFrameworkAdapters({ query: createRouteQueryAdapter(router) }),
    inputProps: appInputProps,
    queryClient: createFrameworkQueryClient({ retry: 0, staleTime: 0 }),
  })
  app.directive('tippy', {})
  app.mount(host)
  await flush()

  return {
    host,
    router,
    filter: (name: 'division' | 'project') => host.querySelector<HTMLElement>(`#field-${name === 'division' ? 'divisionId' : 'projectId'}`)!,
    chooseFilter: async (name: 'division' | 'project', label: string) => {
      const field = host.querySelector<HTMLElement>(`#field-${name === 'division' ? 'divisionId' : 'projectId'}`)!
      field.querySelector<HTMLElement>('p')!.click()
      await nextTick()
      exactText(host, label).click()
    },
    switchRoot: (id: string) => host.querySelector<HTMLElement>(`[data-role="${id}"]`)!,
    switchButton: (id: string) => host.querySelector<HTMLButtonElement>(`[data-role="${id}"] button`)!,
    unmount: () => {
      app.unmount()
      host.remove()
    },
  }
}

beforeEach(() => {
  mocks.loadOptions.mockReset()
  mocks.loadRows.mockReset()
  mocks.set.mockReset()
  mocks.toastError.mockReset()
  mocks.rows = baseRows.map((row) => ({ ...row }))
  mocks.loadOptions.mockResolvedValue(options)
  mocks.loadRows.mockImplementation(async () => ({ data: mocks.rows.map((row) => ({ ...row })), meta: { total: mocks.rows.length } }))
  mocks.set.mockImplementation(async (_userId: string, roleId: string, _coverage: unknown, assigned: boolean) => {
    const row = mocks.rows.find((item) => item.id === roleId)
    if (row) {
      row.direct = assigned
      row.effective = assigned
    }
    return mocks.rows.map((item) => ({ ...item }))
  })
})

afterEach(() => {
  resetResourceRuntimeForTests()
})

describe('project role assignment screen', () => {
  it('maps All, division, and project filters and preserves valid URL state', async () => {
    const view = await mountRoute('/settings/users/u1/detail/project-roles?tab=profile')

    expect(view.filter('division').textContent).toContain('All Divisions')
    expect(view.filter('project').textContent).toContain('All Projects')
    expect(mocks.loadRows.mock.calls.at(-1)?.[1]).toEqual({ coverageType: 'all_projects' })

    await view.chooseFilter('division', 'Division 1')
    await flush()
    expect(view.router.currentRoute.value.query).toMatchObject({ tab: 'profile', 'project-roles.divisionId': 'd1' })
    expect(view.router.currentRoute.value.query).not.toHaveProperty('project-roles.projectId')
    expect(mocks.loadRows.mock.calls.at(-1)?.[1]).toEqual({ coverageType: 'division', divisionId: 'd1' })

    await view.chooseFilter('project', 'P-1 — Project 1')
    await flush()
    expect(mocks.loadRows.mock.calls.at(-1)?.[1]).toEqual({ coverageType: 'project', projectId: 'p1' })

    await view.chooseFilter('division', 'Division 2 (Inactive)')
    await flush()
    expect(view.filter('project').textContent).toContain('All Projects')
    expect(view.router.currentRoute.value.query).toMatchObject({ 'project-roles.divisionId': 'd2' })
    expect(view.router.currentRoute.value.query).not.toHaveProperty('project-roles.projectId')
    expect(mocks.loadRows.mock.calls.at(-1)?.[1]).toEqual({ coverageType: 'division', divisionId: 'd2' })
    view.unmount()
  })

  it('uses All values for invalid URL IDs without rewriting unrelated query state', async () => {
    const view = await mountRoute('/settings/users/u1/detail/project-roles?tab=profile&project-roles.divisionId=missing&project-roles.projectId=missing')

    expect(view.filter('division').textContent).toContain('All Divisions')
    expect(view.filter('project').textContent).toContain('All Projects')
    expect(view.router.currentRoute.value.query).toMatchObject({
      tab: 'profile',
      'project-roles.divisionId': 'missing',
      'project-roles.projectId': 'missing',
    })
    expect(mocks.loadRows.mock.calls.at(-1)?.[1]).toEqual({ coverageType: 'all_projects' })
    view.unmount()
  })

  it('restores valid URL filters after a reload', async () => {
    const view = await mountRoute('/settings/users/u1/detail/project-roles?project-roles.divisionId=d1&project-roles.projectId=p1')

    expect(view.filter('division').textContent).toContain('Division 1')
    expect(view.filter('project').textContent).toContain('P-1 — Project 1')
    expect(mocks.loadRows.mock.calls.at(-1)?.[1]).toEqual({ coverageType: 'project', projectId: 'p1' })
    view.unmount()
  })

  it('renders server states and keeps a broad assignment focusable and read-only', async () => {
    const view = await mountRoute()
    const direct = view.switchRoot('r1')
    const broad = view.switchRoot('r2')
    const empty = view.switchRoot('r3')

    expect(direct.getAttribute('aria-checked')).toBe('true')
    expect(view.switchButton('r1').disabled).toBe(false)
    expect(broad.getAttribute('aria-checked')).toBe('true')
    expect(view.switchButton('r2').disabled).toBe(false)
    expect(broad.getAttribute('aria-disabled')).toBe('true')
    expect(broad.getAttribute('aria-describedby')).toBe('project-role-source-r2')
    expect(view.host.querySelector('#project-role-source-r2')?.textContent).toBe('Assigned for All Projects')
    expect(empty.getAttribute('aria-checked')).toBe('false')
    view.switchButton('r2').click()
    view.switchButton('r2').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    view.switchButton('r2').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    await flush()
    expect(mocks.set).not.toHaveBeenCalled()
    view.unmount()
  })

  it('writes one direct row, reloads server state, and keeps only that row pending', async () => {
    const view = await mountRoute('/settings/users/u1/detail/project-roles?project-roles.projectId=p1')

    view.switchButton('r1').click()
    await flush()
    expect(mocks.set).toHaveBeenCalledWith('u1', 'r1', { coverageType: 'project', projectId: 'p1' }, false)
    expect(view.switchRoot('r1').getAttribute('aria-checked')).toBe('false')
    expect(view.switchButton('r3').disabled).toBe(false)
    view.unmount()
  })

  it('keeps the prior state while pending and restores it after an error', async () => {
    mocks.set.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          mocks.resolveSet = () => {
            mocks.rows[2].direct = true
            mocks.rows[2].effective = true
            resolve(mocks.rows.map((item) => ({ ...item })))
          }
        })
    )
    const view = await mountRoute()

    view.switchButton('r3').click()
    view.switchButton('r3').click()
    await nextTick()
    expect(mocks.set).toHaveBeenCalledOnce()
    expect(view.switchRoot('r3').getAttribute('aria-checked')).toBe('false')
    expect(view.switchButton('r3').disabled).toBe(true)
    expect(view.switchButton('r1').disabled).toBe(false)

    mocks.resolveSet()
    await flush()
    expect(view.switchRoot('r3').getAttribute('aria-checked')).toBe('true')

    mocks.set.mockRejectedValueOnce({ message: 'Update denied.' })
    view.switchButton('r3').click()
    await flush()
    expect(view.switchRoot('r3').getAttribute('aria-checked')).toBe('true')
    expect(mocks.toastError).toHaveBeenCalledWith('Update denied.')
    view.unmount()
  })

  it('reloads after a coverage conflict and shows the server lock state', async () => {
    mocks.set.mockImplementationOnce(async () => {
      mocks.rows = mocks.rows.map((row) =>
        row.id === 'r3'
          ? { ...row, effective: true, locked: true, source: { coverageType: 'all_projects', divisionId: null, projectId: null, divisionName: undefined, label: 'Assigned for All Projects' } }
          : row
      )
      throw { error: 'assignment_already_covered', message: 'Assignment is already covered.' }
    })
    const view = await mountRoute()

    view.switchButton('r3').click()
    await flush()
    expect(view.switchRoot('r3').getAttribute('aria-checked')).toBe('true')
    expect(view.switchRoot('r3').getAttribute('aria-disabled')).toBe('true')
    expect(mocks.toastError).toHaveBeenCalledWith('Assignment is already covered.')
    view.unmount()
  })

  it('removes an inactive direct role at its exact source and adopts the server response', async () => {
    mocks.set.mockImplementationOnce(async (_userId: string, roleId: string, coverage: unknown, assigned: boolean) => {
      expect(roleId).toBe('r4')
      expect(coverage).toEqual({ coverageType: 'project', projectId: 'p1' })
      expect(assigned).toBe(false)
      mocks.rows = mocks.rows.filter((row) => row.id !== 'r4')
      return mocks.rows.map((row) => ({ ...row }))
    })
    const view = await mountRoute('/settings/users/u1/detail/project-roles?project-roles.projectId=p1')

    expect(view.switchRoot('r4').getAttribute('aria-checked')).toBe('true')
    expect(view.switchButton('r4').disabled).toBe(false)
    view.switchButton('r4').click()
    await flush()
    expect(mocks.set).toHaveBeenCalledWith('u1', 'r4', { coverageType: 'project', projectId: 'p1' }, false)
    expect(view.host.querySelector('[data-role="r4"]')).toBeNull()
    expect(mocks.set.mock.calls.some((call) => call[1] === 'r4' && call[3] === true)).toBe(false)
    view.unmount()
  })
})
