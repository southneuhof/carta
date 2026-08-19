<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { emergencySimulationTopics } from './emergency-simulation-topics.resource'

const form = { ...emergencySimulationTopics.create(), successMessage: 'Berhasil menambahkan data!' }
</script>

<template><FormView v-bind="form" title="Tambah Topik Simulasi Tanggap Darurat" submit-label="Submit" /></template>
