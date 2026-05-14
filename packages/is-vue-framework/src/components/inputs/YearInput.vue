<script setup lang="ts">
import Datepicker from '@vuepic/vue-datepicker'
import { useColorPreference } from '@southneuhof/is-vue-framework/adapters/state'
import BaseInput from './BaseInput.vue'
import { commonProps } from './commonprops'
import type { ComponentPublicInstance } from 'vue'
import { nextTick, onMounted, ref } from 'vue'

const props = defineProps({
  locale: {
    type: String,
    default: 'id-ID',
  },
  inline: {
    type: Boolean,
    default: false,
  },
  defaultToCurrent: {
    type: Boolean,
    default: false,
  },
  ...commonProps,
})

const modelValue = defineModel<Date | number>()
if (!modelValue.value && props.defaultToCurrent) {
  modelValue.value = new Date().getFullYear()
}

const datepickerRef = ref<ComponentPublicInstance | null>(null)

const displayFormatter = (date: Date) => {
  return date.toLocaleDateString(props.locale, { year: 'numeric' })
}

const scrollToCurrentYear = () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      const datepickerEl = datepickerRef.value?.$el as HTMLElement | undefined
      if (!datepickerEl) return

      const currentYear = new Date().getFullYear().toString()
      const yearCells = datepickerEl.querySelectorAll('.dp__overlay_cell')
      const currentYearCell = Array.from(yearCells).find((cell) => cell.textContent?.trim() === currentYear) as HTMLElement | undefined

      currentYearCell?.scrollIntoView({ block: 'center' })
    })
  })
}

onMounted(() => {
  if (props.inline) {
    scrollToCurrentYear()
  }
})
</script>

<template>
  <BaseInput v-bind="props">
    <Datepicker
      ref="datepickerRef"
      v-model="modelValue"
      year-picker
      :defaultDate="new Date()"
      :inline="inline"
      :format="displayFormatter"
      :dark="useColorPreference().value === 'dark'"
      @open="scrollToCurrentYear"
    />
  </BaseInput>
</template>
