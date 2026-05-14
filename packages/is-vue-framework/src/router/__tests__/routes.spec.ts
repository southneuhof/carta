import { describe, expect, it } from 'vitest'
import type { FrameworkRouteModule, LayoutResolverOptions } from '../types'
import { buildLayoutRoutes } from '../routes'

function createLoader(label: string) {
  return () => Promise.resolve({ default: label })
}

function createLayouts(): LayoutResolverOptions {
  return {
    authenticated: {
      path: '/src/views/authenticated',
      layout: { name: 'AuthenticatedLayout' } as any,
      views: {
        '/src/views/authenticated/dashboard/dashboard/dashboard.vue': createLoader('dashboard'),
        '/src/views/authenticated/settings/users/users.vue': createLoader('users'),
        '/src/views/authenticated/settings/users/_layouts/UsersMappingRole.vue': createLoader('ignored-user-layout'),
        '/src/views/authenticated/settings/roles/roles.vue': createLoader('roles'),
        '/src/views/authenticated/settings/tasks/tasks.vue': createLoader('tasks'),
        '/src/views/authenticated/settings/tasks/detail.vue': createLoader('ignored-non-conforming'),
      },
    },
    unauthenticated: {
      path: '/src/views/unauthenticated',
      layout: { name: 'UnauthenticatedLayout' } as any,
      views: {
        '/src/views/unauthenticated/auth/login/login.vue': createLoader('login'),
      },
    },
  }
}

describe('buildLayoutRoutes', () => {
  it('infers nested layout routes from layout view maps and enriches menu metadata', () => {
    const modules: FrameworkRouteModule[] = [
      {
        name: 'dashboard',
        title: 'Dashboard Module',
        routes: [{ name: 'dashboard', title: 'Dashboard', meta: { permission: 'dashboard.read' } }],
      },
      {
        name: 'settings',
        title: 'Pengaturan',
        routes: [
          { separator: true, name: 'System', title: 'System' },
          { name: 'users', title: 'Users', children: [{ name: 'detail', title: 'Detail' }] },
          { name: 'roles', title: 'Roles', routes: [{ name: 'audit', title: 'Audit' }] },
        ],
      },
    ]

    const routes = buildLayoutRoutes(createLayouts(), { modules })

    expect(routes).toHaveLength(2)
    expect(routes.map((route) => route.path)).toEqual(['/authenticated', '/unauthenticated'])
    expect(routes[0].component).toEqual({ name: 'AuthenticatedLayout' })
    expect(routes[1].component).toEqual({ name: 'UnauthenticatedLayout' })

    const authenticatedChildren = routes[0].children ?? []
    expect(authenticatedChildren.map((route) => route.path)).toEqual(['dashboard/dashboard', 'settings/users', 'settings/roles', 'settings/tasks'])
    expect(authenticatedChildren.map((route) => route.name)).toEqual(['dashboard', 'users', 'roles', 'tasks'])
    expect(authenticatedChildren.some((route) => route.name === 'System')).toBe(false)

    const dashboardRoute = authenticatedChildren.find((route) => route.name === 'dashboard')
    expect(dashboardRoute?.meta).toMatchObject({
      layoutName: 'authenticated',
      moduleName: 'dashboard',
      routeName: 'dashboard',
      title: 'Dashboard',
      module_title: 'Dashboard Module',
      permission: 'dashboard.read',
      pages: null,
    })

    const usersRoute = authenticatedChildren.find((route) => route.name === 'users')
    expect(usersRoute?.meta).toMatchObject({
      layoutName: 'authenticated',
      moduleName: 'settings',
      routeName: 'users',
      title: 'Users',
      module_title: 'Pengaturan',
      children: [{ name: 'detail', title: 'Detail' }],
    })

    const rolesRoute = authenticatedChildren.find((route) => route.name === 'roles')
    expect(rolesRoute?.meta).toMatchObject({
      pages: [{ name: 'audit', title: 'Audit' }],
    })

    const tasksRoute = authenticatedChildren.find((route) => route.name === 'tasks')
    expect(tasksRoute?.meta).toMatchObject({
      layoutName: 'authenticated',
      moduleName: 'settings',
      routeName: 'tasks',
      title: 'Tasks',
      pages: null,
    })

    const unauthenticatedChildren = routes[1].children ?? []
    expect(unauthenticatedChildren).toHaveLength(1)
    expect(unauthenticatedChildren[0]).toMatchObject({
      path: 'auth/login',
      name: 'login',
      meta: {
        layoutName: 'unauthenticated',
        moduleName: 'auth',
        routeName: 'login',
        title: 'Login',
        pages: null,
      },
    })
  })

  it('can omit module title metadata', () => {
    const routes = buildLayoutRoutes(createLayouts(), {
      includeModuleTitleMeta: false,
      modules: [
        {
          name: 'settings',
          title: 'Pengaturan',
          routes: [{ name: 'users', title: 'Users' }],
        },
      ],
    })

    const usersRoute = routes[0].children?.find((route) => route.name === 'users')
    expect(usersRoute?.meta).not.toHaveProperty('module_title')
  })

  it('throws a clear error for duplicate inferred route names', () => {
    expect(() =>
      buildLayoutRoutes({
        authenticated: {
          path: '/src/views/authenticated',
          layout: {} as any,
          views: {
            '/src/views/authenticated/settings/users/users.vue': createLoader('users'),
          },
        },
        public: {
          path: '/src/views/public',
          layout: {} as any,
          views: {
            '/src/views/public/profile/users/users.vue': createLoader('public-users'),
          },
        },
      }),
    ).toThrow('Duplicate inferred route name: users')
  })
})
