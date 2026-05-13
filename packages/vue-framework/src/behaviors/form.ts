import { defineAsyncComponent } from 'vue'
import { getFrameworkBehaviors, missingBehavior } from '@southneuhof/is-vue-framework/adapters/behaviors'

export function defaultBeforeSubmit({ formData }: { formData: object }) {
  return getFrameworkBehaviors().form?.beforeSubmit?.({ formData }) ?? formData
}

export async function defaultOnSubmit({ payload, method, targetAPI, type }: { payload: object; method: 'put' | 'post'; targetAPI: string; type: 'create' | 'update' }) {
  const onSubmit = getFrameworkBehaviors().form?.onSubmit
  if (!onSubmit) missingBehavior('form.onSubmit')
  return onSubmit({ payload, method, targetAPI, type })
}

export function defaultOnSuccess({ payload, response }: { payload: object; response: object }) {
  return getFrameworkBehaviors().form?.onSuccess?.({ payload, response }) ?? { payload, response }
}

export function defaultOnError({ payload, error }: { payload: object; error: any }) {
  return getFrameworkBehaviors().form?.onError?.({ payload, error }) ?? { payload, error }
}

export async function defaultFormGetData({ getAPI, id, searchParameters }: { getAPI: string; id?: string | number; searchParameters?: object }) {
  const getDetailData = getFrameworkBehaviors().form?.getDetailData
  if (!getDetailData) missingBehavior('form.getDetailData')
  return getDetailData({ getAPI, id, searchParameters })
}

export const componentTypeMap = {
  text: defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/TextInput.vue')),
  textarea: defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/TextareaInput.vue')),
  password: defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/PasswordInput.vue')),
  file: defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/FileInput.vue')),
  image: defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/ImageInput.vue')),
  select: defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/SelectInput.vue')),
  radio: defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/RadioGroupInput.vue')),
  date: defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/DateInput.vue')),
  daterange: defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/DateRangeInput.vue')),
  month: defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/MonthInput.vue')),
  year: defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/YearInput.vue')),
  tag: defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/TagInput.vue')),
  currency: defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/CurrencyInput.vue')),
  switch: defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/Switch.vue')),
  checkbox: defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/CheckboxInput.vue')),
  lookup: defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/LookupInput.vue')),
  'master-lookup': defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/MasterLookupInput.vue')),
  location: defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/LocationInput.vue')),
  'multi-location': defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/MultiLocationInput.vue')),
  'rich-text': defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/RichTextInput.vue')),
  'icon-select': defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/IconSelectInput.vue')),
  table: defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/TableInput.vue')),
  time: defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/TimeInput.vue')),
  'dynamic-form': defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/DynamicFormInput.vue')),
  number: defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/NumberInput.vue')),
  'checkbox-group': defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/CheckboxGroupInput.vue')),
  separator: defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/FormSeparator.vue')),
  canvas: defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/DrawingCanvas.vue')),
  'file-manager': defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/FileManager/FileManagerInput.vue')),
  'iso-clause': defineAsyncComponent(() => import('@southneuhof/is-vue-framework/components/inputs/ISOClauseInput.vue')),
}
