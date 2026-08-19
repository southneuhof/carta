<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import AppRouterView from '@/components/routing/AppRouterView.vue'
import Tabs from '@/components/routing/Tabs.vue'
import type { RouteTab } from '@/router/tabs'
import { projects } from '../projects.resource'

const route = useRoute('master-data-projects-detail')

const tabs = [
  { action: { permission: null, to: { name: 'master-data-projects-detail-vendors', params: { projectId: String(route.params.projectId) } } as never }, label: 'Vendor/Subkon/Mandor' },
] as const satisfies readonly RouteTab[]
</script>

<template>
  <div class="flex flex-col gap-2">
    <DetailView v-bind="projects.detail({ id: String(route.params.projectId) })" title="Proyek" :back-to="{ name: 'master-data-projects' }" />
    <Tabs label="Proyek" :items="tabs" />
    <AppRouterView />
  </div>
</template>
