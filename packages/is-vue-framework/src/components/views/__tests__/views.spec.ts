import { describe, expect, it, vi } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { h } from 'vue'
import ListView from '../ListView.vue'
import DetailView from '../DetailView.vue'
import FormView from '../FormView.vue'
import { flush, mountCore } from '../../core/__tests__/harness'

const viewsRoot = join(__dirname, '..')

const tableProps = { fields: { name: { label: 'Nama' } }, data: [{ name: 'Admin' }] }
const detailProps = { fields: { name: { label: 'Nama' } }, data: { name: 'Admin' } }

describe('ListView', () => {
  it('renders chrome around the table and forwards table props unchanged', async () => {
    const view = mountCore(ListView, { title: 'Role', description: 'Daftar role', table: tableProps })
    await flush()

    expect(view.find('h1')?.textContent).toBe('Role')
    expect(view.text()).toContain('Daftar role')
    expect(view.all('th').map((cell) => cell.textContent)).toEqual(['Nama'])
    expect(view.text()).toContain('Admin')
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
})

describe('DetailView', () => {
  it('renders chrome around the detail and forwards its props unchanged', async () => {
    const view = mountCore(DetailView, { title: 'Role', detail: detailProps })
    await flush()

    expect(view.find('h1')?.textContent).toBe('Role')
    expect(view.all('dt').map((node) => node.textContent)).toEqual(['Nama'])
    expect(view.text()).toContain('Admin')
    view.unmount()
  })

  it('renders controls and footer only from named slots', async () => {
    const view = mountCore(DetailView, { detail: detailProps }, {
      slots: {
        controls: () => h('button', { 'data-controls-slot': '' }, 'Ubah'),
        footer: () => h('button', { 'data-footer-slot': '' }, 'Kembali'),
      },
    })
    await flush()

    expect(view.find('[data-controls-slot]')).not.toBeNull()
    expect(view.find('[data-footer-slot]')).not.toBeNull()
    view.unmount()
  })

  it('exposes a print region and value slots', async () => {
    const view = mountCore(
      DetailView,
      { detail: detailProps },
      {
        slots: {
          print: () => h('p', 'Cetak'),
          'value:name': (scope) => h('em', String((scope as { value: unknown }).value)),
        },
      },
    )
    await flush()

    expect(view.text()).toContain('Cetak')
    expect(view.find('em')?.textContent).toBe('Admin')
    view.unmount()
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
    const create = mountCore(FormView, { title: 'Tambah Role', formProps: formProps(createSubmit) })
    await flush()
    create.find('form')!.dispatchEvent(new Event('submit'))
    await flush()

    const updateSubmit = vi.fn(async () => undefined)
    const update = mountCore(FormView, {
      title: 'Ubah Role',
      formProps: { ...formProps(updateSubmit), load: async () => ({ name: 'Editor' }) },
    })
    await flush()
    update.find('form')!.dispatchEvent(new Event('submit'))
    await flush()

    expect(createSubmit).toHaveBeenCalledWith({ name: 'Admin' })
    expect(updateSubmit).toHaveBeenCalledWith({ name: 'Editor' })
    expect(create.find('h1')?.textContent).toBe('Tambah Role')
    expect(update.find('h1')?.textContent).toBe('Ubah Role')
    create.unmount()
    update.unmount()
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
    view.find<HTMLButtonElement>('button[type="submit"]')!.click()
    await flush()

    expect(onSubmitted).toHaveBeenCalledWith({ id: 1 })
    view.unmount()
  })

  it('resets the draft through the cancel control', async () => {
    const view = mountCore(FormView, { formProps: formProps(async () => undefined) })
    await flush()

    const input = view.find<HTMLInputElement>('input')!
    input.value = 'Diubah'
    input.dispatchEvent(new Event('input'))
    await flush()

    view.all('button').find((button) => button.textContent === 'Batal')!.dispatchEvent(new MouseEvent('click'))
    await flush()

    expect(view.find<HTMLInputElement>('input')!.value).toBe('Admin')
    view.unmount()
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

