import { ref } from 'vue'
import { defineStore } from 'pinia'

const value = ref<Record<string, number>>({})

export const keyManager = defineStore('keyManager', () => {
  function triggerChange(key: string) {
    value.value[key] = (value.value[key] ?? 0) + 1
  }

  function destroy(key: string) {
    delete value.value[key]
  }

  function destroyAll() {
    value.value = {}
  }

  return { value, triggerChange, destroy, destroyAll }
})
