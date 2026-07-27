<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import AppRouterView from '@/components/routing/AppRouterView.vue'
import Tabs from '@/components/routing/Tabs.vue'
import { users } from '../users.resource'
import type { RouteTab } from '@/router/tabs'
import { userRoles } from './detail/roles/user-roles.resource'

const route = useRoute('settings-users-detail')
const userId = route.params.userId
const updateTarget = (() => {
  const target = users.actions.update?.to
  return typeof target === 'function' ? target(userId) : target
})()

const tabs = [{ action: userRoles.actions.list! as import('@southneuhof/is-vue-framework').NavigableResourceAction, label: 'Role' }] as const satisfies readonly RouteTab[]
</script>

<template>
  <div class="flex flex-col gap-4">
    <DetailView title="Detail Pengguna" :resource="users" :id="userId">
      <template #controls>
        <RouterLink v-if="updateTarget" :to="updateTarget"><Button>Ubah</Button></RouterLink>
      </template>
      <template #footer>
        <RouterLink :to="users.actions.list!.to as never"><Button variant="text">Kembali</Button></RouterLink>
      </template>
    </DetailView>
    <Tabs label="Pengguna" :items="tabs" />
    <AppRouterView />
  </div>
</template>
