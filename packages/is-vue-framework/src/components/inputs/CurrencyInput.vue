<script setup lang="ts">
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
  icon: {
    type: String,
    default: '',
  },
  placeholder: {
    type: Number,
    default: '',
  },
  currency: {
    type: String,
    required: false,
    default: 'IDR',
  },
  locale: {
    type: String,
    required: false,
    default: 'ID',
  },
  ...commonProps,
})

const modelValue = defineModel<number>()
const inputValue = ref(modelValue.value)

function checkInput(e: InputEvent) {
  if (e.inputType !== 'insertText') return
  e.data && !/^[0-9\.\-]*$/.test(e.data) ? e.preventDefault() : null
}

watch(inputValue, (val) => {
  modelValue.value = Number(inputValue.value)
})

watch(modelValue, (val) => {
  inputValue.value = modelValue.value
})

function deformat(value: string) {
  if (value[0] === '0') value = value.slice(1)
  if (value[0] == '-' && value.length == 1) value = '-0'
  return value.replace(/[^0-9\-]/g, '')
}

function emitChange(event: any) {
  console.log(event.target.value)
  modelValue.value = Number(deformat(event.target.value))
}

const currencyValue = computed(() => {
  if (modelValue.value === -0) return '-'
  return new Intl.NumberFormat(props.locale).format(modelValue.value || 0)
})
</script>

<template>
  <BaseInput v-bind="props">
    <template #label v-if="$slots.label">
      <slot name="label"></slot>
    </template>
    <div
      :class="twMerge(`flex flex-row items-center gap-4 rounded-lg py-3 pl-4 outline  outline-1 outline-outline/[24%] transition-all ease-linear focus-within:outline-2 ${disabled ? 'pointer-events-none cursor-not-allowed !bg-surface-variant/50 ' : ''}`, ($attrs.class as string))"
    >
      <Icon v-if="props.icon" :name="(props.icon as any)" />
      <p>
        {{
          Intl.NumberFormat(props.locale, { style: 'currency', currency: props.currency })
            .formatToParts(0)
            .find((x) => x.type == 'currency')?.value
        }}
      </p>
      <input
        :placeholder="String(placeholder)"
        :constraint="['integerString']"
        :value="currencyValue != '0' ? currencyValue : null"
        class="w-full bg-transparent focus:outline-none"
        @beforeinput="(e) => checkInput(e as InputEvent)"
        @input="(event) => emitChange(event)"
      />
      <p v-if="props.suffix" class="mr-4">{{ suffix }}</p>
      <div v-if="$slots.action" class="mr-4 max-h-min"><slot name="action"></slot></div>
    </div>
  </BaseInput>
</template>
