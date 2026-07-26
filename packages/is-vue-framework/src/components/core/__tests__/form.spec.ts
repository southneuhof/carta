import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { z } from 'zod'
import Form from '../Form.vue'
import { fromZod } from '../../../validation'
import { flush, mountCore } from './harness'

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
    expect(input.getAttribute('aria-describedby')).toBe(view.find('[role="alert"]')!.id)
    view.unmount()
  })
})
