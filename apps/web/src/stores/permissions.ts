import { defineStore } from 'pinia'
import { storage } from '@southneuhof/is-vue-framework/utils/storage'

let value: Set<string> = new Set()
const BYPASS_ALL_PERMISSIONS = import.meta.env.VITE_APP_BYPASS_ALL_PERMISSIONS === 'true'

export const permissions = defineStore('permissions', () => {
  function build(data: Array<string> = storage.localStorage.get('permissions')) {
    if (data?.length) value = new Set(data)
  }
  function has(permission: string) {
    if (BYPASS_ALL_PERMISSIONS || storage.localStorage.get('profile')?.role_id == 1 || !permission) return true
    return value.has(permission)
  }
  function clear() {
    return (value = new Set())
  }
  if (!value?.size) build()
  return { value, has, build, clear }
})
