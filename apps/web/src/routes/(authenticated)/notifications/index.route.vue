<script setup lang="ts">
import { computed } from 'vue'
import { ListView } from '@southneuhof/is-vue-framework'
import { notifications } from '../to-do/notifications.resource'
import { markNotificationsSeen, NOTIFICATIONS_SEEN_EVENT, unreadIds, type NotificationRecord } from '../to-do/notifications.operations'

const table = computed(() => {
  const base = notifications.table({ namespace: 'notifications' }).table
  return {
    ...base,
    load: async (...args: Parameters<NonNullable<typeof base.load>>) => {
      const loaded = await base.load!(...args)
      const ids = unreadIds((loaded as { data: NotificationRecord[] }).data)
      if (ids.length > 0) {
        await markNotificationsSeen(ids)
        await notifications.invalidate()
        window.dispatchEvent(new Event(NOTIFICATIONS_SEEN_EVENT))
      }
      return loaded
    },
  }
})
</script>

<template>
  <ListView title="Notifications" :table="table" />
</template>
