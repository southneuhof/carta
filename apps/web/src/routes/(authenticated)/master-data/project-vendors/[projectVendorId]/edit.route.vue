<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { projectVendors } from '../../master-data.resources'

const route = useRoute('master-data-project-vendors-edit')
</script>

<template><FormView title="Edit Project Vendors" :resource="projectVendors" :id="String(route.params.projectVendorId)" /></template>
