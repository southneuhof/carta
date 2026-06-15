import { defineAsyncComponent, type AsyncComponentLoader, type Component } from 'vue'

export type FrameworkInputComponent = Component | AsyncComponentLoader<Component>
export type FrameworkInputRegistry = Record<string, FrameworkInputComponent>

const builtInInputComponents: Record<string, Component> = {
  text: defineAsyncComponent(() => import('../components/inputs/TextInput.vue')),
  textarea: defineAsyncComponent(() => import('../components/inputs/TextareaInput.vue')),
  color: defineAsyncComponent(() => import('../components/inputs/ColorInput.vue')),
  password: defineAsyncComponent(() => import('../components/inputs/PasswordInput.vue')),
  file: defineAsyncComponent(() => import('../components/inputs/FileInput.vue')),
  image: defineAsyncComponent(() => import('../components/inputs/ImageInput.vue')),
  select: defineAsyncComponent(() => import('../components/inputs/SelectInput.vue')),
  radio: defineAsyncComponent(() => import('../components/inputs/RadioGroupInput.vue')),
  date: defineAsyncComponent(() => import('../components/inputs/DateInput.vue')),
  daterange: defineAsyncComponent(() => import('../components/inputs/DateRangeInput.vue')),
  month: defineAsyncComponent(() => import('../components/inputs/MonthInput.vue')),
  year: defineAsyncComponent(() => import('../components/inputs/YearInput.vue')),
  tag: defineAsyncComponent(() => import('../components/inputs/TagInput.vue')),
  currency: defineAsyncComponent(() => import('../components/inputs/CurrencyInput.vue')),
  switch: defineAsyncComponent(() => import('../components/inputs/Switch.vue')),
  checkbox: defineAsyncComponent(() => import('../components/inputs/CheckboxInput.vue')),
  lookup: defineAsyncComponent(() => import('../components/inputs/LookupInput.vue')),
  'master-lookup': defineAsyncComponent(() => import('../components/inputs/MasterLookupInput.vue')),
  location: defineAsyncComponent(() => import('../components/inputs/LocationInput.vue')),
  'multi-location': defineAsyncComponent(() => import('../components/inputs/MultiLocationInput.vue')),
  'rich-text': defineAsyncComponent(() => import('../components/inputs/RichTextInput.vue')),
  'icon-select': defineAsyncComponent(() => import('../components/inputs/IconSelectInput.vue')),
  table: defineAsyncComponent(() => import('../components/inputs/TableInput.vue')),
  time: defineAsyncComponent(() => import('../components/inputs/TimeInput.vue')),
  'dynamic-form': defineAsyncComponent(() => import('../components/inputs/DynamicFormInput.vue')),
  number: defineAsyncComponent(() => import('../components/inputs/NumberInput.vue')),
  'checkbox-group': defineAsyncComponent(() => import('../components/inputs/CheckboxGroupInput.vue')),
  separator: defineAsyncComponent(() => import('../components/inputs/FormSeparator.vue')),
  canvas: defineAsyncComponent(() => import('../components/inputs/DrawingCanvas.vue')),
  'file-manager': defineAsyncComponent(() => import('../components/inputs/FileManager/FileManagerInput.vue')),
  'iso-clause': defineAsyncComponent(() => import('../components/inputs/ISOClauseInput.vue')),
}

let appInputComponents: Record<string, Component> = {}

function normalizeInputComponent(component: FrameworkInputComponent): Component {
  if (typeof component === 'function') {
    return defineAsyncComponent(component as AsyncComponentLoader<Component>)
  }

  return component
}

export function registerInputComponents(inputs: FrameworkInputRegistry): void {
  const nextComponents: Record<string, Component> = {}
  for (const [key, component] of Object.entries(inputs)) {
    nextComponents[key] = normalizeInputComponent(component)
  }
  appInputComponents = { ...appInputComponents, ...nextComponents }
}

export function resolveInputComponent(type: string): Component | undefined {
  return getInputComponentRegistry()[type]
}

export function resetInputComponentRegistryForTests(): void {
  appInputComponents = {}
}

export function getInputComponentRegistry(): Record<string, Component> {
  return { ...builtInInputComponents, ...appInputComponents }
}
