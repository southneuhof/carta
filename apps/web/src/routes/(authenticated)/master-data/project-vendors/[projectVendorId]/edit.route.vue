<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { projectVendors } from '../project-vendors.resource'

const route = useRoute('master-data-project-vendors-edit')
</script>

<template><FormView title="Edit Vendor/Subkon/Mandor" :resource="projectVendors" :id="String(route.params.projectVendorId)" /></template>
