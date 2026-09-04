<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/loom'
import AppRouterView from '@/components/routing/AppRouterView.vue'
import Tabs from '@/components/routing/Tabs.vue'
import { users } from '../users.resource'
import type { RouteTab } from '@/router/tabs'

const route = useRoute('settings-users-detail')
const userId = route.params.userId

const tabs = [
  { action: { permission: 'view-role-assignments', to: { name: 'settings-users-detail-role-assignments', params: { userId: String(userId) } } as never }, label: 'Role Assignments' },
] satisfies readonly RouteTab[]
</script>

<template>
  <div class="flex flex-col gap-2">
    <DetailView v-bind="users.detail({ id: userId })" />
    <Tabs label="Pengguna" :items="tabs" />
    <AppRouterView />
  </div>
</template>
