<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import AppRouterView from '@/components/routing/AppRouterView.vue'
import Tabs from '@/components/routing/Tabs.vue'
import { users } from '../users.resource'
import type { RouteTab } from '@/router/tabs'
import { systemRoleAssignments } from './detail/system-roles/system-role-assignments.resource'
import { projectRoleAssignments } from './detail/project-roles/project-role-assignments.resource'

const route = useRoute('settings-users-detail')
const userId = route.params.userId
const updateTarget = (() => {
  const target = users.capabilities?.update?.to
  return target && { name: target.name, params: target.params(userId) }
})()

const tabs = [
  ...(systemRoleAssignments.capabilities?.list ? [{ action: systemRoleAssignments.capabilities.list, label: 'System Roles' }] : []),
  ...(projectRoleAssignments.capabilities?.list ? [{ action: projectRoleAssignments.capabilities.list, label: 'Project Roles' }] : []),
] satisfies readonly RouteTab[]
</script>

<template>
  <div class="flex flex-col gap-2">
    <DetailView title="Detail Pengguna" :back-to="{ name: users.capabilities?.list?.to?.name }" :resource="users" :id="userId">
      <template #controls>
        <RouterLink v-if="updateTarget" :to="updateTarget"><Button>Ubah</Button></RouterLink>
      </template>
    </DetailView>
    <Tabs label="Pengguna" :items="tabs" />
    <AppRouterView />
  </div>
</template>
