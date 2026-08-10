<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { projectVendors } from '../../master-data.resources'

const route = useRoute('master-data-project-vendors-detail')
</script>

<template><DetailView title="Project Vendors" :back-to="{ name: 'master-data-project-vendors' }" :resource="projectVendors" :id="String(route.params.projectVendorId)" /></template>
