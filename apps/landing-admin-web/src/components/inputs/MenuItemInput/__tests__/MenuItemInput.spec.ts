import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'

const servicesMock = vi.hoisted(() => ({
  list: vi.fn(),
}))

vi.mock('@/utils/services', () => ({
  default: servicesMock,
}))

import MenuItemInput from '../MenuItemInput.vue'

const BaseInputStub = defineComponent({
  inheritAttrs: false,
  template: '<div><slot /></div>',
})

const DialogStub = defineComponent({
  props: { open: { type: Boolean, default: false } },
  emits: ['update:open'],
  template: `
    <div>
      <slot name="trigger" />
      <slot name="content" :setOpen="(value) => $emit('update:open', value)" />
    </div>
  `,
})

const ButtonStub = defineComponent({
  emits: ['click'],
  inheritAttrs: false,
  template: '<button v-bind="$attrs" @click="$emit(\'click\', $event)"><slot /><slot name="icon" /></button>',
})

const IconStub = defineComponent({
  template: '<i><slot /></i>',
})

const MenuItemInputViewStub = defineComponent({
  props: {
    level: { type: Number, required: true },
    selectedId: { type: String, default: undefined },
    parentId: { type: String, default: undefined },
  },
  emits: ['update:selectedId', 'item-selected'],
  template: '<div :data-level="level" :data-selected-id="selectedId" :data-parent-id="parentId"></div>',
})

async function mountInput(initialValue = '/parent/child') {
  const model = ref(initialValue)
  const wrapper = mount(MenuItemInput, {
    props: {
      modelValue: model.value,
      'onUpdate:modelValue': (value?: string) => {
        model.value = value
        return wrapper.setProps({ modelValue: value })
      },
    },
    global: {
      stubs: {
        BaseInput: BaseInputStub,
        Dialog: DialogStub,
        Button: ButtonStub,
        Icon: IconStub,
        MenuItemInputView: MenuItemInputViewStub,
      },
    },
  })

  await flushPromises()
  return { wrapper, model }
}

describe('MenuItemInput', () => {
  beforeEach(() => {
    servicesMock.list.mockReset()
    servicesMock.list.mockImplementation(async (_model: string, params: Record<string, unknown>) => {
      if (params.level === 1) {
        return { data: [{ id: 'm1', slug: 'parent', name: 'Parent' }] }
      }

      if (params.level === 2 && params.parent_id === 'm1') {
        return { data: [{ id: 'm2', slug: 'child', name: 'Child' }] }
      }

      return { data: [] }
    })
  })

  it('initializes from an existing path and clears on confirm without rehydrating the old url', async () => {
    const { wrapper, model } = await mountInput('/parent/child')

    expect(wrapper.text()).toContain('/parent/child')
    expect(servicesMock.list).toHaveBeenCalled()

    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')
    await nextTick()
    await buttons[2].trigger('click')
    await flushPromises()

    expect(model.value).toBeUndefined()
    expect(wrapper.text()).not.toContain('/parent/child')
    expect(wrapper.text()).toContain('Pilih menu')
  })
})
