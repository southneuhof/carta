<script setup lang="ts">
/**
 * Layout for one role. Placement is expressed by the filesystem: the child
 * routes below are ordinary screens that receive `roleId` from route params.
 * Nothing here is a "nested resource".
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const roleId = computed(() => String((route.params as { roleId?: string }).roleId ?? ''))

const tabs = computed(() => [
  { key: 'detail', label: 'Detail', to: `/settings/roles/${roleId.value}` },
  { key: 'permissions', label: 'Permissions', to: `/settings/roles/${roleId.value}/permissions` },
])

/**
 * Sibling tabs share a subtree, so each sibling table's namespaced query
 * parameters survive a tab round trip; leaving the subtree drops them.
 */
function siblingQuery() {
  return Object.fromEntries(Object.entries(route.query).filter(([key]) => key.includes('.')))
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <nav aria-label="Role">
      <a v-for="tab in tabs" :key="tab.key" :href="tab.to" :data-tab="tab.key" @click.prevent="router.push({ path: tab.to, query: siblingQuery() })">
        {{ tab.label }}
      </a>
    </nav>
    <RouterView />
  </div>
</template>
