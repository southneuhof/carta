<script setup lang="ts">
import Form from '@southneuhof/is-vue-framework/components/composites/Form.vue'
import type { InputConfig } from '../../model-config'
import { computed, type PropType } from 'vue'
import Dialog from '../base/Dialog.vue'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import type { FormLoad, FormSubmit } from './types'
// import DialogDeprecated from '../base/DialogDeprecated.vue';

const props = defineProps({
  inputConfig: { type: Object as PropType<InputConfig>, default: () => ({}) },
  fields: { type: Array as PropType<string[]>, required: true },
  fieldsAlias: { type: Object, default: () => ({}) },
  load: { type: Function as PropType<FormLoad> },
  submit: { type: Function as PropType<FormSubmit> },
  getInitialData: { type: Function as PropType<() => Promise<Record<string, any>>>, default: async () => ({}) },
  beforeSubmit: { type: Function as PropType<({ formData }: { formData: object }) => object> },
  extraData: { type: Object, default: () => ({}) },
  disabled: { type: Boolean },
})
const emit = defineEmits<{ (event: 'success', result: unknown, submittedData: Record<string, any>): void; (event: 'error', error: unknown, submittedData: Record<string, any>): void }>()

const formProps = computed<Record<string, any>>(() => {
  const { ...rest } = props
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
          @success="
            (result, submittedData) => {
              emit('success', result, submittedData)
              setOpen(false)
            }
          "
          @error="(error, submittedData) => emit('error', error, submittedData)"
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
