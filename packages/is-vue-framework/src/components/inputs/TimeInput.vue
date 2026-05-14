<script setup lang="ts">
import Datepicker from '@vuepic/vue-datepicker'
import { useColorPreference } from '@southneuhof/is-vue-framework/adapters/state'
import BaseInput from './BaseInput.vue'
import { commonProps } from './commonprops'
import { ref, watch } from 'vue'

const props = defineProps({
  locale: {
    type: String,
    default: 'id-ID',
  },
  defaultToCurrent: {
    type: Boolean,
    default: false,
  },
  ...commonProps,
})

const modelValue = defineModel<string>()
// if (props.defaultToCurrent && !modelValue.value) modelValue.value = {hours: String(new Date().getHours()), minutes: String(new Date().getMinutes()), seconds: String(new Date().getSeconds())}

const internalValue = ref()

if (props.defaultToCurrent) internalValue.value = { hours: String(new Date().getHours()), minutes: String(new Date().getMinutes()), seconds: String(new Date().getSeconds()) }
else if (modelValue.value) internalValue.value = { hours: Number(modelValue.value.split(':')[0]), minutes: Number(modelValue.value.split(':')[1]), seconds: Number(modelValue.value.split(':')[2]) }

watch(
  internalValue,
  () => {
    if (!internalValue.value) {
      if (modelValue.value != null) modelValue.value = ''
      return
    }
    modelValue.value = `${Number(internalValue.value?.hours || 0) <= 9 ? `0${internalValue.value?.hours}` : internalValue.value?.hours}:${
      Number(internalValue.value?.minutes || 0) <= 9 ? `0${internalValue.value?.minutes}` : internalValue.value?.minutes
    }:${Number(internalValue.value?.seconds || 0) <= 9 ? `0${internalValue.value?.seconds}` : internalValue.value?.seconds}`
  },
  { immediate: props.defaultToCurrent }
)

watch(
  () => modelValue.value,
  (newValue) => {
    if (!newValue) {
      if (internalValue.value != null) internalValue.value = null
      return
    }
    const [hours, minutes, seconds] = newValue.split(':').map((item) => Number(item))
    const currentHours = Number(internalValue.value?.hours)
    const currentMinutes = Number(internalValue.value?.minutes)
    const currentSeconds = Number(internalValue.value?.seconds)
    if (currentHours === hours && currentMinutes === minutes && currentSeconds === seconds) return
    internalValue.value = { hours, minutes, seconds }
  },
  { immediate: true }
)

function displayFormatter(value: Record<string, any>) {
  return modelValue.value ? modelValue.value : 'Masukkan Waktu'
}
</script>

<template>
  <BaseInput v-bind="props">
    <Datepicker v-model="internalValue" :format="displayFormatter" time-picker :dark="useColorPreference().value === 'dark'" />
  </BaseInput>
</template>
