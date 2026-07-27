<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import AppRouterView from '@/components/routing/AppRouterView.vue'
import Tabs from '@/components/routing/Tabs.vue'
import { users } from '@/framework/adapters/resources/users'
import type { RouteTab } from '@/router/tabs'
import { userRoles } from '@/framework/adapters/resources/users'

const route = useRoute('settings-users-detail')
const userId = route.params.userId

const tabs = [{ action: userRoles.actions.list! as import('@southneuhof/is-vue-framework').NavigableResourceAction, label: 'Role' }] as const satisfies readonly RouteTab[]
</script>

<template>
  <div class="flex flex-col gap-4">
    <DetailView title="Detail Pengguna" :resource="users" :id="userId" />
    <Tabs label="Pengguna" :items="tabs" />
    <AppRouterView />
  </div>
</template>
