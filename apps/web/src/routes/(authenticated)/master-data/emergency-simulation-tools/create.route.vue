<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { emergencySimulationTools } from './emergency-simulation-tools.resource'

const form = { ...emergencySimulationTools.create(), successMessage: 'Berhasil menambahkan data!' }
</script>

<template><FormView v-bind="form" title="Tambah Perlengkapan Tanggap Darurat" submit-label="Submit" /></template>

