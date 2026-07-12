import { shallowMount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  post: vi.fn().mockResolvedValue({ ok: true }),
  route: { query: {} },
}))

vi.mock('@/utils/services', () => ({ default: mocks }))
vi.mock('vue-router', () => ({ useRoute: () => mocks.route }))
vi.mock('@southneuhof/is-vue-framework/adapters/crud-operations', () => ({
  defineCRUDCompositeConfig: (config: unknown) => config,
}))

import UsersMappingRole from './UsersMappingRole.vue'

const SwitchStub = defineComponent({
  name: 'Switch',
  props: { onToggle: { type: Function, required: true } },
  setup() {
    return () => h('button')
  },
})

function mountUserRoles(row: { id: string; active: boolean }) {
  const CRUDCompositeStub = defineComponent({
    name: 'CRUDComposite',
    setup(_, { slots }) {
      return () => h('div', slots['list-rowActions']?.({ data: row }))
    },
  })

  return shallowMount(UsersMappingRole, {
    global: {
      provide: { data: ref({ id: 42 }) },
      stubs: {
        CRUDComposite: CRUDCompositeStub,
        Switch: SwitchStub,
      },
    },
  })
}

describe('UsersMappingRole toggles', () => {
  beforeEach(() => vi.clearAllMocks())

  it('posts the resolved user, role, and next active value', () => {
    const wrapper = mountUserRoles({ id: '7', active: false })
    const onToggle = wrapper.findComponent(SwitchStub).props('onToggle') as (nextValue: boolean) => unknown

    onToggle(true)

    expect(mocks.post).toHaveBeenCalledExactlyOnceWith('mapping-user-roles/toggle', {
      user_id: 42,
      role_id: '7',
      active: true,
    })
    wrapper.unmount()
  })
})
