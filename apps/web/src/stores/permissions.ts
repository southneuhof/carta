import { defineStore } from 'pinia'
import { storage } from '@southneuhof/utilities/storage'

let value: Set<string> = new Set()
export const permissions = defineStore('permissions', () => {
  function build(data: Array<string> = storage.localStorage.get('permissions')) {
    value = new Set(data ?? [])
  }
  function has(permission: string) {
    if (!permission) return true
    return value.has(permission)
  }
  function clear() {
    return (value = new Set())
  }
  if (!value?.size) build()
  return { value, has, build, clear }
})
