/**
 * Characterization tests for the legacy public surface.
 *
 * They keep non-migrated screens honest while the migration runs: every export
 * still resolves, the plugin still provides the legacy runtime and defaults,
 * and the existing composites still mount with their present props. Plan 009
 * deletes these together with the legacy code (clean break, no wrappers).
 */
import { describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, Suspense, type Component } from 'vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {}, params: {}, meta: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

import * as framework from '../index'
import { FrameworkPlugin } from '../adapters/plugin'
import { frameworkRuntimeKey, type FrameworkRuntime } from '../runtime'
import { frameworkDefaultsKey } from '../adapters/defaults'
import { useFrameworkDefaults, useFrameworkRuntime } from '../index'
import Table from '../components/composites/Table.vue'
import Detail from '../components/composites/Detail.vue'
import Form from '../components/composites/Form.vue'
import CRUDList from '../components/composites/CRUD/CRUDList.vue'
import CRUDDetail from '../components/composites/CRUD/CRUDDetail.vue'
import CRUDCreate from '../components/composites/CRUD/CRUDCreate.vue'
import CRUDUpdate from '../components/composites/CRUD/CRUDUpdate.vue'
import CRUDComposite from '../components/composites/CRUDComposite.vue'

const legacyRuntimeExports = [
  'FrameworkPlugin',
  'frameworkRuntimeKey',
  'frameworkDefaultsKey',
  'missingRuntimeCapability',
  'useFrameworkRuntime',
  'useFrameworkDefaults',
  'resolveFrameworkDefaults',
  'resolveCRUDOperations',
  'useCRUDOperations',
  'buildListConfig',
  'parseServiceURL',
  'parseFilenameFromContentDisposition',
  'downloadBlob',
] as const

/** This jsdom build ships without localStorage; legacy Table persists column widths there. */
const storedItems = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (key: string) => storedItems.get(key) ?? null,
  setItem: (key: string, value: string) => void storedItems.set(key, String(value)),
  removeItem: (key: string) => void storedItems.delete(key),
  clear: () => storedItems.clear(),
  key: () => null,
  length: 0,
})

async function flush() {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

/** Legacy composites use async setup, so they need a Suspense boundary. */
function mount(component: Component, props: Record<string, unknown>, runtime: FrameworkRuntime = {}) {
  const host = document.createElement('div')
  const app = createApp(defineComponent(() => () => h(Suspense, null, { default: () => h(component, props) })))
  app.use(FrameworkPlugin, { runtime })
  app.mount(host)
  return { app, host }
}

describe('legacy public surface', () => {
  it('keeps every legacy runtime export resolvable', () => {
    for (const name of legacyRuntimeExports) {
      expect(framework, `missing export: ${name}`).toHaveProperty(name)
      expect(typeof (framework as Record<string, unknown>)[name]).not.toBe('undefined')
    }
  })

  it('provides the legacy runtime and defaults through plugin installation', () => {
    const runtime: FrameworkRuntime = { table: { getData: async () => ({ data: [] }) } }
    let providedRuntime: unknown
    let providedDefaults: unknown

    const App = defineComponent({
      setup() {
        providedRuntime = useFrameworkRuntime()
        providedDefaults = useFrameworkDefaults()
        return () => h('div')
      },
    })

    const host = document.createElement('div')
    const app = createApp(App)
    app.use(FrameworkPlugin, { runtime, defaults: { global: { fieldsAlias: { name: 'Nama' } } } })
    app.mount(host)

    expect(providedRuntime).toBe(runtime)
    expect((providedDefaults as { table: { fieldsAlias: Record<string, string> } }).table.fieldsAlias.name).toBe('Nama')
    expect(app._context.provides[frameworkRuntimeKey as symbol]).toBe(runtime)
    expect(app._context.provides[frameworkDefaultsKey as symbol]).toBeDefined()

    app.unmount()
  })

  it('still accepts the runtime-only plugin signature', () => {
    const runtime: FrameworkRuntime = { crud: {} }
    let received: unknown
    const App = defineComponent({
      setup() {
        received = useFrameworkRuntime()
        return () => h('div')
      },
    })
    const host = document.createElement('div')
    const app = createApp(App)
    app.use(FrameworkPlugin, runtime)
    app.mount(host)
    expect(received).toBe(runtime)
    app.unmount()
  })
})

describe('legacy composites', () => {
  it('mounts Table with its present props', async () => {
    const { app, host } = mount(Table, {
      fields: ['name'],
      fieldsAlias: { name: 'Nama' },
      data: [{ name: 'Admin' }],
    })
    await flush()

    expect(host.textContent).toContain('Nama')
    expect(host.textContent).toContain('Admin')
    app.unmount()
  })

  it('mounts Detail with its present props', async () => {
    const { app, host } = mount(Detail, {
      fields: ['name'],
      fieldsAlias: { name: 'Nama' },
      data: { name: 'Admin' },
    })
    await flush()

    expect(host.textContent).toContain('Nama')
    expect(host.textContent).toContain('Admin')
    app.unmount()
  })

  it('mounts Form with its present props', async () => {
    const { app, host } = mount(Form, {
      fields: ['name'],
      fieldsAlias: { name: 'Nama' },
      inputConfig: { name: { type: 'text' } },
      modelValue: { name: 'Admin' },
    })
    await flush()

    expect(host.querySelector('form')).not.toBeNull()
    app.unmount()
  })
})

describe('legacy CRUD components', () => {
  const components = { CRUDList, CRUDDetail, CRUDCreate, CRUDUpdate, CRUDComposite }

  it('keeps the CRUD component modules resolvable with their declared props', () => {
    for (const [name, component] of Object.entries(components)) {
      expect(component, `missing component: ${name}`).toBeTruthy()
      expect(typeof component).toBe('object')
    }
  })

  it('mounts CRUDList with its present props', async () => {
    const runtime: FrameworkRuntime = {
      crud: { list: async () => ({ data: [{ id: 1, name: 'Admin' }], total: 1 }) },
      table: { getData: async () => ({ data: [{ id: 1, name: 'Admin' }], total: 1 }) },
    }

    const { app, host } = mount(
      CRUDList,
      {
        config: {
          title: 'Roles',
          resource: 'roles',
          list: { fields: ['name'] },
        },
        permissions: { create: true, read: true, update: true, delete: true },
      },
      runtime,
    )
    await flush()

    expect(host.textContent).toContain('Roles')
    app.unmount()
  })
})
