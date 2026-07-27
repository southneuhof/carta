<script setup lang="ts">
/**
 * Notification drawer and its unread badge.
 *
 * Two rules carried from the API design:
 *
 * - **`unset` is not unread.** It marks a chain step whose turn has not come. It
 *   must never reach the badge and must never be marked seen; counting it inflates
 *   every badge in the system.
 * - **One interval, owned here.** The badge polls because the API has no push
 *   transport. Polling per component would multiply requests by the number of
 *   mounted badges, so this component owns the only timer, clears it on unmount,
 *   and stops entirely while the tab is hidden.
 */
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDocumentVisibility } from '@vueuse/core'
import { ListView } from '@southneuhof/is-vue-framework'
import { markNotificationsSeen, notifications, unreadIds, unreadNotificationCount, type NotificationRecord } from '@/framework/adapters/resources/notifications'
import { notificationRoute } from '@/framework/notifications/moduleRoutes'

const POLL_INTERVAL_MS = 30_000

const router = useRouter()
const visibility = useDocumentVisibility()

const open = ref(false)
const unread = ref(0)
const rows = ref<NotificationRecord[]>([])

const table = computed(() => notifications.table({ namespace: 'inbox' }).table)

async function refreshCount() {
  try {
    unread.value = await unreadNotificationCount()
  } catch {
    // A failed poll is not worth interrupting the user; the next tick retries.
  }
}

let timer: ReturnType<typeof setInterval> | undefined

function stopPolling() {
  if (timer === undefined) return
  clearInterval(timer)
  timer = undefined
}

function startPolling() {
  if (timer !== undefined) return
  timer = setInterval(() => void refreshCount(), POLL_INTERVAL_MS)
}

watch(
  visibility,
  (state) => {
    if (state === 'visible') {
      void refreshCount()
      startPolling()
      return
    }
    stopPolling()
  },
  { immediate: true }
)

onUnmounted(stopPolling)

async function toggle() {
  open.value = !open.value
  if (!open.value) return

  const loaded = await notifications.table({ namespace: 'inbox' }).table.load!({ query: {}, searchParameters: {} })
  rows.value = (loaded as { data: NotificationRecord[] }).data

  // Only what was actually shown, and only what was actually unread.
  const ids = unreadIds(rows.value)
  if (ids.length === 0) return
  await markNotificationsSeen(ids)
  await notifications.invalidate()
  await refreshCount()
}

function openNotification(record: NotificationRecord) {
  const target = notificationRoute(record)
  if (!target) return
  open.value = false
  void router.push(target)
}
</script>

<template>
  <div class="is-notification-inbox">
    <button type="button" data-inbox-toggle :aria-expanded="open" aria-label="Notifikasi" @click="toggle">
      Notifikasi
      <span v-if="unread > 0" data-unread-badge>{{ unread }}</span>
    </button>

    <section v-if="open" data-inbox-drawer>
      <ListView title="Notifikasi" :table="table">
        <template #cell:title="{ value, record }">
          <a v-if="notificationRoute(record as NotificationRecord)" href="#" :data-notification="record.id" @click.prevent="openNotification(record as NotificationRecord)">
            {{ value }}
          </a>
          <span v-else :data-notification="record.id">{{ value }}</span>
        </template>
      </ListView>
    </section>
  </div>
</template>
