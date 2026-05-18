import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

const state = vi.hoisted(() => ({
  childStructure: [{ id: 'nested-gallery', type: 'gallery', order: 1 }] as Array<{ id: string; type: string; order: number }>,
}))

const servicesMock = vi.hoisted(() => ({
  detail: vi.fn(async (model: string, id: string) => {
    if (model === 'section' && id === 'root-data-list') {
      return {
        data: {
          id: 'root-data-list',
          name: 'Data List',
          section_type_code: 'data-list',
          meta: { type: 'list' },
          visible: true,
          updated_at: '2026-05-18T00:00:00.000Z',
          structure: [
            { id: 'header-content', type: 'content', order: 1 },
            { id: 'child-group', type: 'sectionGroup', order: 2 },
          ],
        },
      }
    }

    if (model === 'sectionGroup' && id === 'child-group') {
      return {
        data: {
          id: 'child-group',
          sections: [{ id: 'child-section-1', name: 'Child Section 1' }],
        },
      }
    }

    if (model === 'section' && id === 'child-section-1') {
      return {
        data: {
          id: 'child-section-1',
          name: 'Child Section 1',
          section_type_code: null,
          visible: true,
          updated_at: '2026-05-18T00:00:00.000Z',
          structure: state.childStructure,
        },
      }
    }

    throw new Error(`Unexpected detail call: ${model}/${id}`)
  }),
  update: vi.fn(async () => ({})),
  delete: vi.fn(async () => ({})),
  post: vi.fn(async () => ({})),
  put: vi.fn(async () => ({})),
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

import SectionEditor from '@/views/authenticated/website/website/_layouts/detail/_layouts/_layouts/SectionEditor.vue'

const BaseStub = defineComponent({
  inheritAttrs: false,
  template: '<div v-bind="$attrs"><slot /><slot name="trigger" /><slot name="content" /><slot name="icon" /></div>',
})

const ButtonStub = defineComponent({
  emits: ['click'],
  inheritAttrs: false,
  template: '<button v-bind="$attrs" @click="$emit(\'click\', $event)"><slot /><slot name="icon" /></button>',
})

const DraggableStub = defineComponent({
  props: { modelValue: { type: Array, default: () => [] } },
  template: `
    <div>
      <template v-for="(element, index) in modelValue" :key="element.id ?? index">
        <slot name="item" :element="element" :index="index"></slot>
      </template>
    </div>
  `,
})

const AsyncComponentWrapperStub = defineComponent({
  name: 'AsyncComponentWrapperStub',
  props: {
    objectID: { type: String, required: true },
    sectionData: { type: Object, required: true },
    slotConfig: { type: Object, required: true },
  },
  template:
    '<div data-testid="data-list-gallery-editor" :data-object-id="objectID" :data-section-id="sectionData.id" :data-parent-id="sectionData.parentSectionData?.id" :data-parent-type="sectionData.parentSectionData?.meta?.type"></div>',
})

const mountSectionEditor = async () => {
  const Harness = defineComponent({
    components: { SectionEditor },
    template: '<Suspense><SectionEditor sectionID="root-data-list" :asChild="true" /></Suspense>',
  })

  const wrapper = mount(Harness, {
    global: {
      provide: {
        pageTranslation: ref({ id: 'pt-1', status_code: 'DRAFT' }),
      },
      stubs: {
        Card: BaseStub,
        Icon: BaseStub,
        Spinner: BaseStub,
        Popover: BaseStub,
        ConfirmationDialog: BaseStub,
        Dialog: BaseStub,
        SectionSettings: BaseStub,
        UnsupportedSectionPanel: BaseStub,
        ContentEditor: BaseStub,
        GalleryEditor: BaseStub,
        SectionAddWizard: BaseStub,
        Button: ButtonStub,
        Draggable: DraggableStub,
        AsyncComponentWrapper: AsyncComponentWrapperStub,
      },
    },
  })
  await flushPromises()
  return wrapper
}

function findGroupToggle(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('button').find((btn) => btn.text().includes('expand_more') || btn.text().includes('expand_less'))
}

describe('data-list recursive rendering', () => {
  beforeEach(() => {
    state.childStructure = [{ id: 'nested-gallery', type: 'gallery', order: 1 }]
    servicesMock.detail.mockClear()
  })

  it('renders nested data-list gallery editor with gallery id and parent data-list context', async () => {
    const wrapper = await mountSectionEditor()

    const groupToggle = findGroupToggle(wrapper)
    expect(groupToggle).toBeDefined()
    await groupToggle!.trigger('click')
    await flushPromises()

    const editors = wrapper.findAll('[data-testid="data-list-gallery-editor"]')
    expect(editors).toHaveLength(1)
    expect(editors[0].attributes('data-object-id')).toBe('nested-gallery')
    expect(editors[0].attributes('data-section-id')).toBe('child-section-1')
    expect(editors[0].attributes('data-parent-id')).toBe('root-data-list')
    expect(editors[0].attributes('data-parent-type')).toBe('list')
    expect(editors.some((node) => node.attributes('data-object-id') === 'child-group')).toBe(false)
  })

  it('shows fallback when nested gallery placeholder is missing', async () => {
    state.childStructure = []
    const wrapper = await mountSectionEditor()

    const groupToggle = findGroupToggle(wrapper)
    await groupToggle!.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="data-list-gallery-editor"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('No data found for this slot.')
  })
})
