<script setup lang="ts">
/**
 * Verification tasks waiting on the caller.
 *
 * This is the same `notifications` resource the inbox drawer renders, in a second
 * query namespace. Two independent namespaces over one resource is a stated
 * release gate, and this is that proof in production code rather than a fixture:
 * paging or searching here must not move the drawer, and vice versa.
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ListView } from '@southneuhof/is-vue-framework'
import { notifications, type NotificationRecord } from '@/framework/adapters/resources/notifications'
import { notificationRoute } from '@/framework/notifications/moduleRoutes'


const router = useRouter()

const table = computed(() =>
  notifications.table({ namespace: 'to-do', searchParameters: { notificationType: 'verification' } }).table,
)

function open(record: NotificationRecord) {
  const target = notificationRoute(record)
  // A module this app has no screen for is a normal state, not an error: the row
  // simply does not navigate.
  if (target) void router.push(target)
}
</script>

<template>
  <ListView title="To Do" :table="table">
    <template #cell:title="{ value, record }">
      <a
        v-if="notificationRoute(record as NotificationRecord)"
        href="#"
        :data-notification="record.id"
        @click.prevent="open(record as NotificationRecord)"
      >
        {{ value }}
      </a>
      <span v-else :data-notification="record.id">{{ value }}</span>
    </template>
  </ListView>
</template>
