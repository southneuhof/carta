<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useScreenStore } from '@/stores/screen'
import { debounce } from '@southneuhof/utilities/object'
import { onMounted, onBeforeUnmount, onErrorCaptured, ref } from 'vue'
import { useColorPreference } from './stores/colorpreference'
import { Toaster } from 'vue-sonner'
import config from './config'
import Spinner from '@southneuhof/is-vue-framework/components/base/Spinner.vue'

const error = ref<Error | null>(null)
onErrorCaptured((err, instance, info) => {
  console.error('App error:', err, instance, info)
  error.value = err
  return true
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
    <div class="flex h-full w-full items-center justify-center">
      <Suspense :timeout="0">
        <RouterView />
        <template #fallback>
          <div class="flex items-center justify-center">
            <Spinner />
          </div>
        </template>
      </Suspense>
    </div>
  </div>
</template>
