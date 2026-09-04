<script setup lang="ts">
import type { PropType } from 'vue'
import { useColorPreference } from '@/stores/colorpreference'
import wordmarkWhite from '../assets/wordmark-white.svg'
import wordmarkColor from '../assets/wordmark-color.svg'

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
  white: wordmarkWhite,
  color: wordmarkColor,
}
</script>

<template>
  <div>
    <img :src="iconMap[props.strict ? props.color : useColorPreference().value === 'dark' ? 'white' : props.color]" class="h-fit w-fit max-w-full" />
  </div>
</template>
