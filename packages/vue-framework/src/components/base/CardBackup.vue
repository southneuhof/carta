<script setup lang="ts">
import type { PropType } from 'vue'
import { twMerge } from 'tailwind-merge'
import { useAttrs } from 'vue'

const attrs = useAttrs()

const props = defineProps({
  interactive: {
    type: Boolean,
    required: false,
    default: false,
  },
  color: {
    type: String as PropType<
      | 'primary'
      | 'secondary'
      | 'tertiary'
      | 'warning'
      | 'error'
      | 'info'
      | 'success'
      | 'primary-container'
      | 'secondary-container'
      | 'tertiary-container'
      | 'warning-container'
      | 'error-container'
      | 'info-container'
      | 'success-container'
      | 'surface-lowest'
      | 'surface-low'
      | 'surface'
      | 'surface-high'
      | 'surface-highest'
    >,
    required: false,
    default: 'surface',
  },
  variant: {
    type: String as PropType<'filled' | 'outlined' | 'elevated'>,
    required: false,
    default: 'filled',
  },
})

const colorMap: any = {
  primary: 'bg-primary  text-on-primary ',
  secondary: 'bg-secondary  text-on-secondary ',
  tertiary: 'bg-tertiary  text-on ',
  warning: 'bg-warning  text-on-warning ',
  error: 'bg-error  text-on-error ',
  info: 'bg-info  text-on-info ',
  success: 'bg-success  text-on-success ',
  'primary-container': 'bg-primary-container text-on-primary-container ',
  'secondary-container': 'bg-secondary-container text-on-secondary-container ',
  'tertiary-container': 'bg-tertiary-container text-on-container ',
  'warning-container': 'bg-warning-container text-on-warning-container ',
  'error-container': 'bg-error-container text-on-error-container ',
  'info-container': 'bg-info-container text-on-info-container ',
  'success-container': 'bg-success-container text-on-success-container ',
  'surface-lowest': 'bg-surface-container-lowest text-on-surface ',
  'surface-low': 'bg-surface-container-low text-on-surface ',
  surface: 'bg-surface-container text-on-surface ',
  'surface-high': 'bg-surface-container-high text-on-surface ',
  'surface-highest': 'bg-surface-container-highest text-on-surface ',
}

const variantMap: any = {
  filled: '',
  outlined: 'outline outline-1 outline-outline-variant/[24%]',
  elevated: '',
}
</script>

<template>
  <div
    :class="`${interactive ? 'overlay cursor-pointer after:bg-on-surface/[8%] after:active:bg-on-surface/[12%]  ' : ''} ${twMerge(`pdf:px-0 pdf:py-0 flex flex-col gap-4 rounded-xl px-4 py-4 ${colorMap[props.color]}`, attrs.class as string)} ${variantMap[props.variant]}`"
  >
    <div v-if="$slots.header"><slot name="header"></slot></div>
    <slot></slot>
    <div v-if="$slots.footer"><slot name="footer"></slot></div>
  </div>
</template>
