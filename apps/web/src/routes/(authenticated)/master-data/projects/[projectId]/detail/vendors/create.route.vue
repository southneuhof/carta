<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { projectVendors } from './project-vendors.resource'

const route = useRoute('master-data-projects-detail-vendors-create')
const projectId = String(route.params.projectId)
const resource = projectVendors(projectId)
</script>

<template><FormView title="Add Vendor" :resource="resource" :form-options="{ initialData: { projectId } }" /></template>
