import { defineComponent, h, type PropType } from 'vue'
import type { RendererRegistriesInput } from '@southneuhof/is-vue-framework'
import Chip from '@southneuhof/is-vue-framework/components/base/Chip.vue'

interface ChipOption {
  color?: string
  label?: string
}

const chipRenderer = defineComponent({
  name: 'AppFieldChipRenderer',
  props: {
    value: { type: null, default: undefined },
    options: {
      type: Object as PropType<Record<string, ChipOption>>,
      default: () => ({}),
    },
  },
  setup(props) {
    return () => {
      const option = props.options[String(props.value)]
      return h(Chip, { color: option?.color as never }, () => option?.label ?? String(props.value ?? '-'))
    }
  },
})

const textBlockRenderer = defineComponent({
  name: 'AppFieldTextBlockRenderer',
  props: { value: { type: null, default: undefined } },
  setup: (props) => () => h('div', { class: 'whitespace-pre-wrap' }, String(props.value ?? '-')),
})

const fileRenderer = defineComponent({
  name: 'AppFieldFileRenderer',
  props: { value: { type: null, default: undefined } },
  setup(props) {
    return () => {
      const files = Array.isArray(props.value) ? props.value : [props.value]
      return h(
        'div',
        { class: 'flex flex-col gap-1' },
        files.filter(Boolean).map((file) => {
          const record = typeof file === 'object' ? (file as Record<string, unknown>) : undefined
          const url = String(record?.url ?? file)
          const label = String(record?.filename ?? record?.name ?? url.split('/').pop() ?? url)
          return h('a', { href: url, target: '_blank', rel: 'noopener noreferrer', class: 'text-info underline' }, label)
        })
      )
    }
  },
})

const arrayRenderer = defineComponent({
  name: 'AppFieldArrayRenderer',
  props: { value: { type: null, default: undefined } },
  setup(props) {
    return () =>
      h(
        'ul',
        { class: 'list-disc ps-5' },
        (Array.isArray(props.value) ? props.value : [props.value]).filter(Boolean).map((item) => h('li', String(typeof item === 'object' ? JSON.stringify(item) : item)))
      )
  },
})

const displayRenderers = {
  chip: chipRenderer,
  html: textBlockRenderer,
  file: fileRenderer,
  'array-clauses': arrayRenderer,
}

export const appFieldRenderers = {
  table: displayRenderers,
  detail: displayRenderers,
} satisfies RendererRegistriesInput
