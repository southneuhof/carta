<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDocumentVisibility } from '@vueuse/core'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import { NOTIFICATIONS_SEEN_EVENT } from '@/routes/(authenticated)/to-do/notifications.actions'
import { notifications } from '@/routes/(authenticated)/to-do/notifications.resource'

const POLL_INTERVAL_MS = 30_000
const route = useRoute()
const visibility = useDocumentVisibility()
const unread = ref(0)

async function refresh() {
  try {
    unread.value = await notifications.actions.unreadCount.run()
  } catch {
    // Badge polling is best effort; the next visible tick retries.
  }
}

let timer: ReturnType<typeof setInterval> | undefined
function stopPolling() {
  if (timer !== undefined) clearInterval(timer)
  timer = undefined
}
function startPolling() {
  if (timer === undefined) timer = setInterval(() => void refresh(), POLL_INTERVAL_MS)
}

watch(visibility, (state) => {
  if (state === 'visible') {
    void refresh()
    startPolling()
  } else stopPolling()
}, { immediate: true })
onUnmounted(stopPolling)
onMounted(() => window.addEventListener(NOTIFICATIONS_SEEN_EVENT, refresh))
onUnmounted(() => window.removeEventListener(NOTIFICATIONS_SEEN_EVENT, refresh))
</script>

<template>
  <RouterLink
    :to="{ name: 'notifications' }"
    aria-label="Notifications"
    :class="[
      'overlay relative flex size-8 items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary',
      route.name === 'notifications'
        ? 'bg-primary-container text-on-primary-container after:bg-on-primary-container-hover focus-visible:after:bg-on-primary-container-active active:after:bg-on-primary-container-active'
        : 'after:bg-on-surface-hover focus-visible:after:bg-on-surface-active active:after:bg-on-surface-active',
    ]"
  >
    <Icon name="notification" size="md" />
    <span
      v-if="unread > 0"
      data-unread-badge
      class="absolute right-0.5 top-0.5 min-w-5 rounded-full bg-error px-1 text-center text-xs font-semibold leading-5 text-on-error"
    >{{ unread }}</span>
  </RouterLink>
</template>
