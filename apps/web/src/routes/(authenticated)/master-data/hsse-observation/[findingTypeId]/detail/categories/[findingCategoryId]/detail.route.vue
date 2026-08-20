<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import AppRouterView from '@/components/routing/AppRouterView.vue'
import Tabs from '@/components/routing/Tabs.vue'
import type { RouteTab } from '@/router/tabs'
import { findingCategories } from '../../../../hsse-observation.resource'

const route = useRoute('master-data-hsse-observation-detail-categories-detail')
const findingTypeId = String(route.params.findingTypeId)
const findingCategoryId = String(route.params.findingCategoryId)
const tabs = [
  {
    action: {
      permission: 'view-finding-cause',
      to: { name: 'master-data-hsse-observation-detail-categories-detail-causes', params: { findingTypeId, findingCategoryId } } as never,
    },
    label: 'Penyebab Temuan',
  },
] as const satisfies readonly RouteTab[]
</script>

<template>
  <div class="flex flex-col gap-2">
    <DetailView
      v-bind="findingCategories(findingTypeId).detail({ id: findingCategoryId })"
      title="Kategori Penyebab"
      :back-to="{ name: 'master-data-hsse-observation-detail-categories', params: { findingTypeId } }"
    />
    <Tabs label="Kategori Penyebab" :items="tabs" />
    <AppRouterView />
  </div>
</template>
