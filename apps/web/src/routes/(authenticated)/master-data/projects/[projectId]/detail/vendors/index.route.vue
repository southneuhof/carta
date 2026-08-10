<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ListView } from '@southneuhof/is-vue-framework'
import { projectVendors } from './project-vendors.resource'

const route = useRoute('master-data-projects-detail-vendors')
const projectId = String(route.params.projectId)
const resource = projectVendors(projectId)
const tableOptions = { searchParameters: { projectId } }
</script>

<template><ListView title="Vendor/Subkon/Mandor" :resource="resource" :table-options="tableOptions" /></template>
