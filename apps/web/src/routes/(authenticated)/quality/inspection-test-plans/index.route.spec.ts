import { describe, expect, it } from 'vitest'
import { projects } from '@/routes/(authenticated)/master-data/projects/projects.resource'
import { projectItpRoute } from './itp.routes'

describe('ITP project entry', () => {
  it('targets the ITP project detail route', () => {
    expect(projectItpRoute({ id: 'project-1' })).toEqual({ name: 'quality-inspection-test-plans-detail', params: { projectId: 'project-1' } })
  })

  it('reuses the existing project list resource', () => {
    expect(projects.list().run).toEqual(expect.any(Function))
    expect(projects.list().fields.length).toBeGreaterThan(0)
  })
})
