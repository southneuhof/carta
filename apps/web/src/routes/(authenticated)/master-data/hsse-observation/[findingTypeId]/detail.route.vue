<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import AppRouterView from '@/components/routing/AppRouterView.vue'
import Tabs from '@/components/routing/Tabs.vue'
import type { RouteTab } from '@/router/tabs'
import { findingTypes } from '../hsse-observation.resource'

const route = useRoute('master-data-hsse-observation-detail')
const findingTypeId = String(route.params.findingTypeId)
const tabs = [
  {
    action: {
      permission: 'view-finding-categories',
      to: { name: 'master-data-hsse-observation-detail-categories', params: { findingTypeId } } as never,
    },
    label: 'Kategori Penyebab',
  },
] as const satisfies readonly RouteTab[]
</script>

<template>
  <div class="flex flex-col gap-2">
    <DetailView v-bind="findingTypes.detail({ id: findingTypeId })" title="Jenis Temuan" :back-to="{ name: 'master-data-hsse-observation' }" />
    <Tabs label="Jenis Temuan" :items="tabs" />
    <AppRouterView />
  </div>
</template>
