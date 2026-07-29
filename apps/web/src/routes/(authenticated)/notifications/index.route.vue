<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ListView } from '@southneuhof/is-vue-framework'
import { notifications } from '../to-do/notifications.resource'
import { markNotificationsSeen, NOTIFICATIONS_SEEN_EVENT, unreadIds, type NotificationRecord } from '../to-do/notifications.operations'
import { notificationRoute } from '@/framework/notifications/moduleRoutes'

const router = useRouter()
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

function open(record: NotificationRecord) {
  const target = notificationRoute(record)
  if (target) void router.push(target)
}
</script>

<template>
  <ListView title="Notifications" :table="table">
    <template #cell:title="{ value, record }">
      <a v-if="notificationRoute(record as NotificationRecord)" href="#" :data-notification="record.id" @click.prevent="open(record as NotificationRecord)">{{ value }}</a>
      <span v-else :data-notification="record.id">{{ value }}</span>
    </template>
  </ListView>
</template>
