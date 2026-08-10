import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { appFieldDefaults } from '@/configs/defaults'
import { createFrameworkQueryClient, registerResourceRuntime, resetResourceRuntimeForTests, resolveFrameworkAdapters, resolveFrameworkFieldDefaults } from '@southneuhof/is-vue-framework'
import { projectVendors } from './project-vendors.resource'

beforeEach(() => {
  const adapters = resolveFrameworkAdapters()
  registerResourceRuntime({ adapters: { ...adapters, access: { allows: () => true } }, queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) })
})
afterEach(() => resetResourceRuntimeForTests())

describe('project vendors resource', () => {
  it('renders only the vendor name in the scoped form', () => {
    expect(Object.keys(projectVendors('project-1').form().fields)).toEqual(['name'])
  })

  it('keeps the route project in create and update initial data', () => {
    const resource = projectVendors('project-1')
    expect(resource.form({ initialData: { projectId: 'project-1' } }).initialData).toEqual({ projectId: 'project-1' })
    expect(resource.form({ id: 'vendor-1', initialData: { projectId: 'project-1' } }).initialData).toEqual({ projectId: 'project-1' })
  })

  it('scopes every navigable CRUD route to the project', () => {
    const resource = projectVendors('project-1')
    expect(resource.capabilities.list?.to).toEqual({ name: 'master-data-projects-detail-vendors', params: { projectId: 'project-1' } })
    expect(resource.capabilities.create?.to).toEqual({ name: 'master-data-projects-detail-vendors-create', params: { projectId: 'project-1' } })
    expect(resource.capabilities.detail?.to?.params?.('vendor-1')).toEqual({ projectId: 'project-1', projectVendorId: 'vendor-1' })
    expect(resource.capabilities.update?.to?.params?.('vendor-1')).toEqual({ projectId: 'project-1', projectVendorId: 'vendor-1' })
  })

  it('exposes the create route to ListView', () => {
    expect(projectVendors('project-1').table().createRoute).toEqual({ name: 'master-data-projects-detail-vendors-create', params: { projectId: 'project-1' } })
  })
})
