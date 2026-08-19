<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { emergencySimulationTools } from '../emergency-simulation-tools.resource'

const route = useRoute('master-data-emergency-simulation-tools-detail')
</script>

<template><DetailView v-bind="emergencySimulationTools.detail({ id: String(route.params.emergencySimulationToolId) })" title="Detail Perlengkapan Tanggap Darurat" :back-to="{ name: 'master-data-emergency-simulation-tools' }" /></template>

