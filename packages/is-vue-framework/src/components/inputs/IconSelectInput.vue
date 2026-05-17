<script setup lang="ts">
import BaseInput from './BaseInput.vue'
import { commonProps } from './commonprops'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'

const props = defineProps({
  ...commonProps,
})

const modelValue = defineModel<string>()

const iconList = [
  'ri-home-line',
  'ri-building-line',
  'ri-store-line',
  'ri-bank-line',
  'ri-profile-line',
  'ri-archive-line',
  'ri-calendar-line',
  'ri-chat-1-line',
  'ri-question-answer-line',
  'ri-speak-line',
  'ri-chat-quote-line',
  'ri-chat-history-line',
  'ri-file-line',
  'ri-news-line',
  'ri-book-line',
  'ri-folder-line',
]
</script>

<template>
  <BaseInput v-bind="props">
    <div class="grid w-fit grid-cols-4 gap-2">
      <Button v-for="icon in iconList" kind="icon" :aria-label="icon" @click="() => (modelValue = icon)" :variant="modelValue === icon ? 'tonal' : 'standard'" class="max-w-fit"
        ><i :class="icon" class="text-xl text-on-surface"
      /></Button>
    </div>
  </BaseInput>
</template>
