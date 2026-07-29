/**
 * Core-compatible adapters for framework input components.
 *
 * Existing inputs speak Vue's `modelValue` contract while core Form exposes
 * `value` and `setValue`. Keep that compatibility boundary here so resource
 * forms and project overrides share one renderer registry.
 */
import { defineAsyncComponent, defineComponent, h, type Component } from 'vue'
import { twMerge } from 'tailwind-merge'

const coreTextRenderer = defineComponent({
  name: 'CoreTextRenderer',
  inheritAttrs: false,
  props: {
    value: { type: null, default: undefined },
    setValue: { type: Function, required: true },
    disabled: Boolean,
    error: String,
    id: String,
  },
  emits: ['validation:touch'],
  setup(props, { attrs, emit }) {
    return () => {
      const { class: className, ...inputAttrs } = attrs
      return h('div', {
        class: twMerge(
          'flex min-h-12 items-center rounded-lg bg-transparent px-4 py-3 text-on-surface outline outline-1 outline-outline/[24%] transition-[outline-color,box-shadow] duration-150 ease-out focus-within:outline-secondary focus-within:ring-1 focus-within:ring-secondary/30',
          props.error ? 'outline-error focus-within:outline-error focus-within:ring-error/30' : '',
          props.disabled ? 'cursor-not-allowed text-on-surface-variant opacity-60' : '',
          className as string | undefined,
        ),
      }, h('input', {
        ...inputAttrs,
        id: props.id,
        value: props.value ?? '',
        disabled: props.disabled,
        class: 'min-w-0 w-full bg-transparent text-inherit outline-none placeholder:text-on-surface-variant focus-visible:outline-none disabled:cursor-not-allowed',
        onInput: (event: Event) => props.setValue((event.target as HTMLInputElement).value),
        onBlur: () => emit('validation:touch'),
      }))
    }
  },
})

function legacyComponent(input: Component): Component {
  return defineComponent({
    name: 'CoreFormRendererAdapter',
    inheritAttrs: false,
    props: {
      value: { type: null, default: undefined },
      setValue: { type: Function, required: true },
      disabled: Boolean,
      error: String,
      id: String,
      draft: { type: Object, default: undefined },
      field: { type: Object, default: undefined },
      touched: Boolean,
      validating: Boolean,
      formValidating: Boolean,
    },
    emits: ['validation:touch'],
    setup(props, { attrs, emit }) {
      return () => h(input, {
        ...attrs,
        id: props.id,
        disabled: props.disabled,
        error: props.error,
        modelValue: props.value,
        'onUpdate:modelValue': (value: unknown) => props.setValue(value),
        'onValidation:touch': () => emit('validation:touch'),
      })
    },
  })
}

function legacyInput(loader: () => Promise<{ default: Component }>): Component {
  return legacyComponent(defineAsyncComponent(loader))
}

/** Stable built-in renderer keys. Applications may override any entry. */
export const builtInFormRenderers: Record<string, Component> = {
  text: coreTextRenderer,
  textarea: legacyInput(() => import('../components/inputs/TextareaInput.vue')),
  password: legacyInput(() => import('../components/inputs/PasswordInput.vue')),
  number: legacyInput(() => import('../components/inputs/NumberInput.vue')),
  currency: legacyInput(() => import('../components/inputs/NumberInput.vue')),
  select: legacyInput(() => import('../components/inputs/SelectInput.vue')),
  radio: legacyInput(() => import('../components/inputs/RadioGroupInput.vue')),
  date: legacyInput(() => import('../components/inputs/DateInput.vue')),
  daterange: legacyInput(() => import('../components/inputs/DateRangeInput.vue')),
  month: legacyInput(() => import('../components/inputs/MonthInput.vue')),
  year: legacyInput(() => import('../components/inputs/YearInput.vue')),
  time: legacyInput(() => import('../components/inputs/TimeInput.vue')),
  checkbox: legacyInput(() => import('../components/inputs/CheckboxInput.vue')),
  'checkbox-group': legacyInput(() => import('../components/inputs/CheckboxGroupInput.vue')),
  switch: legacyInput(() => import('../components/inputs/Switch.vue')),
  file: legacyInput(() => import('../components/inputs/FileInput.vue')),
  image: legacyInput(() => import('../components/inputs/ImageInput.vue')),
  tag: legacyInput(() => import('../components/inputs/TagInput.vue')),
  color: legacyInput(() => import('../components/inputs/ColorInput.vue')),
  lookup: legacyInput(() => import('../components/composites/form-inputs/LookupInput.vue')),
  location: legacyInput(() => import('../components/composites/form-inputs/LocationInput.vue')),
  'multi-location': legacyInput(() => import('../components/composites/form-inputs/MultiLocationInput.vue')),
  'rich-text': legacyInput(() => import('../components/inputs/RichTextInput.vue')),
  'icon-select': legacyInput(() => import('../components/inputs/IconSelectInput.vue')),
  table: legacyInput(() => import('../components/composites/form-inputs/TableInput.vue')),
  separator: legacyInput(() => import('../components/composites/form-inputs/FormSeparator.vue')),
  canvas: legacyInput(() => import('../components/inputs/DrawingCanvas.vue')),
  'iso-clause': legacyInput(() => import('../components/inputs/ISOClauseInput.vue')),
}
