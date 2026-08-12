<script setup lang="ts">
import { computed } from 'vue'
import { ListView } from '@southneuhof/is-vue-framework'
import { notifications } from '../to-do/notifications.resource'
import { NOTIFICATIONS_SEEN_EVENT, unreadIds } from '../to-do/notifications.actions'

const list = computed(() => {
  const base = notifications.list({ namespace: 'notifications' })
  return {
    ...base,
    run: async (context: Parameters<typeof base.run>[0]) => {
      const loaded = await base.run(context)
      const ids = unreadIds(loaded.data)
      if (ids.length > 0) {
        await notifications.actions.markSeen.run(ids)
        await notifications.invalidate()
        window.dispatchEvent(new Event(NOTIFICATIONS_SEEN_EVENT))
      }
      return loaded
    },
  }
})
</script>

<template>
  <ListView title="Notifications" v-bind="list" />
</template>
