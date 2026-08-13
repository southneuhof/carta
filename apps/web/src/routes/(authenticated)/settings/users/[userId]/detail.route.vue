<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import AppRouterView from '@/components/routing/AppRouterView.vue'
import Tabs from '@/components/routing/Tabs.vue'
import { users } from '../users.resource'
import type { RouteTab } from '@/router/tabs'

const route = useRoute('settings-users-detail')
const userId = route.params.userId

const tabs = [
  { action: { permission: 'view-system-role-assignments', to: { name: 'settings-users-detail-system-roles', params: { userId: String(userId) } } as never }, label: 'System Roles' },
  { action: { permission: 'view-project-role-assignments', to: { name: 'settings-users-detail-project-roles', params: { userId: String(userId) } } as never }, label: 'Project Roles' },
] satisfies readonly RouteTab[]
</script>

<template>
  <div class="flex flex-col gap-2">
    <DetailView v-bind="users.detail({ id: userId })" title="Detail Pengguna" :back-to="{ name: 'settings-users' }" />
    <Tabs label="Pengguna" :items="tabs" />
    <AppRouterView />
  </div>
</template>
