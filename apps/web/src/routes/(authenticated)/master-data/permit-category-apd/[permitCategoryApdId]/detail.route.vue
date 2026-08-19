<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import AppRouterView from '@/components/routing/AppRouterView.vue'
import Tabs from '@/components/routing/Tabs.vue'
import type { RouteTab } from '@/router/tabs'
import { permitCategoryApds } from '../permit-category-apd.resource'

const route = useRoute('master-data-permit-category-apd-detail')
const parentId = String(route.params.permitCategoryApdId)
const tabs = [
  {
    action: {
      permission: 'view-permit-apd',
      to: { name: 'master-data-permit-category-apd-detail-apd', params: { permitCategoryApdId: parentId } } as never,
    },
    label: 'APD',
  },
] as const satisfies readonly RouteTab[]
</script>

<template>
  <div class="flex flex-col gap-2">
    <DetailView v-bind="permitCategoryApds.detail({ id: parentId })" title="Detail Kategori APD" :back-to="{ name: 'master-data-permit-category-apd' }" />
    <Tabs label="Kategori APD" :items="tabs" />
    <AppRouterView />
  </div>
</template>
