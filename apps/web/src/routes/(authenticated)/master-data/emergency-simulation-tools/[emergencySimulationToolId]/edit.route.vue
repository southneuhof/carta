<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { emergencySimulationTools } from '../emergency-simulation-tools.resource'

const route = useRoute('master-data-emergency-simulation-tools-edit')
const form = { ...emergencySimulationTools.update({ id: String(route.params.emergencySimulationToolId) }), successMessage: 'Berhasil mengubah data!' }
</script>

<template><FormView v-bind="form" title="Ubah Perlengkapan Tanggap Darurat" submit-label="Submit" /></template>

