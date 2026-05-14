<script setup lang="ts">
import { hasRequiredValidation } from '@southneuhof/is-vue-framework/behaviors/validations'
import type { InputConfig } from '@southneuhof/is-data-model'
import { computed, inject, ref, type Ref } from 'vue'
import { twMerge } from 'tailwind-merge'

type FormValidationContext = {
  formData: Ref<Record<string, any>>
  fieldErrors: Ref<Record<string, string>>
  fieldTouched: Ref<Record<string, boolean>>
  submitAttempted: Ref<boolean>
  validateField: (field: string) => string
  validateVisibleFields: () => boolean
  clearFieldValidation: (field: string) => void
  touchField: (field: string) => void
}

const props = defineProps({
  field: {
    type: String,
    default: '',
  },
  error: {
    type: String,
    required: false,
    default: '',
  },
  label: {
    type: String,
    required: false,
    default: '',
  },
  helperMessage: {
    type: String,
    required: false,
    default: '',
  },
  enableHelperMessage: {
    type: Boolean,
    required: false,
    default: true,
  },
})

const containerRef = ref<HTMLElement | null>(null)
const formValidation = inject<FormValidationContext | null>('formValidation', null)

const formInputConfig = inject<Ref<InputConfig> | null>('formInputConfig', null)

const requiredMark = computed(() => {
  if (!props.field || !formInputConfig?.value?.[props.field]) return false
  return hasRequiredValidation(formInputConfig.value[props.field])
})

const shouldShowValidationError = computed(() => {
  if (!formValidation || !props.field) return false
  return Boolean(formValidation.fieldTouched.value[props.field] || formValidation.submitAttempted.value)
})

const activeError = computed(() => {
  if (!formValidation || !props.field) return props.error
  if (!shouldShowValidationError.value) return ''
  return formValidation.fieldErrors.value[props.field] || ''
})

function onFocusOut(event: FocusEvent) {
  if (!formValidation || !props.field) return

  const relatedTarget = event.relatedTarget as Node | null
  const container = containerRef.value
  if (container && relatedTarget && container.contains(relatedTarget)) return

  formValidation.touchField(props.field)
}

function onValidationTouch() {
  if (!formValidation || !props.field) return
  formValidation.touchField(props.field)
}
</script>

<template>
  <div ref="containerRef" @focusout="onFocusOut" @validation:touch="onValidationTouch" :class="`${twMerge(`flex flex-col gap-2`, $attrs.class as string)}`">
    <div>
      <label v-if="props.label" class="text-sm font-medium">
        <template v-if="!$slots.label">
          {{ props.label }}
          <span v-if="requiredMark" class="text-error">*</span>
        </template>
        <slot v-else name="label"></slot>
      </label>
      <div v-if="enableHelperMessage && (helperMessage || activeError)">
        <label v-if="helperMessage && !activeError" class="text-sm text-on-surface/[67%]">{{ helperMessage }}</label>
        <label v-else :class="`text-sm text-error `">{{ activeError }}</label>
      </div>
    </div>
    <slot></slot>
  </div>
</template>
