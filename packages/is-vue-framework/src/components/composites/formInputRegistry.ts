import { defineAsyncComponent, type AsyncComponentLoader, type Component } from 'vue'

export type FrameworkInputComponent = Component | AsyncComponentLoader<Component>
export type FrameworkInputRegistry = Record<string, FrameworkInputComponent>

const builtInInputComponents: Record<string, Component> = {
  text: defineAsyncComponent(() => import('../inputs/TextInput.vue')),
  textarea: defineAsyncComponent(() => import('../inputs/TextareaInput.vue')),
  color: defineAsyncComponent(() => import('../inputs/ColorInput.vue')),
  password: defineAsyncComponent(() => import('../inputs/PasswordInput.vue')),
  file: defineAsyncComponent(() => import('../inputs/FileInput.vue')),
  image: defineAsyncComponent(() => import('../inputs/ImageInput.vue')),
  select: defineAsyncComponent(() => import('../inputs/SelectInput.vue')),
  radio: defineAsyncComponent(() => import('../inputs/RadioGroupInput.vue')),
  date: defineAsyncComponent(() => import('../inputs/DateInput.vue')),
  daterange: defineAsyncComponent(() => import('../inputs/DateRangeInput.vue')),
  month: defineAsyncComponent(() => import('../inputs/MonthInput.vue')),
  year: defineAsyncComponent(() => import('../inputs/YearInput.vue')),
  tag: defineAsyncComponent(() => import('../inputs/TagInput.vue')),
  currency: defineAsyncComponent(() => import('../inputs/CurrencyInput.vue')),
  switch: defineAsyncComponent(() => import('../inputs/Switch.vue')),
  checkbox: defineAsyncComponent(() => import('../inputs/CheckboxInput.vue')),
  lookup: defineAsyncComponent(() => import('./form-inputs/LookupInput.vue')),
  'master-lookup': defineAsyncComponent(() => import('./form-inputs/MasterLookupInput.vue')),
  location: defineAsyncComponent(() => import('./form-inputs/LocationInput.vue')),
  'multi-location': defineAsyncComponent(() => import('./form-inputs/MultiLocationInput.vue')),
  'rich-text': defineAsyncComponent(() => import('../inputs/RichTextInput.vue')),
  'icon-select': defineAsyncComponent(() => import('../inputs/IconSelectInput.vue')),
  table: defineAsyncComponent(() => import('./form-inputs/TableInput.vue')),
  time: defineAsyncComponent(() => import('../inputs/TimeInput.vue')),
  'dynamic-form': defineAsyncComponent(() => import('./form-inputs/DynamicFormInput.vue')),
  number: defineAsyncComponent(() => import('../inputs/NumberInput.vue')),
  'checkbox-group': defineAsyncComponent(() => import('../inputs/CheckboxGroupInput.vue')),
  separator: defineAsyncComponent(() => import('./form-inputs/FormSeparator.vue')),
  canvas: defineAsyncComponent(() => import('../inputs/DrawingCanvas.vue')),
  'file-manager': defineAsyncComponent(() => import('./form-inputs/FileManager/FileManagerInput.vue')),
  'iso-clause': defineAsyncComponent(() => import('../inputs/ISOClauseInput.vue')),
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
