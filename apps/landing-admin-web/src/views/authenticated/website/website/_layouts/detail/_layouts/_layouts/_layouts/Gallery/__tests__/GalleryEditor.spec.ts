import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

const servicesMock = vi.hoisted(() => ({
  put: vi.fn(async () => ({})),
  delete: vi.fn(async () => ({})),
}))

vi.mock('@/utils/services', () => ({
  default: servicesMock,
}))

vi.mock('@/stores/keyManager', () => ({
  keyManager: () => ({
    value: {},
    triggerChange: vi.fn(),
  }),
}))

import GalleryEditor from '../GalleryEditor.vue'

const BaseStub = defineComponent({
  inheritAttrs: false,
  template: '<div v-bind="$attrs"><slot /><slot name="icon" /><slot name="trigger" /></div>',
})

const ButtonStub = defineComponent({
  emits: ['click'],
  inheritAttrs: false,
  template: '<button v-bind="$attrs" @click="$emit(\'click\', $event)"><slot /><slot name="icon" /></button>',
})

const TableStub = defineComponent({
  props: {
    onDataLoaded: { type: Function, default: undefined },
  },
  data() {
    return {
      row: { id: 'content-1', title: 'Gallery Item', media: '/existing.png' },
    }
  },
  mounted() {
    this.onDataLoaded?.()
  },
  template: `
    <div>
      <slot name="list-rowActions" :data="row" />
    </div>
  `,
})

const FormStub = defineComponent({
  props: {
    getInitialData: { type: Function, required: true },
    inputConfig: { type: Object, default: () => ({}) },
    beforeSubmit: { type: Function, default: undefined },
  },
  data() {
    return {
      initialData: null as Record<string, unknown> | null,
    }
  },
  async mounted() {
    this.initialData = await this.getInitialData()
  },
  computed: {
    mediaInputType(): string {
      const generator = (this.inputConfig as any)?.media?.dependency?.inputConfig?.generator
      if (!generator || !this.initialData) return ''
      return generator({ meta: (this.initialData as any).meta })?.type ?? ''
    },
    strippedPayload(): Record<string, unknown> {
      if (!this.beforeSubmit || !this.initialData) return {}
      return this.beforeSubmit({ formData: { ...(this.initialData as any) } }) as Record<string, unknown>
    },
  },
  template: `
    <div
      data-testid="form-stub"
      :data-meta-type="initialData?.meta?.gallery_media_type ?? ''"
      :data-media-input-type="mediaInputType"
      :data-has-meta="String(Boolean(initialData?.meta))"
      :data-submitted-has-meta="String(Object.prototype.hasOwnProperty.call(strippedPayload, 'meta'))"
    />
  `,
})

function mountGalleryEditor(initialMetaType = 'icon') {
  return mount(GalleryEditor, {
    props: {
      galleryID: 'gallery-1',
      sectionData: {
        id: 'section-1',
        meta: {
          gallery_media_type: initialMetaType,
        },
      },
      slotConfig: {
        key: 'gallery',
        type: 'gallery',
        order: 3,
        many: true,
        label: 'Gallery Items',
        fields: ['media', 'title', 'subtitle', 'url', 'url_text'],
        inputConfig: {
          media: {
            type: 'image',
            dependency: {
              fields: ['meta'],
              inputConfig: {
                generator: ({ meta }: any) => ({
                  type: meta?.gallery_media_type === 'embed'
                    ? 'embed'
                    : meta?.gallery_media_type === 'icon'
                      ? 'icon-select'
                      : 'image',
                }),
                default: { type: 'image' },
              },
            },
          },
        },
      },
    },
    global: {
      provide: {
        pageTranslation: ref({ id: 'pt-1', status_code: 'DRAFT' }),
        sectionData: ref({ id: 'section-1' }),
      },
      stubs: {
        Card: BaseStub,
        Icon: BaseStub,
        Spinner: BaseStub,
        Button: ButtonStub,
        Table: TableStub,
        Form: FormStub,
        Detail: BaseStub,
        ConfirmationDialog: BaseStub,
      },
    },
  })
}

function findButtonByText(wrapper: ReturnType<typeof mount>, text: string) {
  const button = wrapper.findAll('button').find((item) => item.text().includes(text))
  if (!button) throw new Error(`Button with text "${text}" not found`)
  return button
}

function findButtonByAriaLabel(wrapper: ReturnType<typeof mount>, label: string) {
  const button = wrapper.findAll('button').find((item) => item.attributes('aria-label') === label)
  if (!button) throw new Error(`Button with aria-label "${label}" not found`)
  return button
}

describe('GalleryEditor', () => {
  beforeEach(() => {
    servicesMock.put.mockClear()
    servicesMock.delete.mockClear()
  })

  it('passes section meta into create form context and strips synthetic meta before submit', async () => {
    const wrapper = mountGalleryEditor('icon')
    await flushPromises()

    await findButtonByAriaLabel(wrapper, 'Toggle gallery').trigger('click')
    await flushPromises()
    await findButtonByText(wrapper, 'Tambah').trigger('click')
    await flushPromises()

    const form = wrapper.get('[data-testid="form-stub"]')
    expect(form.attributes('data-meta-type')).toBe('icon')
    expect(form.attributes('data-media-input-type')).toBe('icon-select')
    expect(form.attributes('data-submitted-has-meta')).toBe('false')
  })

  it('remounts update form with image media input when gallery type changes to Foto', async () => {
    const wrapper = mountGalleryEditor('icon')
    await flushPromises()

    await findButtonByAriaLabel(wrapper, 'Toggle gallery').trigger('click')
    await flushPromises()
    await findButtonByAriaLabel(wrapper, 'Ubah data').trigger('click')
    await flushPromises()

    let form = wrapper.get('[data-testid="form-stub"]')
    expect(form.attributes('data-meta-type')).toBe('icon')
    expect(form.attributes('data-media-input-type')).toBe('icon-select')

    await wrapper.setProps({
      sectionData: {
        id: 'section-1',
        meta: {
          gallery_media_type: 'image',
        },
      },
    })
    await nextTick()
    await flushPromises()

    form = wrapper.get('[data-testid="form-stub"]')
    expect(form.attributes('data-meta-type')).toBe('image')
    expect(form.attributes('data-media-input-type')).toBe('image')
    expect(form.attributes('data-submitted-has-meta')).toBe('false')
  })
})
