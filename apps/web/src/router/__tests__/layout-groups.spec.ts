import { describe, expect, it } from 'vitest'
import { applyFileRouteConventions } from '../file-routing/layout-groups'
import { staticRouteName } from '../file-routing/names'

class Node {
  children: Node[] = []
  components = new Map<string, string>()
  meta: Record<string, unknown> = {}
  name: string | false = false
  path = ''
  deleted = false

  constructor(
    public component?: string,
    children: Node[] = []
  ) {
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

describe('mechanical file route names', () => {
  it('omits groups, indexes, and dynamic segments', () => {
    const root = { value: { rawSegment: '(authenticated)' } } as any
    const roles = { value: { rawSegment: 'roles' }, parent: { value: { rawSegment: 'settings' }, parent: root } } as any
    const detail = { value: { rawSegment: 'detail' }, parent: { value: { rawSegment: '[roleId]' }, parent: roles } } as any
    expect(staticRouteName(detail)).toBe('settings-roles-detail')
  })
})

describe('route-group layouts', () => {
  it('requires authentication for an authenticated group without layout metadata', () => {
    const layout = new Node('/project/src/routes/(authenticated)/authenticated.layout.vue')
    const group = new Node(undefined, [layout])

    applyFileRouteConventions(group as any, false)

    expect(group.meta).toEqual({ requiresAuth: true })
  })

  it('does not require authentication for a public group', () => {
    const layout = new Node('/project/src/routes/(public)/public.layout.vue')
    const group = new Node(undefined, [layout])

    applyFileRouteConventions(group as any, false)

    expect(group.meta).toEqual({})
  })

  it('preserves layout metadata and makes the authenticated rule win', () => {
    const layout = new Node('/project/src/routes/(authenticated)/authenticated.layout.vue')
    layout.meta = { title: 'Authenticated', requiresAuth: false }
    const group = new Node(undefined, [layout])

    applyFileRouteConventions(group as any, false)

    expect(group.meta).toEqual({ title: 'Authenticated', requiresAuth: true })
  })

  it('promotes the layout and deletes an empty original node', () => {
    const layout = new Node('/project/src/routes/(authenticated)/authenticated.layout.vue')
    const page = new Node('/project/src/routes/(authenticated)/dashboard/index.route.vue')
    const group = new Node(undefined, [layout, page])

    applyFileRouteConventions(group as any, false)

    expect(group.components.get('default')).toBe(layout.component)
    expect(layout.deleted).toBe(true)
    expect(page.deleted).toBe(false)
  })
})
