import { ref } from 'vue'
import { defineStore } from 'pinia'

const state = ref(0)
const windowSize = ref({ width: 0, height: 0 })

export const useScreenStore = defineStore('screen', () => {
  const names = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']

  function set(value: number) {
    state.value = value
  }

  function isAtLeast(val: string) {
    return state.value >= names.indexOf(val)
  }

  function isOrLess(val: string) {
    return state.value <= names.indexOf(val)
  }

  function handleResize() {
    windowSize.value.width = window.innerWidth
    windowSize.value.height = window.innerHeight
    switch (true) {
      case windowSize.value.width < 640:
        set(0)
        break
      case windowSize.value.width < 768:
        set(1)
        break
      case windowSize.value.width < 1024:
        set(2)
        break
      case windowSize.value.width < 1280:
        set(3)
        break
      case windowSize.value.width < 1536:
        set(4)
        break
      default:
        set(5)
        break
    }
  }

  return { state, set, isAtLeast, isOrLess, handleResize }
})
