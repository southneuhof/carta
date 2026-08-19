<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { emergencySimulationTools } from './emergency-simulation-tools.resource'
</script>

<template><ListView v-bind="emergencySimulationTools.list()" title="Perlengkapan Tanggap Darurat" /></template>

