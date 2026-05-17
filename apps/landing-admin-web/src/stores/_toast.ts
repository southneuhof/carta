// import { ref, computed } from 'vue'
// import { defineStore } from 'pinia'

// const message = ref<{message: string, type: 'success' | 'warning' | 'error'}[]>([])

// export const toast = defineStore('error', () => {
//   function clear() {
//     message.value = []
//   }
//   function setSuccess(msg: string) {
//     message.value.push({ message: msg, type: 'success' })
//     setTimeout(() => {
//       message.value.shift()
//     }, 5000)
//   }
//   function setError(msg: string) {
//     message.value.push({ message: msg, type: 'error' })
//     setTimeout(() => {
//       message.value.shift()
//     }, 5000)
//   }
//   function setWarning(msg: string) {
//     message.value.push({ message: msg, type: 'warning' })
//     setTimeout(() => {
//       message.value.shift()
//     }, 5000)
//   }
//   return { message, setSuccess, setError, setWarning, clear }
// })
