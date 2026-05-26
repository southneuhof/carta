import { describe, expect, it } from 'vitest'
import { createRouter, createWebHashHistory } from 'vue-router'
import { buildLayoutRoutes } from '@southneuhof/is-vue-framework/router'
import type { FrameworkRouteModule } from '@southneuhof/is-vue-framework/router'
import menu from '@/menu'

const expectedAuthenticatedRoutes = [
  { name: 'dashboard', path: '/authenticated/dashboard/dashboard' },
  { name: 'website', path: '/authenticated/website/website' },
  { name: 'articleCategory', path: '/authenticated/article/articleCategory' },
  { name: 'article', path: '/authenticated/article/article' },
  { name: 'productCategory', path: '/authenticated/master/productCategory' },
  { name: 'product', path: '/authenticated/master/product' },
  { name: 'jobCategory', path: '/authenticated/careers/jobCategory' },
  { name: 'job', path: '/authenticated/careers/job' },
  { name: 'user', path: '/authenticated/user/user' },
  { name: 'role', path: '/authenticated/user/role' },
  { name: 'roleGroup', path: '/authenticated/user/roleGroup' },
  { name: 'permission', path: '/authenticated/user/permission' },
  { name: 'collection', path: '/authenticated/collection/collection' },
  { name: 'formType', path: '/authenticated/form/formType' },
  { name: 'formSubmission', path: '/authenticated/form/formSubmission' },
  { name: 'companyProfile', path: '/authenticated/companyProfile/companyProfile' },
]

const authenticatedViews = Object.fromEntries(
  expectedAuthenticatedRoutes.map(({ name, path }) => [`/src/views${path}/${name}.vue`, () => Promise.resolve({})]),
)

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    ...buildLayoutRoutes(
      {
        authenticated: {
          path: '/src/views/authenticated',
          layout: { name: 'AuthenticatedLayout' } as any,
          views: authenticatedViews,
        },
        unauthenticated: {
          path: '/src/views/unauthenticated',
          layout: { name: 'UnauthenticatedLayout' } as any,
          views: {
            '/src/views/unauthenticated/auth/login/login.vue': () => Promise.resolve({}),
          },
        },
      },
      {
        modules: menu as unknown as FrameworkRouteModule[],
      },
    ),
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: { name: 'NotFound' },
    },
  ],
})

describe('router routes', () => {
  it('generates all non-calculator authenticated routes', () => {
    for (const route of expectedAuthenticatedRoutes) {
      const resolved = router.resolve(route.path)
      expect(resolved.name).toBe(route.name)
      expect(router.resolve({ name: route.name }).path).toBe(route.path)
    }
  })

  it('does not generate calculator routes', () => {
    expect(router.hasRoute('calculatorType')).toBe(false)
    expect(router.resolve('/authenticated/calculatorType/calculatorType').name).toBe('not-found')
  })

  it('adds framework route metadata for generated routes', () => {
    const route = router.getRoutes().find((item) => item.name === 'website')
    expect(route).toBeTruthy()
    expect(route?.meta.layoutName).toBe('authenticated')
    expect(route?.meta.moduleName).toBe('website')
    expect(route?.meta.routeName).toBe('website')
    expect(route?.meta.title).toBe('Website')
    expect(route?.meta.module_title).toBe('Website')
  })

  it('does not introduce duplicate generated route names', () => {
    const generatedNames = router
      .getRoutes()
      .map((route) => route.name)
      .filter((name): name is string => typeof name === 'string' && name !== 'not-found')

    expect(new Set(generatedNames).size).toBe(generatedNames.length)
  })
})
