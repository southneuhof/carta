<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useScreenStore } from '@/stores/screen'
import { debounce } from '@southneuhof/utilities/object'
import { computed, onMounted, onBeforeUnmount, onErrorCaptured, ref } from 'vue'
import { useColorPreference } from './stores/colorpreference'
import { Toaster } from 'vue-sonner'
import config from './config'
import Spinner from '@southneuhof/is-vue-framework/components/base/Spinner.vue'
import { reloadPage } from './reload'
import { identityStatus } from './framework/identity'

const error = ref<Error | null>(null)
const identityFailed = computed(() => identityStatus.value === 'failed')
onErrorCaptured((err, instance, info) => {
  console.error('App error:', err, instance, info)
  error.value = err
  return false
})

const handleResize = debounce(useScreenStore().handleResize, 300)

onMounted(() => {
  window.addEventListener('resize', handleResize)
  useScreenStore().handleResize()
  document.title = config.name
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="text-black-text transition-colors">
    <Toaster position="bottom-center" richColors :theme="useColorPreference().value" />
    <div class="min-h-screen w-full">
      <div v-if="error || identityFailed" class="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center" role="alert" aria-live="assertive">
        <h1 class="text-xl font-semibold">Something went wrong.</h1>
        <button type="button" class="rounded border px-4 py-2" @click="reloadPage">Reload</button>
      </div>
      <Suspense v-else :timeout="0">
        <RouterView />
        <template #fallback>
          <div class="flex min-h-screen items-center justify-center">
            <Spinner />
          </div>
        </template>
      </Suspense>
    </div>
  </div>
</template>
