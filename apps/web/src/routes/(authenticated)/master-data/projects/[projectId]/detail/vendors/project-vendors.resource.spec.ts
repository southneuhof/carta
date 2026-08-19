import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { appFieldDefaults } from '@/configs/defaults'
import {
  createFrameworkQueryClient,
  registerResourceRuntime,
  resetResourceRuntimeForTests,
  resolveFields,
  resolveFrameworkAdapters,
  resolveFrameworkFieldDefaults,
} from '@southneuhof/is-vue-framework'

const mocks = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn(), detail: vi.fn(), update: vi.fn(), delete: vi.fn() }))
vi.mock('@/framework/rpc', () => ({
  rpc: {
    'project-vendors': {
      list: { $get: mocks.list },
      detail: { ':id': { $get: mocks.detail } },
      create: { $post: mocks.create },
      update: { ':id': { $patch: mocks.update } },
      delete: { ':id': { $delete: mocks.delete } },
    },
  },
}))

const { projectVendors } = await import('./project-vendors.resource')

const ok = (payload: unknown) => ({ ok: true, json: async () => payload })

let queryClient: ReturnType<typeof createFrameworkQueryClient>

beforeEach(() => {
  const adapters = resolveFrameworkAdapters()
  queryClient = createFrameworkQueryClient()
  registerResourceRuntime({ adapters: { ...adapters, access: { allows: () => true } }, queryClient, fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) })
  mocks.list.mockResolvedValue(ok({ data: [], total: 0 }))
  mocks.create.mockResolvedValue(ok({ data: { id: 'vendor-1', name: 'Vendor' } }))
})
afterEach(() => resetResourceRuntimeForTests())

describe('project vendors resource', () => {
  it('renders only the vendor name in the scoped form', () => {
    expect(resolveFields({ fields: projectVendors('project-1').create().fields, surface: 'form' }).map((field) => field.key)).toEqual(['name'])
  })

  it('keeps project scope in list requests and form data', async () => {
    const resource = projectVendors('project-1')
    expect(resource.create().initialData).toEqual({ projectId: 'project-1' })
    expect((resource.update({ id: 'vendor-1', initialData: { projectId: 'project-1' } }) as unknown as { initialData?: unknown }).initialData).toEqual({ projectId: 'project-1' })
    await resource.list().run({ query: {}, searchParameters: {} })
    expect(mocks.list).toHaveBeenCalledWith({ query: { projectId: 'project-1' } }, expect.anything())
  })

  it('scopes every navigable CRUD route to the project', () => {
    const resource = projectVendors('project-1')
    expect(resource.list().createRoute).toEqual({ name: 'master-data-projects-detail-vendors-create', params: { projectId: 'project-1' } })
    expect(resource.list().detailRoute?.({ id: 'vendor-1' } as never)).toEqual({ name: 'master-data-projects-detail-vendors-detail', params: { projectId: 'project-1', projectVendorId: 'vendor-1' } })
    expect(resource.list().updateRoute?.({ id: 'vendor-1' } as never)).toEqual({ name: 'master-data-projects-detail-vendors-edit', params: { projectId: 'project-1', projectVendorId: 'vendor-1' } })
  })

  it('invalidates the scoped collection after create', async () => {
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    await projectVendors('project-1')
      .create()
      .run({ name: 'Vendor', projectId: 'project-1' } as never)
    expect(invalidate).toHaveBeenCalled()
  })
})
