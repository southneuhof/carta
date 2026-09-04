import { shallowRef } from 'vue'
import { defineStore } from 'pinia'

export const permissions = defineStore('permissions', () => {
  const value = shallowRef<Set<string>>(new Set())

  function build(data: readonly string[]) {
    value.value = new Set(data)
  }
  function can(permission: string) {
    if (!permission) return true
    return value.value.has(permission)
  }
  function clear() {
    value.value = new Set()
  }
  return { value, can, build, clear }
})
