<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { emergencySimulationEmployees } from './emergency-simulation-employees.resource'

const form = { ...emergencySimulationEmployees.create(), successMessage: 'Berhasil menambahkan data!' }
</script>

<template><FormView v-bind="form" title="Tambah Karyawan Terlibat Simulasi Tanggap Darurat" submit-label="Submit" /></template>
