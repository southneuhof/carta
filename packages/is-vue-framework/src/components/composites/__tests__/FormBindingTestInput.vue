<script setup lang="ts">
import BaseInput from '../../inputs/BaseInput.vue'

const props = defineProps({
  field: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  helperMessage: {
    type: String,
    default: '',
  },
  enableHelperMessage: {
    type: Boolean,
    default: true,
  },
  marker: {
    type: String,
    default: '',
  },
  formType: {
    type: String,
    default: '',
  },
  formData: {
    type: Object,
    default: undefined,
  },
})

const emit = defineEmits<{
  (event: 'validation:touch'): void
}>()

const modelValue = defineModel<any>()
const uploadState = defineModel<any>('uploadState')
const previewOpen = defineModel<boolean>('previewOpen')
const buttonUrl = defineModel<any>('buttonUrl')
const buttonText = defineModel<string>('buttonText')

function triggerTouch() {
  emit('validation:touch')
}
</script>

<template>
  <BaseInput
    :field="props.field"
    :label="props.label"
    :helperMessage="props.helperMessage"
    :enableHelperMessage="props.enableHelperMessage"
  >
    <div :data-testid="`${props.field}-marker`">{{ props.marker }}</div>
    <div :data-testid="`${props.field}-form-type`">{{ props.formType }}</div>
    <div :data-testid="`${props.field}-modelValue`">{{ modelValue }}</div>
    <div :data-testid="`${props.field}-uploadState`">{{ uploadState }}</div>
    <div :data-testid="`${props.field}-previewOpen`">{{ previewOpen }}</div>
    <div :data-testid="`${props.field}-buttonUrl`">{{ buttonUrl }}</div>
    <div :data-testid="`${props.field}-buttonText`">{{ buttonText }}</div>
    <button type="button" :data-testid="`${props.field}-set-model`" @click="modelValue = 'updated-primary'">Set Model</button>
    <button type="button" :data-testid="`${props.field}-set-upload`" @click="uploadState = 'uploaded'">Set Upload</button>
    <button type="button" :data-testid="`${props.field}-set-preview`" @click="previewOpen = true">Set Preview</button>
    <button type="button" :data-testid="`${props.field}-set-button-url`" @click="buttonUrl = '/updated-button-url'">Set Button URL</button>
    <button type="button" :data-testid="`${props.field}-set-button-text`" @click="buttonText = 'Updated button text'">Set Button Text</button>
    <button type="button" :data-testid="`${props.field}-touch`" @click="triggerTouch()">Touch</button>
  </BaseInput>
</template>
