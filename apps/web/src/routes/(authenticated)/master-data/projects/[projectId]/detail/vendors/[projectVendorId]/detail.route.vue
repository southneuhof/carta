<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { projectVendors } from '../project-vendors.resource'

const route = useRoute('master-data-projects-detail-vendors-detail')
const projectId = String(route.params.projectId)
const resource = projectVendors(projectId)
</script>

<template><DetailView title="Vendor/Subkon/Mandor" :back-to="{ name: 'master-data-projects-detail-vendors', params: { projectId } }" :resource="resource" :id="String(route.params.projectVendorId)" /></template>
