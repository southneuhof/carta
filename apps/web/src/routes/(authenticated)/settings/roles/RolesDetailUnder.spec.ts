import { shallowMount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  put: vi.fn().mockResolvedValue({ ok: true }),
  del: vi.fn().mockResolvedValue({ ok: true }),
  triggerChange: vi.fn(),
}))

vi.mock('@/framework/rpc', () => ({
  rpc: {
    roles: {
      ':roleId': {
        permissions: {
          $get: vi.fn(),
          ':permissionId': { $put: mocks.put, $delete: mocks.del },
        },
      },
    },
  },
}))
vi.mock('@/stores/keyManager', () => ({ keyManager: () => ({ triggerChange: mocks.triggerChange }) }))
vi.mock('vue-sonner', () => ({ toast: { success: vi.fn() } }))
vi.mock('@southneuhof/is-vue-framework/adapters/crud-operations', () => ({
  defineCRUDCompositeConfig: (config: unknown) => config,
}))

import RolesDetailUnder from './RolesDetailUnder.vue'

const SwitchStub = defineComponent({
  name: 'Switch',
  props: { onToggle: { type: Function, required: true } },
  setup(_, { expose }) {
    expose()
    return () => h('button')
  },
})

function mountRoles(row: { id: string; active: boolean }) {
  const CRUDCompositeStub = defineComponent({
    name: 'CRUDComposite',
    setup(_, { slots }) {
      return () => h('div', slots['list-rowActions']?.({ data: row }))
    },
  })

  return shallowMount(RolesDetailUnder, {
    global: {
      provide: { data: ref({ id: 'role-7' }) },
      stubs: {
        CRUDComposite: CRUDCompositeStub,
        Switch: SwitchStub,
        DialogForm: true,
        Button: true,
        Icon: true,
      },
    },
  })
}

describe('RolesDetailUnder permission toggles', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses PUT with the role and permission IDs when enabling a permission', () => {
    const wrapper = mountRoles({ id: 'permission-3', active: false })
    const onToggle = wrapper.findComponent(SwitchStub).props('onToggle') as (nextValue: boolean) => unknown

    onToggle(true)

    expect(mocks.put).toHaveBeenCalledExactlyOnceWith({ param: { roleId: 'role-7', permissionId: 'permission-3' } })
    expect(mocks.del).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('uses DELETE with the role and permission IDs when disabling a permission', () => {
    const wrapper = mountRoles({ id: 'permission-3', active: true })
    const onToggle = wrapper.findComponent(SwitchStub).props('onToggle') as (nextValue: boolean) => unknown

    onToggle(false)

    expect(mocks.del).toHaveBeenCalledExactlyOnceWith({ param: { roleId: 'role-7', permissionId: 'permission-3' } })
    expect(mocks.put).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
