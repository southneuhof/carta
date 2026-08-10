<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import AppRouterView from '@/components/routing/AppRouterView.vue'
import Tabs from '@/components/routing/Tabs.vue'
import type { RouteTab } from '@/router/tabs'
import { projects } from '../projects.resource'
import { projectVendors } from './detail/vendors/project-vendors.resource'

const route = useRoute('master-data-projects-detail')

const resource = projectVendors(String(route.params.projectId))
const tabs = resource.capabilities?.list
  ? [{ action: resource.capabilities.list, label: 'Vendor/Subkon/Mandor' }] as const satisfies readonly RouteTab[]
  : []
</script>

<template>
  <div class="flex flex-col gap-2">
    <DetailView title="Proyek" :back-to="{ name: 'master-data-projects' }" :resource="projects" :id="String(route.params.projectId)" />
    <Tabs label="Proyek" :items="tabs" />
    <AppRouterView />
  </div>
</template>
