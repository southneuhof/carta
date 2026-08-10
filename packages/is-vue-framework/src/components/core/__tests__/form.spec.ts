import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { z } from 'zod'
import Form from '../Form.vue'
import { fromZod } from '../../../validation'
import { deferred, flush, mountCore } from './harness'

const mocks = vi.hoisted(() => ({ toastError: vi.fn() }))
vi.mock('vue-sonner', () => ({ toast: { error: mocks.toastError } }))

const fields = {
  name: { label: 'Nama', form: { renderer: undefined } },
  note: { label: 'Catatan' },
}

function inputs(view: ReturnType<typeof mountCore>) {
  return view.all('input') as HTMLInputElement[]
}

function type(view: ReturnType<typeof mountCore>, index: number, value: string) {
  const input = inputs(view)[index]
  input.value = value
  input.dispatchEvent(new Event('input'))
}

describe('Form core', () => {
  it('applies default renderer while explicit form projection wins', async () => {
    const DefaultRenderer = defineComponent({ props: { value: null }, setup: () => () => h('i', 'default') })
    const ExplicitRenderer = defineComponent({ props: { value: null }, setup: () => () => h('b', 'explicit') })
    const view = mountCore(
      Form,
      {
        fields: {
          name: { label: 'Nama' },
          note: { label: 'Catatan', form: { renderer: 'explicit' } },
        },
        submit: async () => undefined,
      },
      {
        fieldDefaults: { form: { renderer: 'default', props: { dense: true } } },
        renderers: { form: { default: DefaultRenderer, explicit: ExplicitRenderer } },
      },
    )
    await flush()
    expect(view.find('i')?.textContent).toBe('default')
    expect(view.find('b')?.textContent).toBe('explicit')
    view.unmount()
  })

  it('submits a draft with no loader — the create-like case', async () => {
    const submit = vi.fn(async () => ({ id: '1' }))
    const view = mountCore(Form, { fields, initialData: { name: 'Admin' }, submit })
    await flush()

    expect(inputs(view)[0].value).toBe('Admin')
    view.find('form')!.dispatchEvent(new Event('submit'))
    await flush()

    expect(submit).toHaveBeenCalledWith({ name: 'Admin' })
    view.unmount()
  })

  it('keeps fallback inputs transparent with the secondary focus treatment', async () => {
    const view = mountCore(Form, { fields: { name: { label: 'Name' } }, submit: async () => undefined })
    await flush()

    const input = view.find<HTMLInputElement>('input')!
    expect(input.classList.contains('bg-transparent')).toBe(true)
    expect(input.classList.contains('outline-1')).toBe(true)
    expect(input.classList.contains('focus:outline-secondary')).toBe(true)
    expect(input.classList.contains('focus:ring-1')).toBe(true)
    expect(input.classList.contains('transition-[outline-color,box-shadow]')).toBe(true)
    expect(input.classList.contains('bg-surface')).toBe(false)
    view.unmount()
  })

  it('loads then submits with the same component and no mode prop — the update-like case', async () => {
    const submit = vi.fn(async () => undefined)
    const view = mountCore(Form, {
      fields,
      load: async () => ({ name: 'Editor', note: 'lama' }),
      submit,
    })
    await flush()

    expect(inputs(view)[0].value).toBe('Editor')
    type(view, 1, 'baru')
    view.find('form')!.dispatchEvent(new Event('submit'))
    await flush()

    expect(submit).toHaveBeenCalledWith({ name: 'Editor', note: 'baru' })
    view.unmount()
  })

  it('accepts a synchronous offline loader and submitter', async () => {
    const submitted: unknown[] = []
    const view = mountCore(Form, {
      fields,
      load: () => ({ name: 'Offline' }),
      submit: (draft: unknown) => {
        submitted.push(draft)
        return draft
      },
    })
    await flush()
    view.find('form')!.dispatchEvent(new Event('submit'))
    await flush()

    expect(submitted).toEqual([{ name: 'Offline' }])
    view.unmount()
  })

  it('lets loaded values override initial values and user edits override both', async () => {
    const submit = vi.fn(async () => undefined)
    const view = mountCore(Form, {
      fields,
      initialData: { name: 'Awal', note: 'awal' },
      load: async () => ({ name: 'Dimuat' }),
      submit,
    })
    await flush()

    expect(inputs(view)[0].value).toBe('Dimuat')
    type(view, 0, 'Diubah')
    view.find('form')!.dispatchEvent(new Event('submit'))
    await flush()

    expect(submit).toHaveBeenCalledWith({ name: 'Diubah', note: 'awal' })
    view.unmount()
  })

  it('validates the visible draft and maps issues to fields', async () => {
    const submit = vi.fn(async () => undefined)
    const view = mountCore(Form, {
      fields,
      schema: fromZod(z.object({ name: z.string().min(3, 'Minimal 3 karakter'), note: z.string().optional() })),
      initialData: { name: 'ab' },
      submit,
    })
    await flush()

    view.find('form')!.dispatchEvent(new Event('submit'))
    await flush()

    expect(submit).not.toHaveBeenCalled()
    expect(view.find('[role="alert"]')?.textContent).toBe('Minimal 3 karakter')
    expect(inputs(view)[0].getAttribute('aria-invalid')).toBe('true')
    view.unmount()
  })

  it('maps normalized server issues back onto fields', async () => {
    mocks.toastError.mockClear()
    const view = mountCore(Form, {
      fields,
      initialData: { name: 'Admin' },
      normalizeError: (error: unknown) => ({
        message: (error as { message: string }).message,
        issues: Object.entries((error as { errors: Record<string, string[]> }).errors).flatMap(([path, messages]) =>
          messages.map((message) => ({ path: [path], message })),
        ),
      }),
      submit: async () => {
        throw { message: 'Ditolak', errors: { name: ['Sudah dipakai'] } }
      },
    })
    await flush()

    view.find('form')!.dispatchEvent(new Event('submit'))
    await flush()

    expect(view.text()).toContain('Sudah dipakai')
    expect(mocks.toastError).toHaveBeenCalledOnce()
    expect(mocks.toastError).toHaveBeenCalledWith('Ditolak')
    view.unmount()
  })

  it('hides a field when behavior says so and excludes it from the payload', async () => {
    const submit = vi.fn(async () => undefined)
    const view = mountCore(Form, {
      fields: {
        mode: { label: 'Mode' },
        cause: { label: 'Sebab', form: { behavior: { visible: ({ draft }: never) => (draft as { mode?: string }).mode === 'a' } } },
      },
      initialData: { mode: 'a', cause: 'terisi' },
      submit,
    })
    await flush()

    expect(inputs(view)).toHaveLength(2)

    type(view, 0, 'b')
    await flush()
    expect(inputs(view)).toHaveLength(1)

    view.find('form')!.dispatchEvent(new Event('submit'))
    await flush()
    expect(submit).toHaveBeenCalledWith({ mode: 'b' })
    view.unmount()
  })

  it('restores an editable field with no stale error when it is shown again', async () => {
    const view = mountCore(Form, {
      fields: {
        mode: { label: 'Mode' },
        cause: { label: 'Sebab', form: { behavior: { visible: ({ draft }: never) => (draft as { mode?: string }).mode === 'a' } } },
      },
      initialData: { mode: 'a', cause: 'terisi' },
      submit: async () => undefined,
    })
    await flush()

    type(view, 0, 'b')
    await flush()
    type(view, 0, 'a')
    await flush()

    const [, cause] = inputs(view)
    expect(cause.value).toBe('terisi')
    expect(cause.disabled).toBe(false)
    view.unmount()
  })

  it('propagates behavior-driven disabled state to inputs', async () => {
    const view = mountCore(Form, {
      fields: {
        mode: { label: 'Mode' },
        cause: { label: 'Sebab', form: { behavior: { disabled: ({ draft }: never) => (draft as { mode?: string }).mode === 'locked' } } },
      },
      initialData: { mode: 'open' },
      submit: async () => undefined,
    })
    await flush()

    expect(inputs(view)[1].disabled).toBe(false)
    type(view, 0, 'locked')
    await flush()
    expect(inputs(view)[1].disabled).toBe(true)
    view.unmount()
  })

  it('writes derived values and cascades resetWhen', async () => {
    const submit = vi.fn(async () => undefined)
    const view = mountCore(Form, {
      fields: {
        quantity: { label: 'Jumlah' },
        total: { label: 'Total', form: { behavior: { derived: ({ draft }: never) => Number((draft as { quantity?: string }).quantity ?? 0) * 2 } } },
        section: { label: 'Ruas' },
        road: { label: 'Jalan', form: { behavior: { resetWhen: ({ draft }: never) => (draft as { section?: string }).section } } },
      },
      initialData: { quantity: '2', section: 'a', road: 'jalan-1' },
      submit,
    })
    await flush()

    expect(inputs(view)[1].value).toBe('4')

    type(view, 2, 'b')
    await flush()

    expect(inputs(view)[3].value).toBe('')
    view.unmount()
  })

  it('does not re-evaluate behavior when an unread field changes', async () => {
    const visible = vi.fn(({ draft }: { draft: Record<string, unknown> }) => draft.mode === 'a')
    const view = mountCore(Form, {
      fields: {
        mode: { label: 'Mode' },
        other: { label: 'Lain' },
        cause: { label: 'Sebab', form: { behavior: { visible } } },
      },
      initialData: { mode: 'a', other: 'x' },
      submit: async () => undefined,
    })
    await flush()

    const evaluations = visible.mock.calls.length
    type(view, 1, 'diubah')
    await flush()

    expect(visible.mock.calls.length).toBe(evaluations)
    view.unmount()
  })

  it('renders registered inputs and slot overrides with the documented context', async () => {
    const Custom = defineComponent({
      props: { value: null, setValue: { type: Function, required: true }, disabled: Boolean },
      setup: (props) => () =>
        h('button', { type: 'button', disabled: props.disabled, onClick: () => props.setValue('dari-renderer') }, String(props.value ?? '')),
    })
    const submit = vi.fn(async () => undefined)
    const view = mountCore(
      Form,
      { fields: { name: { label: 'Nama', form: { renderer: 'custom' } } }, initialData: { name: 'Admin' }, submit },
      { renderers: { form: { custom: Custom } } },
    )
    await flush()

    view.find('button')!.click()
    await flush()
    view.find('form')!.dispatchEvent(new Event('submit'))
    await flush()

    expect(submit).toHaveBeenCalledWith({ name: 'dari-renderer' })
    view.unmount()
  })

  it('supports reset and disabled', async () => {
    const submit = vi.fn(async () => undefined)
    const view = mountCore(Form, { fields, initialData: { name: 'Admin' }, submit })
    await flush()

    type(view, 0, 'Diubah')
    await flush()
    expect(view.exposed().dirty).toBe(true)

    view.exposed().reset()
    await flush()
    expect(inputs(view)[0].value).toBe('Admin')

    const locked = mountCore(Form, { fields, initialData: { name: 'Admin' }, submit, disabled: true })
    await flush()
    expect(inputs(locked)[0].disabled).toBe(true)
    locked.find('form')!.dispatchEvent(new Event('submit'))
    await flush()
    expect(submit).not.toHaveBeenCalled()

    view.unmount()
    locked.unmount()
  })

  it('infers model-bound operation from binding presence, including an undefined model', async () => {
    const emitted: Record<string, unknown>[] = []
    const view = mountCore(Form, {
      fields,
      modelValue: undefined,
      'onUpdate:modelValue': (value: Record<string, unknown>) => emitted.push(value),
    })
    await flush()

    expect(inputs(view)[0].value).toBe('')
    type(view, 0, 'Filter')
    await flush()

    expect(emitted).toEqual([{ name: 'Filter' }])
    expect(view.find('button[type="submit"]')).toBeNull()
    view.unmount()
  })

  it('synchronizes a model-bound Form in both directions without stale keys', async () => {
    const Host = defineComponent({
      setup(_, { expose }) {
        const model = ref<Record<string, unknown>>({ name: 'Awal', note: 'lama' })
        expose({ model })
        return () => h(Form, { fields, modelValue: model.value, 'onUpdate:modelValue': (value: Record<string, unknown>) => (model.value = value) })
      },
    })
    const view = mountCore(Host, {})
    await flush()

    type(view, 0, 'Lokal')
    await flush()
    expect((view.exposed().model as Record<string, unknown>).name).toBe('Lokal')

    view.exposed().model = { name: 'Parent baru' }
    await flush()
    expect(inputs(view)[0].value).toBe('Parent baru')
    expect(inputs(view)[1].value).toBe('')
    view.unmount()
  })

  it('touches validation on blur and focuses first visible invalid field', async () => {
    const view = mountCore(Form, {
      fields,
      schema: fromZod(z.object({ name: z.string().min(3, 'Minimal 3 karakter') })),
      initialData: { name: 'ab' },
      submit: async () => undefined,
    })
    await flush()

    inputs(view)[0].dispatchEvent(new Event('blur'))
    await flush()
    expect(view.text()).toContain('Minimal 3 karakter')

    view.find('form')!.dispatchEvent(new Event('submit'))
    await flush()
    expect(document.activeElement).toBe(inputs(view)[0])
    view.unmount()
  })

  it('renders resolved field spans inside a 12-column grid', async () => {
    const view = mountCore(Form, {
      fields: { name: { label: 'Nama', form: { span: 4 } } },
      submit: async () => undefined,
    })
    await flush()

    expect(view.find('.grid')?.classList.contains('grid-cols-12')).toBe(true)
    expect(view.find('.grid')?.classList.contains('gap-y-5')).toBe(true)
    expect(view.find('.is-form-field')?.getAttribute('style')).toContain('span 4')
    expect(view.find('.is-form-field')?.classList.contains('flex')).toBe(true)
    expect(view.find('.is-form-field')?.classList.contains('gap-2')).toBe(true)
    view.unmount()
  })

  it('associates labels and errors with their inputs', async () => {
    const view = mountCore(Form, {
      fields,
      schema: fromZod(z.object({ name: z.string().min(3, 'Minimal 3 karakter') })),
      initialData: { name: 'ab' },
      submit: async () => undefined,
    })
    await flush()
    view.find('form')!.dispatchEvent(new Event('submit'))
    await flush()

    const input = inputs(view)[0]
    const label = view.find('label')!
    expect(label.getAttribute('for')).toBe(input.id)
    expect(label.classList.contains('font-medium')).toBe(true)
    expect(input.getAttribute('aria-describedby')).toBe(view.find('[role="alert"]')!.id)
    expect(view.find(`#${input.getAttribute('aria-describedby')}`)?.classList.contains('text-error')).toBe(true)
    view.unmount()
  })

  it('marks schema-required labels and controls once', async () => {
    const view = mountCore(Form, {
      fields,
      schema: fromZod(z.object({ name: z.string(), note: z.string().optional() })),
      submit: async () => undefined,
    })
    await flush()

    const labels = view.all('label')
    expect(labels[0]?.textContent).toContain('Nama')
    expect(labels[0]?.textContent).toContain('*')
    expect(labels[0]?.querySelectorAll('.text-error')).toHaveLength(1)
    expect(labels[1]?.textContent).not.toContain('*')
    expect(inputs(view)[0]?.getAttribute('aria-required')).toBe('true')
    expect(inputs(view)[1]?.getAttribute('aria-required')).toBeNull()
    view.unmount()
  })

  it('composes async validators after parsed schema data and toasts root failures', async () => {
    mocks.toastError.mockClear()
    const seen: unknown[] = []
    const submit = vi.fn(async () => undefined)
    const view = mountCore(Form, {
      fields,
      schema: fromZod(z.object({ name: z.string().transform((value) => value.trim()) })),
      initialData: { name: ' Admin ' },
      validators: [({ data }) => { seen.push(data); return { path: [], message: 'Form ditolak' } }],
      submit,
    })
    await flush()
    view.find('form')!.dispatchEvent(new Event('submit'))
    await flush()
    expect(seen).toEqual([{ name: 'Admin' }])
    expect(submit).not.toHaveBeenCalled()
    expect(mocks.toastError).toHaveBeenCalledOnce()
    expect(mocks.toastError).toHaveBeenCalledWith('Form ditolak')
    expect(view.find('#form-errors')).toBeNull()
    expect(view.text()).not.toContain('Form ditolak')
    view.unmount()
  })

  it('renders retry feedback and default submit controls with framework states', async () => {
    let attempts = 0
    const loading = mountCore(Form, {
      fields,
      load: async () => {
        attempts += 1
        throw new Error('Gagal memuat')
      },
      submit: async () => undefined,
    })
    await flush()

    const loadError = loading.find('[role="alert"]')!
    expect(loadError.parentElement?.classList.contains('bg-error-container')).toBe(true)
    loading.all('button').find((button) => button.textContent === 'Retry')!.click()
    await flush()
    expect(attempts).toBe(2)
    loading.unmount()

    const pending = deferred<void>()
    const submitting = mountCore(Form, {
      fields,
      validators: [async () => {
        await pending.promise
      }],
      submit: async () => undefined,
    })
    await flush()
    const submit = submitting.find<HTMLButtonElement>('button[type="submit"]')!
    expect(submit.classList.contains('bg-primary')).toBe(true)
    submitting.find('form')!.dispatchEvent(new Event('submit'))
    await flush()
    expect(submit.disabled).toBe(true)
    pending.resolve()
    await flush()
    submitting.unmount()
  })

  it('keeps input and control slots as full visual replacements', async () => {
    const view = mountCore(Form, { fields, submit: async () => undefined }, {
      slots: {
        'input:name': () => h('span', { 'data-input-slot': '' }, 'Input khusus'),
        actions: () => h('button', { type: 'button', 'data-actions-slot': '' }, 'Custom action'),
      },
    })
    await flush()

    expect(view.find('[data-input-slot]')).not.toBeNull()
    expect(view.find('[data-actions-slot]')).not.toBeNull()
    expect(view.find('button[type="submit"]')).toBeNull()
    view.unmount()
  })

  it('aborts stale async validation and never publishes its rejection', async () => {
    const first = deferred<{ path: string[]; message: string } | undefined>()
    let calls = 0
    let aborted = false
    const view = mountCore(Form, {
      fields,
      initialData: { name: 'Admin' },
      validators: [{ path: ['name'], validate: ({ signal }) => {
        calls += 1
        if (calls === 1) {
          signal.addEventListener('abort', () => { aborted = true })
          return first.promise
        }
      } }],
      submit: async () => undefined,
    })
    await flush()
    inputs(view)[0].dispatchEvent(new Event('blur'))
    await flush()
    inputs(view)[0].dispatchEvent(new Event('blur'))
    await flush()
    first.resolve({ path: ['name'], message: 'Terlambat' })
    await flush()
    expect(aborted).toBe(true)
    expect(view.text()).not.toContain('Terlambat')
    view.unmount()
  })
})
