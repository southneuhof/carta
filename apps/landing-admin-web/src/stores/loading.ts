import { ref } from 'vue'
import { defineStore } from 'pinia'

const value = ref<Record<string, boolean>>({ global: false })

export const globalLoading = defineStore('loading', () => {
  function enable(name: string = 'global') {
    value.value[name] = true
  }
  function disable(name: string = 'global') {
    setTimeout(() => {
      value.value[name] = false
    }, 0)
  }
  function isLoading(name: string = 'global') {
    return Boolean(value.value[name])
  }
  function refresh() {
    enable()
    setTimeout(() => {
      disable()
    }, 16)
  }
  return { value, enable, disable, isLoading, refresh }
})
