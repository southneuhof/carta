import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import Table from '../Table.vue'
import { createMemoryQueryLocationAdapter } from '../../../adapters/projectAdapters'
import { deferred, flush, mountCore } from './harness'

const fields = { name: { label: 'Nama', table: { sortable: true } }, status: { label: 'Status' } }
const rows = [
  { name: 'Admin', status: 'open' },
  { name: 'Editor', status: 'closed' },
]

describe('Table core', () => {
  it('renders externally controlled data with catalog labels', async () => {
    const view = mountCore(Table, { fields, data: rows })
    await flush()

    expect(view.all('th').map((cell) => cell.textContent)).toEqual(['Nama', 'Status'])
    expect(view.all('tbody tr')).toHaveLength(2)
    expect(view.text()).toContain('Admin')
    view.unmount()
  })

  it('accepts a synchronous offline loader', async () => {
    const view = mountCore(Table, { fields, load: () => ({ data: rows }) })
    await flush()

    expect(view.all('tbody tr')).toHaveLength(2)
    view.unmount()
  })

  it('accepts an asynchronous loader and normalizes the envelope', async () => {
    const view = mountCore(Table, {
      fields,
      load: async () => ({ data: rows, total: 20, limit: 10 }),
    })
    await flush()

    expect(view.all('tbody tr')).toHaveLength(2)
    expect(view.text()).toContain('1 / 2')
    view.unmount()
  })

  it('rejects supplying both data and load', () => {
    expect(() => mountCore(Table, { fields, data: rows, load: () => ({ data: rows }) })).toThrow(
      'Table accepts either `data` or `load`, not both.',
    )
  })

  it('writes its query to the URL under the supplied namespace', async () => {
    const location = createMemoryQueryLocationAdapter()
    const view = mountCore(
      Table,
      { fields, namespace: 'roles', load: async () => ({ data: rows, total: 40, limit: 10 }) },
      { adapters: { query: location } },
    )
    await flush()

    view.all('nav button')[1].click()
    await flush()

    expect(location.read('roles').page).toBe(2)
    view.unmount()
  })

  it('keeps duplicate instances independent through explicit namespaces', async () => {
    const location = createMemoryQueryLocationAdapter()
    const Host = defineComponent(() => () => [
      h(Table, { fields, namespace: 'assignees', load: async () => ({ data: rows, total: 40, limit: 10 }) }),
      h(Table, { fields, namespace: 'archived', load: async () => ({ data: rows, total: 40, limit: 10 }) }),
    ])
    const view = mountCore(Host, {}, { adapters: { query: location } })
    await flush()

    view.all('nav')[1].querySelectorAll('button')[1].click()
    await flush()

    expect(location.read('archived').page).toBe(2)
    expect(location.read('assignees').page ?? 1).toBe(1)
    view.unmount()
  })

  it('reloads and cancels the previous request when the load context changes', async () => {
    const first = deferred<{ data: typeof rows }>()
    const signals: (AbortSignal | undefined)[] = []
    let call = 0
    const section = ref('a')
    const Host = defineComponent(() => () =>
      h(Table, {
        fields,
        searchParameters: { section_id: section.value },
        load: ({ signal }: { signal?: AbortSignal }) => {
          signals.push(signal)
          call += 1
          return call === 1 ? first.promise : Promise.resolve({ data: rows })
        },
      }),
    )
    const view = mountCore(Host, {})
    await flush()

    expect(signals[0]?.aborted).toBe(false)

    section.value = 'b'
    await flush()

    expect(signals.length).toBeGreaterThan(1)
    expect(signals[0]?.aborted).toBe(true)
    first.resolve({ data: rows })
    view.unmount()
  })

  it('toggles sort direction and resets to the first page', async () => {
    const queries: Record<string, unknown>[] = []
    const view = mountCore(Table, {
      fields,
      load: (context: { query: Record<string, unknown> }) => {
        queries.push({ ...context.query })
        return { data: rows }
      },
    })
    await flush()

    view.all('th button')[0].click()
    await flush()
    view.all('th button')[0].click()
    await flush()

    expect(queries.at(-2)).toMatchObject({ sort_by: 'name', sort: 'asc', page: 1 })
    expect(queries.at(-1)).toMatchObject({ sort_by: 'name', sort: 'desc' })
    view.unmount()
  })

  it('renders loading, empty, and error states', async () => {
    const pending = deferred<{ data: typeof rows }>()
    const loading = mountCore(Table, { fields, load: () => pending.promise })
    expect(loading.text()).toContain('Memuat')
    pending.resolve({ data: [] })
    await flush()
    expect(loading.text()).toContain('Tidak ada data')
    loading.unmount()

    const failing = mountCore(Table, {
      fields,
      load: async () => {
        throw new Error('Gagal memuat')
      },
    })
    await flush(12)
    expect(failing.find('[role="alert"]')?.textContent).toContain('Gagal memuat')
    failing.unmount()
  })

  it('renders a registered renderer and lets a slot override it', async () => {
    const Chip = defineComponent({ props: { value: null }, setup: (props) => () => h('em', String(props.value)) })
    const withRenderer = mountCore(
      Table,
      { fields: { status: { label: 'Status', table: { renderer: 'chip' } } }, data: rows },
      { renderers: { table: { chip: Chip } } },
    )
    await flush()
    expect(withRenderer.find('em')?.textContent).toBe('open')
    withRenderer.unmount()

    const withSlot = mountCore(
      Table,
      { fields, data: rows },
      { slots: { 'cell:name': (scope) => h('strong', String((scope as { value: unknown }).value)) } },
    )
    await flush()
    expect(withSlot.find('strong')?.textContent).toBe('Admin')
    withSlot.unmount()
  })

  it('emits query changes', async () => {
    const onUpdate = vi.fn()
    const view = mountCore(Table, {
      fields,
      data: rows,
      'onUpdate:query': onUpdate,
    })
    await flush()
    view.all('th button')[0].click()
    await flush()

    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ sort_by: 'name' }))
    view.unmount()
  })
})
