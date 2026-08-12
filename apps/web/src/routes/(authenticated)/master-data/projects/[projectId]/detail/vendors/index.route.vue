<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ListView } from '@southneuhof/is-vue-framework'
import { projectVendors } from './project-vendors.resource'

const route = useRoute('master-data-projects-detail-vendors')
const projectId = String(route.params.projectId)
const resource = projectVendors(projectId)
</script>

<template><ListView v-bind="resource.list()" title="Vendor/Subkon/Mandor" /></template>
