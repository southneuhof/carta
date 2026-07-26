import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import { createRendererRegistries, createRendererRegistry, useRendererRegistries } from '../registry'
import { FrameworkPlugin } from '../../adapters/plugin'

const Chip = defineComponent({ name: 'Chip', setup: () => () => h('span') })
const ProjectChip = defineComponent({ name: 'ProjectChip', setup: () => () => h('em') })

function mountWithRenderers(renderers: Parameters<typeof createRendererRegistries>[0]) {
  let registries: ReturnType<typeof useRendererRegistries> | undefined
  const app = createApp(
    defineComponent({
      setup() {
        registries = useRendererRegistries()
        return () => h('div')
      },
    }),
  )
  app.use(FrameworkPlugin, { runtime: {}, renderers })
  app.mount(document.createElement('div'))
  return { app, registries: registries! }
}

describe('renderer registry', () => {
  it('looks up registered renderers per surface', () => {
    const registry = createRendererRegistry('table', { chip: Chip })

    expect(registry.get('chip')).toBe(Chip)
    expect(registry.has('chip')).toBe(true)
    expect(registry.keys()).toEqual(['chip'])
  })

  it('reports missing keys with the registered alternatives', () => {
    const registry = createRendererRegistry('form', { text: Chip })

    expect(() => registry.require('date')).toThrow('No form renderer registered for "date". Registered: text.')
    expect(() => createRendererRegistry('table').require('chip')).toThrow('Registered: none.')
  })

  it('lets a later registration override an earlier one', () => {
    const registry = createRendererRegistry('detail', { chip: Chip })
    registry.register('chip', ProjectChip)

    expect(registry.get('chip')).toBe(ProjectChip)
  })

  it('keeps surfaces independent', () => {
    const registries = createRendererRegistries({ table: { chip: Chip }, form: { text: ProjectChip } })

    expect(registries.table.has('text')).toBe(false)
    expect(registries.form.has('chip')).toBe(false)
  })

  it('isolates registries between apps', () => {
    const first = mountWithRenderers({ table: { chip: Chip } })
    const second = mountWithRenderers({ table: { chip: ProjectChip } })

    expect(first.registries.table.get('chip')).toBe(Chip)
    expect(second.registries.table.get('chip')).toBe(ProjectChip)

    first.registries.table.register('extra', Chip)
    expect(second.registries.table.has('extra')).toBe(false)

    first.app.unmount()
    second.app.unmount()
  })
})
