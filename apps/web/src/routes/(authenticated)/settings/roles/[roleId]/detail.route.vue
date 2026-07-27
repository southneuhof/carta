<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import AppRouterView from '@/components/routing/AppRouterView.vue'
import Tabs from '@/components/routing/Tabs.vue'
import { roles } from '../roles.resource'
import type { RouteTab } from '@/router/tabs'
import { rolePermissions } from './detail/permissions/role-permissions.resource'

const route = useRoute('settings-roles-detail')
const roleId = route.params.roleId

const tabs = [{ action: rolePermissions.actions.list! as import('@southneuhof/is-vue-framework').NavigableResourceAction, label: 'Permissions' }] as const satisfies readonly RouteTab[]
</script>

<template>
  <div class="flex flex-col gap-4">
    <DetailView title="Detail Role" :resource="roles" :id="roleId" />
    <Tabs label="Role" :items="tabs" />
    <AppRouterView />
  </div>
</template>
