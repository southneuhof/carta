import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { storage } from '@southneuhof/is-vue-framework/utils/storage'

type ColorMode = 'light' | 'dark'

const value = ref<ColorMode>('light')
if (!storage.localStorage.get('colorPreference')) storage.localStorage.set('colorPreference', value.value)
else value.value = storage.localStorage.get('colorPreference')

watch(
  value,
  (newValue) => {
    document.documentElement.className = newValue
  },
  { immediate: true }
)

export const useColorPreference = defineStore('colorPreference', () => {
  function set(mode: ColorMode) {
    value.value = mode
    storage.localStorage.set('colorPreference', value.value)
  }

  function toggle() {
    if (value.value === 'light') set('dark')
    else set('light')
  }

  return { value, set, toggle }
})
