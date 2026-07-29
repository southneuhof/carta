import { describe, expect, it, vi } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createApp, defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { FrameworkPlugin } from '../../../adapters/plugin'
import ListView from '../ListView.vue'
import DetailView from '../DetailView.vue'
import FormView from '../FormView.vue'
import { deferred, flush, mountCore } from '../../core/__tests__/harness'

const viewsRoot = join(__dirname, '..')

const tableProps = { fields: { name: { label: 'Nama' } }, data: [{ name: 'Admin' }] }
const detailProps = { fields: { name: { label: 'Nama' } }, data: { name: 'Admin' } }

function installStorage() {
  const values = new Map<string, string>()
  const setItem = vi.fn((key: string, value: string) => values.set(key, value))
  const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage')
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem,
      removeItem: (key: string) => values.delete(key),
      get length() { return values.size },
    },
  })
  return {
    values,
    setItem,
    restore: () => {
      if (descriptor) Object.defineProperty(window, 'localStorage', descriptor)
      else delete (window as { localStorage?: Storage }).localStorage
    },
  }
}

describe('ListView', () => {
  it('renders toolbar and table in separate outlined cards', async () => {
    const view = mountCore(ListView, { title: 'Role', description: 'Manage roles.', table: tableProps })
    await flush()

    expect(view.find('h1')?.textContent).toBe('Role')
    expect(view.text()).toContain('Manage roles.')
    expect(view.all('th').map((cell) => cell.textContent)).toEqual(['Nama'])
    expect(view.text()).toContain('Admin')
    const cards = view.all('.is-list-view > div')
    expect(cards).toHaveLength(2)
    expect(cards.every((card) => card.classList.contains('bg-surface-container'))).toBe(true)
    expect(cards[0].contains(view.find('header')!)).toBe(true)
    expect(cards[1].contains(view.find('table')!)).toBe(true)
    view.unmount()
  })

  it('renders controls and footer only from named slots', async () => {
    const view = mountCore(ListView, { table: tableProps }, {
      slots: {
        controls: () => h('button', { 'data-controls-slot': '' }, 'Tambah'),
        footer: () => h('button', { 'data-footer-slot': '' }, 'Kembali'),
      },
    })
    await flush()

    expect(view.find('[data-controls-slot]')).not.toBeNull()
    expect(view.find('[data-footer-slot]')).not.toBeNull()
    view.unmount()
  })

  it('omits page action regions without slots', async () => {
    const view = mountCore(ListView, { table: tableProps })
    await flush()

    expect(view.find('footer')).toBeNull()
    view.unmount()
  })

  it('keeps raw table surfaces free of resource row controls', async () => {
    const view = mountCore(ListView, { table: tableProps })
    await flush()

    expect(view.all('th').map((cell) => cell.textContent)).toEqual(['Nama'])
    expect(view.find('[aria-label="Aksi baris"]')).toBeNull()
    view.unmount()
  })

  it('updates visible columns immediately, coalesces persistence, and reset cancels pending visibility', async () => {
    vi.useFakeTimers()
    const storage = installStorage()
    let view: ReturnType<typeof mountCore> | undefined
    try {
      view = mountCore(ListView, {
        table: {
          namespace: 'roles',
          fields: { name: { label: 'Nama' }, status: { label: 'Status' } },
          data: [{ name: 'Admin', status: 'active' }],
        },
      })
      await flush()

      view.find<HTMLButtonElement>('[aria-label="Columns"]')!.click()
      await flush()
      const statusSwitch = [...document.querySelectorAll<HTMLButtonElement>('label button')][1]
      statusSwitch.click()
      await flush()
      expect(view.all('th').map((cell) => cell.textContent)).toEqual(['Nama'])
      statusSwitch.click()
      await flush()
      expect(view.all('th').map((cell) => cell.textContent)).toEqual(['Nama', 'Status'])
      statusSwitch.click()
      await flush()
      expect(view.all('th').map((cell) => cell.textContent)).toEqual(['Nama'])
      expect(storage.setItem).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(200)
      expect(storage.setItem).toHaveBeenCalledTimes(1)
      expect(storage.setItem).toHaveBeenCalledWith(
        'is-framework:roles:table:visible-columns',
        JSON.stringify({ known: ['name', 'status'], visible: ['name'] }),
      )

      storage.setItem.mockClear()
      statusSwitch.click()
      await flush()
      ;[...document.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent === 'Reset columns')!.click()
      await flush()
      await vi.advanceTimersByTimeAsync(200)
      expect(storage.setItem).not.toHaveBeenCalled()
      expect(storage.values.has('is-framework:roles:table:visible-columns')).toBe(false)
    } finally {
      view?.unmount()
      storage.restore()
      vi.useRealTimers()
    }
  })

  it('flushes final column visibility when unmounted before debounce expiry', async () => {
    vi.useFakeTimers()
    const storage = installStorage()
    let view: ReturnType<typeof mountCore> | undefined
    try {
      view = mountCore(ListView, {
        table: {
          namespace: 'roles',
          fields: { name: { label: 'Nama' }, status: { label: 'Status' } },
          data: [{ name: 'Admin', status: 'active' }],
        },
      })
      await flush()
      view.find<HTMLButtonElement>('[aria-label="Columns"]')!.click()
      await flush()
      ;[...document.querySelectorAll<HTMLButtonElement>('label button')][1].click()
      await flush()

      view.unmount()
      view = undefined
      expect(storage.setItem).toHaveBeenCalledTimes(1)
      expect(storage.setItem).toHaveBeenCalledWith(
        'is-framework:roles:table:visible-columns',
        JSON.stringify({ known: ['name', 'status'], visible: ['name'] }),
      )
      await vi.advanceTimersByTimeAsync(200)
      expect(storage.setItem).toHaveBeenCalledTimes(1)
    } finally {
      view?.unmount()
      storage.restore()
      vi.useRealTimers()
    }
  })

  it('lets slots replace the header and the body entirely', async () => {
    const view = mountCore(
      ListView,
      { title: 'Role', table: tableProps },
      {
        slots: {
          header: () => h('h2', 'Judul khusus'),
          body: () => h('p', 'Badan khusus'),
        },
      },
    )
    await flush()

    expect(view.find('h1')).toBeNull()
    expect(view.text()).toContain('Judul khusus')
    expect(view.text()).toContain('Badan khusus')
    expect(view.find('table')).toBeNull()
    view.unmount()
  })

  it('passes cell slots through to the table', async () => {
    const view = mountCore(
      ListView,
      { table: tableProps },
      { slots: { 'cell:name': (scope) => h('strong', String((scope as { value: unknown }).value)) } },
    )
    await flush()

    expect(view.find('strong')?.textContent).toBe('Admin')
    view.unmount()
  })

  it('sends debounced search through the table query and resets page', async () => {
    vi.useFakeTimers()
    const contexts: Record<string, unknown>[] = []
    const view = mountCore(ListView, {
      table: {
        fields: { name: { label: 'Nama' } },
        load: ({ query }: { query: Record<string, unknown> }) => {
          contexts.push({ ...query })
          return { data: [{ name: 'Admin' }] }
        },
      },
      query: { page: 4, limit: 10 },
    })
    await flush()

    const search = view.find<HTMLInputElement>('header input')!
    search.value = 'admin'
    search.dispatchEvent(new Event('input'))
    await vi.advanceTimersByTimeAsync(300)
    await flush()

    expect(contexts.at(-1)).toMatchObject({ search: 'admin', page: 1, limit: 10 })
    view.unmount()
    vi.useRealTimers()
  })

  it('renders model-bound filter Form and resets filters without clearing search or limit', async () => {
    const contexts: Record<string, unknown>[] = []
    const view = mountCore(ListView, {
      table: {
        fields: { name: { label: 'Nama' } },
        load: ({ query }: { query: Record<string, unknown> }) => {
          contexts.push({ ...query })
          return { data: [{ name: 'Admin' }] }
        },
      },
      query: { search: 'admin', limit: 25, page: 3 },
      filters: { fields: { active: { label: 'Aktif' } }, defaults: { active: 'yes' } },
    })
    await flush()

    view.find<HTMLButtonElement>('[aria-label="Filter"]')!.click()
    await flush()
    const filter = document.querySelector<HTMLInputElement>('#field-active')!
    filter.value = 'no'
    filter.dispatchEvent(new Event('input'))
    await flush()
    expect(contexts.at(-1)).toMatchObject({ active: 'no', search: 'admin', limit: 25, page: 1 })

    ;[...document.querySelectorAll('button')].find((button) => button.textContent === 'Reset filter')!.dispatchEvent(new MouseEvent('click'))
    await flush()
    expect(contexts.at(-1)).toMatchObject({ active: 'yes', search: 'admin', limit: 25, page: 1 })
    view.unmount()
  })
})

describe('DetailView', () => {
  it('renders chrome around the detail and forwards its props unchanged', async () => {
    const view = mountCore(DetailView, { title: 'Role', backTo: { name: 'test-route' }, detail: detailProps })
    await flush()

    expect(view.find('h1')?.textContent).toBe('Role')
    expect(view.all('th[scope="row"]').map((node) => node.textContent)).toEqual(['Nama'])
    expect(view.text()).toContain('Admin')
    expect(view.all('.is-detail-view > div').every((card) => card.classList.contains('bg-surface-container'))).toBe(true)
    view.unmount()
  })

  it('renders required navigation chrome and controls without a footer', async () => {
    const view = mountCore(DetailView, { title: 'Role', backTo: { name: 'test-route' }, detail: detailProps }, {
      slots: {
        controls: () => h('button', { 'data-controls-slot': '' }, 'Ubah'),
      },
    })
    await flush()

    expect(view.all('h1')).toHaveLength(1)
    expect(view.find('h1')?.textContent).toBe('Role')
    const back = view.find<HTMLAnchorElement>('a[aria-label="Kembali"]')
    expect(back).not.toBeNull()
    expect(back?.getAttribute('href')).toBe(view.router.resolve({ name: 'test-route' }).href)
    expect(view.find('[data-controls-slot]')).not.toBeNull()
    expect(view.find('header > div [data-controls-slot]')).not.toBeNull()
    expect(view.find('footer')).toBeNull()
    view.unmount()
  })

  it('forwards value slots', async () => {
    const view = mountCore(
      DetailView,
      { title: 'Role', backTo: { name: 'test-route' }, detail: detailProps },
      {
        slots: {
          'value:name': (scope) => h('em', String((scope as { value: unknown }).value)),
        },
      },
    )
    await flush()

    expect(view.find('em')?.textContent).toBe('Admin')
    view.unmount()
  })

  it('contains no removed regions or router history logic', () => {
    const source = readFileSync(join(viewsRoot, 'DetailView.vue'), 'utf8')

    for (const forbidden of ['name="header"', 'name="body"', 'name="print"', 'name="footer"', 'description', 'router.back', 'useRouter']) {
      expect(source).not.toContain(forbidden)
    }
  })
})

describe('FormView', () => {
  const formProps = (submit: () => Promise<unknown>) => ({
    fields: { name: { label: 'Nama' } },
    initialData: { name: 'Admin' },
    submit,
  })

  it('runs the same chrome for create-like and update-like props, with no mode anywhere', async () => {
    const createSubmit = vi.fn(async () => undefined)
    const create = mountCore(FormView, { title: 'Create Role', formProps: formProps(createSubmit) })
    await flush()
    create.find('form')!.dispatchEvent(new Event('submit'))
    await flush()

    const updateSubmit = vi.fn(async () => undefined)
    const update = mountCore(FormView, {
      title: 'Edit Role',
      formProps: { ...formProps(updateSubmit), load: async () => ({ name: 'Editor' }) },
    })
    await flush()
    update.find('form')!.dispatchEvent(new Event('submit'))
    await flush()

    expect(createSubmit).toHaveBeenCalledWith({ name: 'Admin' })
    expect(updateSubmit).toHaveBeenCalledWith({ name: 'Editor' })
    expect(create.find('h1')?.textContent).toBe('Create Role')
    expect(update.find('h1')?.textContent).toBe('Edit Role')
    create.unmount()
    update.unmount()
  })

  it('uses DetailView-style navigation and body cards', async () => {
    const view = mountCore(FormView, {
      title: 'Create Role',
      description: 'Set user access.',
      formProps: formProps(async () => undefined),
    })
    await flush()

    const cards = view.all('.is-form-view > div')
    expect(cards).toHaveLength(2)
    expect(cards.every((card) => card.classList.contains('bg-surface-container'))).toBe(true)
    expect(cards.every((card) => card.classList.contains('border-outline-variant'))).toBe(true)
    expect(view.find('h1')?.classList.contains('text-lg')).toBe(true)
    expect(view.text()).toContain('Set user access.')
    expect(cards[1].contains(view.find('form')!)).toBe(true)
    expect(view.find<HTMLButtonElement>('button[aria-label="Back"]')).not.toBeNull()
    view.unmount()
  })

  it('renders page action slots without generic fallbacks', async () => {
    const view = mountCore(FormView, { formProps: formProps(async () => undefined) }, {
      slots: {
        controls: () => h('button', { 'data-controls-slot': '' }, 'Bantuan'),
        footer: () => h('button', { 'data-footer-slot': '' }, 'Kembali'),
      },
    })
    await flush()

    expect(view.find('[data-controls-slot]')).not.toBeNull()
    expect(view.find('header [data-controls-slot]')).not.toBeNull()
    expect(view.find('[data-footer-slot]')).not.toBeNull()
    view.unmount()
  })

  it('renders submit and cancel chrome and re-emits form events', async () => {
    const onSubmitted = vi.fn()
    const view = mountCore(FormView, {
      formProps: formProps(async () => ({ id: 1 })),
      submitLabel: 'Kirim',
      onSubmitted,
    })
    await flush()

    expect(view.text()).toContain('Kirim')
    view.find('form')!.dispatchEvent(new Event('submit'))
    await flush()

    expect(onSubmitted).toHaveBeenCalledWith({ id: 1 })
    view.unmount()
  })

  it('uses responsive text and filled form actions while submitting', async () => {
    const pending = deferred<{ id: number }>()
    const view = mountCore(FormView, { formProps: formProps(async () => pending.promise) })
    await flush()

    const actions = view.find('.is-form-view-controls')!
    const cancel = actions.querySelector<HTMLButtonElement>('button[type="button"]')!
    const submit = actions.querySelector<HTMLButtonElement>('button[type="submit"]')!
    expect(actions.classList.contains('border-t')).toBe(true)
    expect(actions.classList.contains('sm:flex-row')).toBe(true)
    expect(cancel.classList.contains('bg-transparent')).toBe(true)
    expect(submit.classList.contains('bg-primary')).toBe(true)
    expect(cancel.classList.contains('w-full')).toBe(true)
    view.find('form')!.dispatchEvent(new Event('submit'))
    await flush()
    expect(view.text()).toContain('Saving…')
    expect(cancel.disabled).toBe(true)
    expect(submit.disabled).toBe(true)
    pending.resolve({ id: 1 })
    await flush()
    view.unmount()
  })

  it('uses browser history through Cancel without resetting the draft', async () => {
    const view = mountCore(FormView, { formProps: formProps(async () => undefined) })
    await flush()

    const input = view.find<HTMLInputElement>('input')!
    input.value = 'Diubah'
    input.dispatchEvent(new Event('input'))
    await flush()

    const back = vi.spyOn(view.router, 'back')
    view.all<HTMLButtonElement>('button').find((button) => button.textContent === 'Cancel')!.click()
    await flush()

    expect(view.find<HTMLInputElement>('input')!.value).toBe('Diubah')
    expect(back).toHaveBeenCalledOnce()
    view.unmount()
  })

  it('lets body, header, and form actions slots replace their defaults', async () => {
    const view = mountCore(FormView, { title: 'Create Role', formProps: formProps(async () => undefined) }, {
      slots: {
        header: () => h('h2', { 'data-header-slot': '' }, 'Header khusus'),
        body: () => h('p', { 'data-body-slot': '' }, 'Badan khusus'),
        'form-actions': () => h('button', { 'data-form-actions-slot': '' }, 'Custom action'),
      },
    })
    await flush()

    expect(view.find('[data-header-slot]')).not.toBeNull()
    expect(view.find('[data-body-slot]')).not.toBeNull()
    expect(view.find('[data-form-actions-slot]')).toBeNull()
    expect(view.find('h1')).toBeNull()
    expect(view.find('form')).toBeNull()
    view.unmount()

    const formActions = mountCore(FormView, { formProps: formProps(async () => undefined) }, {
      slots: { 'form-actions': () => h('button', { 'data-form-actions-slot': '' }, 'Custom action') },
    })
    await flush()
    expect(formActions.find('[data-form-actions-slot]')).not.toBeNull()
    expect(formActions.find('.is-form-view-controls')).toBeNull()
    formActions.unmount()
  })

  function resourceForm(options: {
    detail?: (id: string) => string
    list?: string
    afterSubmit?: (context: { navigate: (to: string) => Promise<void>; preventDefaultNavigation: () => void }) => Promise<void | string> | void | string
    submit?: () => Promise<{ id: string; name: string }>
  } = {}) {
    return {
      __formCapabilities: 'create' as const,
      capabilities: {
        create: {},
        ...(options.detail ? { detail: { to: options.detail } } : {}),
        ...(options.list ? { list: { to: options.list } } : {}),
      },
      identity: (record: { id: string }) => record.id,
      form: () => ({ fields: { name: { label: 'Nama' } }, initialData: { name: 'Admin' }, submit: options.submit ?? (async () => ({ id: '1', name: 'Admin' })) }),
      afterSubmit: options.afterSubmit,
    }
  }

  async function mountRoutedFormView() {
    const host = document.createElement('div')
    document.body.append(host)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/form',
          name: 'form',
          component: FormView,
          props: {
            title: 'Edit Role',
            formProps: formProps(async () => undefined),
          },
        },
        { path: '/other', name: 'other', component: defineComponent({ setup: () => () => h('p', 'Other page') }) },
      ],
    })
    const app = createApp(defineComponent({ setup: () => () => h(RouterView) }))
    app.use(router)
    app.use(FrameworkPlugin )
    await router.push({ name: 'form' })
    await router.isReady()
    app.mount(host)
    await flush()

    return { host, router, unmount: () => { app.unmount(); host.remove() } }
  }

  it('guards dirty route exits, preserves drafts when staying, and registers native unload protection', async () => {
    const view = await mountRoutedFormView()
    const input = view.host.querySelector<HTMLInputElement>('input')!
    const cleanUnload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(cleanUnload)
    expect(cleanUnload.defaultPrevented).toBe(false)

    input.value = 'Editor'
    input.dispatchEvent(new Event('input'))
    await flush()

    const dirtyUnload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(dirtyUnload)
    expect(dirtyUnload.defaultPrevented).toBe(true)

    const navigation = view.router.push({ name: 'other' })
    await flush()
    expect(document.body.textContent).toContain('Discard unsaved changes?')
    ;[...document.body.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent === 'Stay')!.click()
    await navigation
    await flush()
    expect(view.router.currentRoute.value.name).toBe('form')
    expect(view.host.querySelector<HTMLInputElement>('input')!.value).toBe('Editor')

    const discardNavigation = view.router.push({ name: 'other' })
    await flush()
    ;[...document.body.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent === 'Discard changes')!.click()
    await discardNavigation
    expect(view.router.currentRoute.value.name).toBe('other')
    view.unmount()
  })

  it('derives detail navigation, then list fallback, and stays without either target', async () => {
    const detail = mountCore(FormView, { resource: resourceForm({ detail: (id) => `/records/${id}`, list: '/records' }) })
    const detailReplace = vi.spyOn(detail.router, 'replace')
    detail.find('form')!.dispatchEvent(new Event('submit'))
    await flush()
    expect(detailReplace).toHaveBeenCalledWith('/records/1')
    detail.unmount()

    const list = mountCore(FormView, { resource: resourceForm({ list: '/records' }) })
    const listReplace = vi.spyOn(list.router, 'replace')
    list.find('form')!.dispatchEvent(new Event('submit'))
    await flush()
    expect(listReplace).toHaveBeenCalledWith('/records')
    list.unmount()

    const stay = mountCore(FormView, { resource: resourceForm() })
    const stayReplace = vi.spyOn(stay.router, 'replace')
    stay.find('form')!.dispatchEvent(new Event('submit'))
    await flush()
    expect(stayReplace).not.toHaveBeenCalled()
    stay.unmount()
  })

  it('runs effects before default navigation and only controller calls suppress it', async () => {
    const order: string[] = []
    const effect = mountCore(FormView, {
      resource: resourceForm({
        detail: () => '/default',
        afterSubmit: async () => { order.push('effect') },
      }),
    })
    const effectReplace = vi.spyOn(effect.router, 'replace')
    effect.find('form')!.dispatchEvent(new Event('submit'))
    await flush()
    expect(order).toEqual(['effect'])
    expect(effectReplace).toHaveBeenCalledWith('/default')
    effect.unmount()

    const ignoredReturn = mountCore(FormView, {
      resource: resourceForm({ detail: () => '/default', afterSubmit: () => '/ignored' }),
    })
    const ignoredReplace = vi.spyOn(ignoredReturn.router, 'replace')
    ignoredReturn.find('form')!.dispatchEvent(new Event('submit'))
    await flush()
    expect(ignoredReplace).toHaveBeenCalledWith('/default')
    ignoredReturn.unmount()

    const controlled = mountCore(FormView, {
      resource: resourceForm({ detail: () => '/default', afterSubmit: async ({ navigate }) => navigate('/custom') }),
    })
    const controlledReplace = vi.spyOn(controlled.router, 'replace')
    controlled.find('form')!.dispatchEvent(new Event('submit'))
    await flush()
    expect(controlledReplace).toHaveBeenCalledTimes(1)
    expect(controlledReplace).toHaveBeenCalledWith('/custom')
    controlled.unmount()

    const prevented = mountCore(FormView, {
      resource: resourceForm({ detail: () => '/default', afterSubmit: ({ preventDefaultNavigation }) => preventDefaultNavigation() }),
    })
    const preventedReplace = vi.spyOn(prevented.router, 'replace')
    prevented.find('form')!.dispatchEvent(new Event('submit'))
    await flush()
    expect(preventedReplace).not.toHaveBeenCalled()
    prevented.unmount()
  })

  it('keeps persisted form mounted when follow-up effect fails', async () => {
    const view = mountCore(FormView, {
      resource: resourceForm({ detail: () => '/default', afterSubmit: async () => { throw new Error('follow-up') } }),
    })
    const replace = vi.spyOn(view.router, 'replace')
    view.find('form')!.dispatchEvent(new Event('submit'))
    await flush()

    expect(view.find('form')).not.toBeNull()
    expect(replace).not.toHaveBeenCalled()
    view.unmount()
  })
})

describe('shell boundaries', () => {
  const shellFiles = readdirSync(viewsRoot).filter((entry) => entry.endsWith('.vue') || entry.endsWith('.ts'))

  it('imports no store or RPC dependency', () => {
    const forbidden = ['pinia', '../../runtime', '../../adapters', '@southneuhof/sdk']
    const offenders = shellFiles.flatMap((file) => {
      const source = readFileSync(join(viewsRoot, file), 'utf8')
      return forbidden.filter((specifier) => source.includes(`'${specifier}`)).map((specifier) => `${file}: ${specifier}`)
    })

    expect(offenders).toEqual([])
  })

  it('forwards core props with v-bind instead of translating them', () => {
    for (const [file, binding] of [
      ['ListView.vue', 'v-bind="surface.table"'],
      ['DetailView.vue', 'v-bind="surface.detail"'],
      ['FormView.vue', 'v-bind="surface"'],
    ]) {
      expect(readFileSync(join(viewsRoot, file), 'utf8')).toContain(binding)
    }
  })

  it('keeps one heading per shell for a predictable document outline', async () => {
    const view = mountCore(ListView, { title: 'Role', table: tableProps })
    await flush()

    expect(view.all('h1')).toHaveLength(1)
    view.unmount()
  })
})
