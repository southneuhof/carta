<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { emergencySimulationTopics } from './emergency-simulation-topics.resource'
</script>

<template><ListView v-bind="emergencySimulationTopics.list()" title="Topik Simulasi Tanggap Darurat" /></template>
