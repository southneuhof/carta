<script setup lang="ts">
import Form from '@southneuhof/is-vue-framework/components/composites/Form.vue'
import type { InputConfig } from '@southneuhof/is-data-model'
import { computed, type PropType } from 'vue'
import { defaultFormGetData, defaultBeforeSubmit, defaultOnSubmit, defaultOnSuccess, defaultOnError } from '@southneuhof/is-vue-framework/behaviors/form'
import Dialog from '../base/Dialog.vue'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
// import DialogDeprecated from '../base/DialogDeprecated.vue';

const props = defineProps({
  inputConfig: { type: Object as PropType<InputConfig>, default: () => ({}) },
  fields: { type: Array as PropType<string[]>, required: true },
  fieldsAlias: { type: Object, default: () => ({}) },
  getDetailData: {
    type: Function as PropType<({ getAPI, id, searchParameters }: { getAPI: string; id?: string | number | string[]; searchParameters?: object }) => Promise<object>>,
    default: defaultFormGetData,
  },
  getInitialData: { type: Function as PropType<() => Promise<Record<string, any>>>, default: async () => ({}) },
  beforeSubmit: { type: Function as PropType<({ formData }: { formData: object }) => object>, default: defaultBeforeSubmit },
  onSubmit: {
    type: Function as PropType<({ payload, method, targetAPI, type }: { payload: object; method: 'put' | 'post'; targetAPI: string; type: 'create' | 'update' }) => Promise<object | void>>,
    default: defaultOnSubmit,
  },
  onSuccess: { type: Function as PropType<({ formData, res }: { formData: object; res: Record<string, any> }) => void>, default: defaultOnSuccess },
  onError: { type: Function as PropType<({ formData, error }: { formData: object; error: Record<string, any> }) => void>, default: defaultOnError },
  targetAPI: { type: String, default: '' },
  getAPI: { type: String },
  dataID: { type: [String, Array] as PropType<string | string[]> },
  formType: { type: String as PropType<'create' | 'update'>, default: 'create' },
  method: { type: String as PropType<'put' | 'post'> },
  searchParameters: { type: Object, default: () => ({}) },
  extraData: { type: Object, default: () => ({}) },
  static: { type: Boolean },
  disabled: { type: Boolean },
})

const formProps = computed<Record<string, any>>(() => {
  const { onSuccess: _onSuccess, ...rest } = props
  return rest
})
</script>

<template>
  <Dialog :class="($attrs.class as string)" :disabled="disabled">
    <template #trigger="triggerProps">
      <slot name="trigger" v-bind="triggerProps"></slot>
    </template>
    <template #title v-if="$slots['title']">
      <slot name="title"></slot>
    </template>
    <template #content="{ setOpen }">
      <div class="flex flex-col gap-8">
        <slot v-if="$slots.header" name="header"></slot>
        <Form
          v-bind="(formProps as any)"
          :onSuccess="
            ({ formData, res }) => {
              props.onSuccess({ formData, res })
              setOpen(false)
            }
          "
        >
          <template #submitButton="{ loading, submitForm, formData }" v-if="$slots.submitButton">
            <slot name="submitButton" v-bind="{ loading, submitForm, formData, setOpen }"></slot>
          </template>
          <template #cancelButton>
            <Button variant="tonal" @click="() => setOpen(false)">Batal</Button>
          </template>
        </Form>
        <slot v-if="$slots.footer" name="footer"></slot>
      </div>
    </template>
  </Dialog>
</template>
