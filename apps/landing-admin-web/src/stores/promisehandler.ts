import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { globalLoading } from './loading'

const value = ref<Array<Promise<any>>>([])
const isLoading = computed(() => {
  return value.value.length > 0
})

watch(
  () => value.value,
  () => {
    if (value.value.length === 0) globalLoading().disable()
  }
)

export const promiseHandler = defineStore('promiseHandler', () => {
  function introduce(promise: Promise<any>) {
    value.value.push(promise)
    promise.finally(() => {
      value.value.splice(value.value.indexOf(promise), 1)
    })
  }
  return { value, isLoading, introduce }
})
