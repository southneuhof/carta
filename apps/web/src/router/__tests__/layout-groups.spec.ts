import { describe, expect, it } from 'vitest'
import { applyRouteGroupLayouts } from '../file-routing/layout-groups'

class Node {
  children: Node[] = []
  components = new Map<string, string>()
  meta: Record<string, unknown> = {}
  name: string | false = false
  path = ''
  deleted = false

  constructor(public component?: string, children: Node[] = []) {
    this.children = children
    if (component) {
      this.components.set('default', component)
      this.path = component
        .split('/')
        .at(-1)!
        .replace(/\.(?:route|layout)\.vue$/, '')
    }
  }

  delete() {
    this.deleted = true
  }
}

describe('route-group layouts', () => {
  it('promotes a direct layout onto its group and keeps nested pages', () => {
    const layout = new Node('/project/src/routes/(authenticated)/authenticated.layout.vue')
    layout.meta = { requiresAuth: true }
    layout.name = 'authenticated-layout'
    const page = new Node('/project/src/routes/(authenticated)/dashboard/index.route.vue')
    const group = new Node(undefined, [layout, page])

    applyRouteGroupLayouts(group as any)

    expect(group.component).toBeUndefined()
    expect(group.components.get('default')).toBe(layout.component)
    expect(group.meta).toEqual({ requiresAuth: true })
    expect(group.name).toBe('authenticated-layout')
    expect(layout.deleted).toBe(true)
    expect(page.deleted).toBe(false)
  })

  it('rejects layouts outside parenthesized groups', () => {
    const root = new Node(undefined, [new Node('/project/src/routes/admin/admin.layout.vue')])
    expect(() => applyRouteGroupLayouts(root as any)).toThrow(/parenthesized route group/)
  })

  it('rejects multiple direct layouts in one group', () => {
    const root = new Node(undefined, [new Node('/project/src/routes/(admin)/one.layout.vue'), new Node('/project/src/routes/(admin)/two.layout.vue')])
    expect(() => applyRouteGroupLayouts(root as any)).toThrow(/multiple direct/)
  })

  it('coalesces duplicate watcher entries for the same layout file', () => {
    const component = '/project/src/routes/(admin)/admin.layout.vue'
    const staleLayout = new Node(component)
    staleLayout.meta = { revision: 'stale' }
    const currentLayout = new Node(component)
    currentLayout.meta = { revision: 'current' }
    const root = new Node(undefined, [staleLayout, currentLayout])

    expect(() => applyRouteGroupLayouts(root as any)).not.toThrow()
    expect(root.components.get('default')).toBe(component)
    expect(root.meta).toEqual({ revision: 'current' })
    expect(staleLayout.deleted).toBe(true)
    expect(currentLayout.deleted).toBe(true)
  })

  it('does not reclassify promoted groups when the hook runs again', () => {
    const authenticated = new Node(undefined, [new Node('/project/src/routes/(authenticated)/authenticated.layout.vue')])
    const publicGroup = new Node(undefined, [new Node('/project/src/routes/(public)/public.layout.vue')])
    const root = new Node(undefined, [authenticated, publicGroup])

    applyRouteGroupLayouts(root as any)

    expect(() => applyRouteGroupLayouts(root as any)).not.toThrow()
    expect(authenticated.components.get('default')).toMatch(/authenticated\.layout\.vue$/)
    expect(publicGroup.components.get('default')).toMatch(/public\.layout\.vue$/)
  })

  it('composes nested group layouts parent to child', () => {
    const outerLayout = new Node('/project/src/routes/(app)/app.layout.vue')
    const innerLayout = new Node('/project/src/routes/(app)/(settings)/settings.layout.vue')
    const innerGroup = new Node(undefined, [innerLayout])
    const outerGroup = new Node(undefined, [outerLayout, innerGroup])

    applyRouteGroupLayouts(outerGroup as any)

    expect(outerGroup.components.get('default')).toBe(outerLayout.component)
    expect(innerGroup.components.get('default')).toBe(innerLayout.component)
  })

  it('ignores ordinary colocated files and groups without layouts', () => {
    const root = new Node(undefined, [new Node('/project/src/routes/(admin)/Widget.vue')])
    expect(() => applyRouteGroupLayouts(root as any)).not.toThrow()
    expect(root.components.size).toBe(0)
  })
})
