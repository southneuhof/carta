<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
/**
 * Named route tabs owned explicitly by parent layouts.
 */
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter, type RouteRecordNormalized } from 'vue-router'
import { useResourceRuntime } from '@southneuhof/is-vue-framework'
import type { RouteTab } from '@/router/tabs'

const props = defineProps<{
  items: readonly RouteTab[]
  label?: string
}>()

const route = useRoute()
const router = useRouter()

const tabs = computed(() => {
  return props.items.flatMap((item) => {
    let target
    const to = item.action.to
    if (!to) return []
    try {
      target = router.resolve({ ...(to as object), params: route.params } as never)
    } catch {
      return []
    }
    if (target.name !== to.name || !target.matched.length) return []
    const access = useResourceRuntime().adapters.access
    if (item.action.permission !== null && !access.allows({ operation: 'detail', permission: item.action.permission })) return []
    return [{ ...item, to: target, active: route.name === target.name }]
  })
})

function componentRecord(records: readonly RouteRecordNormalized[]): RouteRecordNormalized | undefined {
  return [...records].reverse().find((record) => record.components?.default)
}

const owner = computed(() => {
  const owners = tabs.value.map((tab) => componentRecord(tab.to.matched.slice(0, -1)))
  if (!owners.length || owners.some((candidate) => !candidate) || owners.some((candidate) => candidate !== owners[0])) return undefined
  return owners[0]
})

const currentOwner = computed(() => componentRecord(route.matched))

function siblingQuery() {
  return Object.fromEntries(Object.entries(route.query).filter(([key]) => key.includes('.')))
}

let pendingDestination: string | undefined
watchEffect(() => {
  const first = tabs.value[0]
  if (!first || !owner.value || currentOwner.value !== owner.value) return

  const destination = router.resolve({ path: first.to.path, query: siblingQuery() })
  if (destination.fullPath === route.fullPath || pendingDestination === destination.fullPath) return

  pendingDestination = destination.fullPath
  void router.replace({ path: first.to.path, query: siblingQuery() }).catch(() => undefined).finally(() => {
    if (pendingDestination === destination.fullPath) pendingDestination = undefined
  })
})

</script>

<template>
  <nav v-if="tabs.length > 1" :aria-label="props.label ?? 'Tab'">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.action.to?.name"
      :to="{ path: tab.to.path, query: siblingQuery() }"
      :data-tab="tab.action.to?.name"
      :aria-current="tab.active ? 'page' : undefined"
    >
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>
