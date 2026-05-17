<script setup lang="ts">
import type { PropType } from 'vue'

const props = defineProps({
  state: {
    type: Number as PropType<0 | 1 | 2>,
    required: false,
    default: 0,
  },
  title: {
    type: String,
    required: false,
    default: '',
  },
})

const stateClasses = {
  0: ['', ' text-on-surface/[38%] hover:text-on-surface'],
  1: ['', 'text-on-surface'],
  2: ['font-semibold', 'text-primary'],
}
</script>

<template>
  <div class="box-border flex w-full cursor-pointer items-center justify-center font-medium" :class="{ 'shadow-[-4px_0_0_0_black]': state === 2 }">
    <div class="flex aspect-square w-16 flex-col items-center justify-center gap-1 rounded-xl px-4 py-2" :class="stateClasses[state][1]">
      <slot />
      <p class="text-center text-xs">{{ title }}</p>
    </div>
  </div>
</template>
