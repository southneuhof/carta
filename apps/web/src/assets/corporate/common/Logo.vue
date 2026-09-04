<script setup lang="ts">
import type { PropType } from 'vue'
import { useColorPreference } from '@/stores/colorpreference'
import Logo from '@/assets/corporate/assets/app-logo.svg'

const props = defineProps({
  color: {
    type: String as PropType<'white' | 'color'>,
    required: false,
    default: 'color',
  },
  strict: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const iconMap: any = {
  DEFAULT: {
    white: Logo,
    color: Logo,
  },
}
</script>

<template>
  <img :src="iconMap['DEFAULT'][props.strict ? props.color : useColorPreference().value === 'dark' ? 'white' : props.color]" />
</template>
