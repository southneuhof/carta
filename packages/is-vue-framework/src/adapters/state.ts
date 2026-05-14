import { ref } from 'vue'

const keyStore = ref<Record<string, number>>({})

export function keyManager() {
  return {
    value: keyStore.value,
    triggerChange(key: string) {
      keyStore.value[key] = (keyStore.value[key] || 0) + 1
    },
  }
}

export function useColorPreference() {
  return {
    isDark: false,
    value: 'light',
  }
}

export function permissions() {
  return {
    has: (..._args: any[]) => true,
  }
}
