import { describe, expect, it, vi } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { h } from 'vue'
import ListView from '../ListView.vue'
import DetailView from '../DetailView.vue'
import FormView from '../FormView.vue'
import { controlsAt } from '../controls'
import { flush, mountCore } from '../../core/__tests__/harness'

const viewsRoot = join(__dirname, '..')

const tableProps = { fields: { name: { label: 'Nama' } }, data: [{ name: 'Admin' }] }
const detailProps = { fields: { name: { label: 'Nama' } }, data: { name: 'Admin' } }

describe('control descriptors', () => {
  it('defaults to primary placement and filters by placement', () => {
    const controls = [
      { key: 'create', label: 'Tambah' },
      { key: 'export', label: 'Ekspor', placement: 'secondary' as const },
    ]

    expect(controlsAt(controls, 'primary').map((control) => control.key)).toEqual(['create'])
    expect(controlsAt(controls, 'secondary').map((control) => control.key)).toEqual(['export'])
    expect(controlsAt(undefined, 'primary')).toEqual([])
  })
})

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

  it('renders controls as ordinary buttons and links', async () => {
    const onSelect = vi.fn()
    const view = mountCore(ListView, {
      table: tableProps,
      controls: [
        { key: 'create', label: 'Tambah', to: '/roles/new' },
        { key: 'refresh', label: 'Segarkan', onSelect },
        { key: 'export', label: 'Ekspor', placement: 'secondary', disabled: true },
      ],
    })
    await flush()

    expect(view.find<HTMLAnchorElement>('[data-control="create"]')?.getAttribute('href')).toBe('/roles/new')
    view.find<HTMLButtonElement>('[data-control="refresh"]')!.click()
    expect(onSelect).toHaveBeenCalledOnce()
    expect(view.find<HTMLButtonElement>('[data-control="export"]')?.disabled).toBe(true)
    view.unmount()
  })

  it('omits controls the caller did not supply', async () => {
    const view = mountCore(ListView, { table: tableProps })
    await flush()

    expect(view.all('[data-control]')).toEqual([])
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

  it('renders edit and delete controls only when supplied', async () => {
    const onSelect = vi.fn()
    const view = mountCore(DetailView, {
      detail: detailProps,
      controls: [
        { key: 'edit', label: 'Ubah', to: '/roles/1/edit' },
        { key: 'delete', label: 'Hapus', onSelect },
      ],
    })
    await flush()

    view.find<HTMLButtonElement>('[data-control="delete"]')!.click()
    expect(onSelect).toHaveBeenCalledOnce()
    expect(view.find('[data-control="edit"]')?.getAttribute('href')).toBe('/roles/1/edit')
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
    const create = mountCore(FormView, { title: 'Tambah Role', form: formProps(createSubmit) })
    await flush()
    create.find('form')!.dispatchEvent(new Event('submit'))
    await flush()

    const updateSubmit = vi.fn(async () => undefined)
    const update = mountCore(FormView, {
      title: 'Ubah Role',
      form: { ...formProps(updateSubmit), load: async () => ({ name: 'Editor' }) },
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

  it('renders submit and cancel chrome and re-emits form events', async () => {
    const onSubmitted = vi.fn()
    const view = mountCore(FormView, {
      form: formProps(async () => ({ id: 1 })),
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
    const view = mountCore(FormView, { form: formProps(async () => undefined) })
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
      ['FormView.vue', 'v-bind="props.form"'],
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
