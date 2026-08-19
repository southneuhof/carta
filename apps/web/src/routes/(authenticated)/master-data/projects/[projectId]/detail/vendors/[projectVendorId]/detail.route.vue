<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { projectVendors } from '../project-vendors.resource'

const route = useRoute('master-data-projects-detail-vendors-detail')
const projectId = String(route.params.projectId)
const resource = projectVendors(projectId)
</script>

<template>
  <DetailView v-bind="resource.detail({ id: String(route.params.projectVendorId) })" title="Vendor/Subkon/Mandor" :back-to="{ name: 'master-data-projects-detail-vendors', params: { projectId } }" />
</template>
