<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref, watch } from 'vue'
import BaseInput from './BaseInput.vue'
import { commonProps } from './commonprops'
import { twMerge } from 'tailwind-merge'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'

const props = defineProps({
  suffix: {
    type: String,
    default: '',
  },
  prefix: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  placeholder: {
    type: Number,
    default: '',
  },
  defaultValue: {
    type: Number,
  },
  validator: {
    type: Function as PropType<(value: string, formData?: Record<string, any>) => boolean>,
    default: () => true,
  },
  formData: {
    type: Object,
    required: false,
    default: () => ({}),
  },
  locale: {
    type: String,
    required: false,
    default: 'en-US',
  },
  ...commonProps,
})

const modelValue = defineModel<number>()
if (modelValue.value == null && props.defaultValue != null) modelValue.value = props.defaultValue
const inputValue = ref(modelValue.value)

function checkInput(e: InputEvent) {
  if (e.inputType !== 'insertText') return
  e.data && !/^[0-9\.\-]*$/.test(e.data) ? e.preventDefault() : null
}

watch(inputValue, (val) => {
  if (Number.isNaN(inputValue.value)) return
  modelValue.value = Number(inputValue.value)
})

watch(modelValue, (val) => {
  inputValue.value = modelValue.value
})

function deformat(value: string) {
  if (value[0] === '0') value = value.slice(1)
  if (value[0] == '-' && value.length == 1) value = '-0'
  return value.replace(/[^0-9\-\.]/g, '')
}

function emitChange(event: any) {
  const deformattedInputValue = deformat(event.target.value)
  if (Number.isNaN(deformattedInputValue)) return
  modelValue.value = Number(deformattedInputValue)
}

const numberValue = ref()
watch(
  () => modelValue.value,
  () => {
    if (modelValue.value == null || Number.isNaN(modelValue.value)) return
    if (modelValue.value?.toString() === '-0') return '-'
    numberValue.value = new Intl.NumberFormat(props.locale).format(modelValue.value)
  },
  { immediate: true }
)
</script>

<template>
  <BaseInput v-bind="props">
    <template #label v-if="$slots.label">
      <slot name="label"></slot>
    </template>
    <div
      :class="twMerge(`flex flex-row items-center gap-4 rounded-lg py-3 pl-4 outline  outline-1 outline-outline/[24%] transition-all ease-linear focus-within:outline-2 ${error ? 'outline-error ' : ''} ${disabled ? 'pointer-events-none cursor-not-allowed !bg-surface-variant/50 ' : ''}`, ($attrs.class as string))"
    >
      <Icon v-if="props.icon" :name="(props.icon as any)" />
      <p v-if="props.prefix">{{ prefix }}</p>
      <input
        :placeholder="String(placeholder)"
        :value="numberValue"
        class="w-full bg-transparent focus:outline-none"
        @beforeinput="(e) => checkInput(e as InputEvent)"
        @input="(event) => emitChange(event)"
      />
      <p v-if="props.suffix" class="mr-4">{{ suffix }}</p>
      <div v-if="$slots.action" class="mr-4 max-h-min"><slot name="action"></slot></div>
    </div>
  </BaseInput>
</template>
