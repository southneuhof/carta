import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { FrameworkPlugin, createFrameworkQueryClient, resetResourceRuntimeForTests } from '@southneuhof/is-vue-framework'
import { appFieldDefaults } from '@/configs/defaults'
import { appFieldRenderers } from '@/framework/fields/renderers'
import { appInputProps } from '@/framework/inputs/registry'

const mocks = vi.hoisted(() => ({
  projectsList: vi.fn(),
  qualityInspectionsList: vi.fn(),
  schedulesList: vi.fn(),
}))

vi.mock('@/framework/rpc', () => ({
  apiUrl: 'http://localhost:3000/',
  rpc: {
    projects: { list: { $get: mocks.projectsList } },
    'quality-inspection': {
      list: { $get: mocks.qualityInspectionsList },
      schedules: { list: { $get: mocks.schedulesList } },
    },
  },
}))

const Screen = (await import('./index.route.vue')).default

const ok = (payload: unknown) => ({ ok: true, json: async () => payload })
const listRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'qi-1',
  number: 'QI-001',
  projectId: 'project-1',
  projectName: 'Project',
  targetDate: '2026-08-20',
  workItemCategoryName: 'Root work item',
  createdByName: 'Inspector',
  createdByPhoto: null,
  createdAt: '2026-08-19T08:00:00.000Z',
  locationZone: 'Zone A',
  statusCode: 'open',
  stepCode: 'report',
  documentations: [
    { name: 'sudut 1', fileAttachment: 'uploads/one.jpg' },
    { name: 'sudut 2', fileAttachment: 'uploads/two.jpg' },
    { name: 'sudut 3', fileAttachment: 'uploads/three.jpg' },
    { name: 'sudut 4', fileAttachment: 'uploads/four.jpg' },
  ],
  allowedOperations: ['detail', 'update', 'delete'],
  ...overrides,
})

async function flush(times = 8) {
  for (let attempt = 0; attempt < times; attempt += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

async function mountScreen() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'quality-quality-inspection', component: Screen },
      { path: '/create', name: 'quality-quality-inspection-create', component: { template: '<div />' } },
      { path: '/schedules', name: 'quality-quality-inspection-schedules', component: { template: '<div />' } },
      { path: '/:qualityInspectionId', name: 'quality-quality-inspection-detail', component: { template: '<div />' } },
      { path: '/:qualityInspectionId/edit', name: 'quality-quality-inspection-edit', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  await router.isReady()
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(defineComponent(() => () => h(Screen)))
  app.use(router)
  app.use(FrameworkPlugin, {
    queryClient: createFrameworkQueryClient({ retry: 0, staleTime: 0 }),
    fieldDefaults: appFieldDefaults,
    renderers: appFieldRenderers,
    inputProps: appInputProps,
  })
  app.mount(host)
  await flush()
  return {
    host,
    unmount: () => {
      app.unmount()
      host.remove()
    },
  }
}

function hasButton(host: HTMLElement, label: string) {
  return Array.from(host.querySelectorAll('button')).some((button) => button.textContent?.includes(label))
}

function lastListQuery() {
  const call = mocks.qualityInspectionsList.mock.calls.at(-1)?.[0] as { query?: Record<string, string> } | undefined
  return call?.query ?? {}
}

function clickChip(host: HTMLElement, label: string) {
  const chip = Array.from(host.querySelectorAll<HTMLElement>('.cursor-pointer')).find((item) => item.textContent?.trim() === label)
  expect(chip).toBeTruthy()
  chip?.click()
}

function clickButton(host: HTMLElement, label: string) {
  const button = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find((item) => item.textContent?.includes(label))
  expect(button).toBeTruthy()
  button?.click()
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.qualityInspectionsList.mockResolvedValue(ok({ data: [listRecord()], total: 1 }))
  mocks.schedulesList.mockResolvedValue(ok({ data: [] }))
})

afterEach(() => resetResourceRuntimeForTests())

describe('Inspection/Test entry controls', () => {
  it('shows manual and scheduled entries when the owner list returns a permitted project', async () => {
    mocks.projectsList.mockResolvedValue(ok({ data: [{ id: 'project-1', name: 'Project' }], total: 1 }))
    const view = await mountScreen()

    expect(hasButton(view.host, 'Create')).toBe(true)
    expect(hasButton(view.host, 'Jadwal Inspection/Test')).toBe(true)
    expect(mocks.projectsList).toHaveBeenCalledWith({ query: { permission: 'create-quality-inspection', active: 'true' } }, expect.anything())
    view.unmount()
  })

  it('hides both creation entries when the owner list is empty', async () => {
    mocks.projectsList.mockResolvedValue(ok({ data: [], total: 0 }))
    const view = await mountScreen()

    expect(hasButton(view.host, 'Create')).toBe(false)
    expect(hasButton(view.host, 'Jadwal Inspection/Test')).toBe(false)
    view.unmount()
  })
})

describe('Inspection/Test list surface', () => {
  it('applies status and month filters to the one collection query', async () => {
    const view = await mountScreen()
    expect(lastListQuery()).toMatchObject({ statusCode: 'open' })

    clickChip(view.host, 'On Progress')
    await flush()
    expect(lastListQuery()).toMatchObject({ statusCode: 'on-progress', page: '1' })

    view.host.querySelector<HTMLButtonElement>('[aria-label="Filter"]')?.click()
    await flush()
    await vi.dynamicImportSettled()
    await flush()
    const startMonth = document.querySelector<HTMLInputElement>('#field-startMonth')
    const endMonth = document.querySelector<HTMLInputElement>('#field-endMonth')
    expect(startMonth).not.toBeNull()
    expect(endMonth).not.toBeNull()
    view.unmount()
  })

  it('switches table and cards without loading a second collection', async () => {
    const view = await mountScreen()
    const initialCalls = mocks.qualityInspectionsList.mock.calls.length
    clickButton(view.host, 'Kartu')
    await flush()

    expect(view.host.textContent).toContain('QI-001')
    expect(view.host.textContent).toContain('Inspector')
    expect(view.host.textContent).toContain('Root work item')
    expect(view.host.textContent).not.toContain('Dokumentasi belum dilengkapi')
    expect(mocks.qualityInspectionsList.mock.calls.length).toBe(initialCalls)

    clickButton(view.host, 'Tabel')
    await flush()
    expect(view.host.querySelector('table')).not.toBeNull()
    view.unmount()
  })

  it('shows the legacy empty documentation message in the card', async () => {
    mocks.qualityInspectionsList.mockResolvedValue(ok({ data: [listRecord({ documentations: [] })], total: 1 }))
    const view = await mountScreen()
    clickButton(view.host, 'Kartu')
    await flush()

    expect(view.host.textContent).toContain('Dokumentasi belum dilengkapi')
    view.unmount()
  })

  it('uses server operations for table and card delete buttons', async () => {
    const permitted = await mountScreen()
    expect(permitted.host.querySelector('[aria-label="Delete"]')).not.toBeNull()

    clickButton(permitted.host, 'Kartu')
    await flush()
    const cardDelete = permitted.host.querySelector<HTMLButtonElement>('[aria-label="Hapus laporan"]')
    expect(cardDelete).not.toBeNull()
    cardDelete?.click()
    await flush()
    expect(document.body.textContent).toContain('Hapus laporan?')
    expect(document.body.textContent).toContain('Tindakan ini tidak dapat dibatalkan.')
    permitted.unmount()

    mocks.qualityInspectionsList.mockResolvedValue(ok({ data: [listRecord({ allowedOperations: ['detail'] })], total: 1 }))
    const denied = await mountScreen()
    expect(denied.host.querySelector('[aria-label="Delete"]')).toBeNull()

    clickButton(denied.host, 'Kartu')
    await flush()
    expect(denied.host.querySelector('[aria-label="Hapus laporan"]')).toBeNull()
    denied.unmount()
  })
})
