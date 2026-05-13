<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Spinner from '@southneuhof/is-vue-framework/components/base/Spinner.vue'
import { keyManager } from '@/stores/keyManager'

const route = useRoute()

const routeViewKey = computed(() => {
  return `${route.path}${String(keyManager().value[String(route.name)])}`
})
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition name="vfade" mode="out-in" appear>
      <div v-if="Component" :key="routeViewKey">
        <Suspense :timeout="0">
          <component :is="Component" />
          <template #fallback>
            <div class="flex items-center justify-center">
              <Spinner />
            </div>
          </template>
        </Suspense>
      </div>
    </Transition>
  </RouterView>
</template>
