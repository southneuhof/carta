<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { emergencySimulationTopics } from '../emergency-simulation-topics.resource'

const route = useRoute('master-data-emergency-simulation-topics-edit')
const form = { ...emergencySimulationTopics.update({ id: String(route.params.emergencySimulationTopicId) }), successMessage: 'Berhasil mengubah data!' }
</script>

<template><FormView v-bind="form" title="Ubah Topik Simulasi Tanggap Darurat" submit-label="Submit" /></template>

