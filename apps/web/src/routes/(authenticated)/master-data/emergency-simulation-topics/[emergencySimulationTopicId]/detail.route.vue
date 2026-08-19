<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { emergencySimulationTopics } from '../emergency-simulation-topics.resource'

const route = useRoute('master-data-emergency-simulation-topics-detail')
</script>

<template>
  <DetailView
    v-bind="emergencySimulationTopics.detail({ id: String(route.params.emergencySimulationTopicId) })"
    title="Detail Topik Simulasi Tanggap Darurat"
    :back-to="{ name: 'master-data-emergency-simulation-topics' }"
  />
</template>
