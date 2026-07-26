<script setup lang="ts">
/**
 * Layout for one user. Child screens receive `userId` from route params;
 * nothing here injects a shared record under a string key.
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const userId = computed(() => String((route.params as { userId?: string }).userId ?? ''))

const tabs = computed(() => [
  { key: 'detail', label: 'Detail', to: `/settings/users/${userId.value}` },
  { key: 'roles', label: 'Role', to: `/settings/users/${userId.value}/roles` },
])

/** Sibling tabs keep each other's namespaced table query inside this subtree. */
function siblingQuery() {
  return Object.fromEntries(Object.entries(route.query).filter(([key]) => key.includes('.')))
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <nav aria-label="Pengguna">
      <a v-for="tab in tabs" :key="tab.key" :href="tab.to" :data-tab="tab.key" @click.prevent="router.push({ path: tab.to, query: siblingQuery() })">
        {{ tab.label }}
      </a>
    </nav>
    <RouterView />
  </div>
</template>
