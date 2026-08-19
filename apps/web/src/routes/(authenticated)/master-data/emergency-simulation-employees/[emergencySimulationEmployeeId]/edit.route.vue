<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { emergencySimulationEmployees } from '../emergency-simulation-employees.resource'

const route = useRoute('master-data-emergency-simulation-employees-edit')
const form = { ...emergencySimulationEmployees.update({ id: String(route.params.emergencySimulationEmployeeId) }), successMessage: 'Berhasil mengubah data!' }
</script>

<template><FormView v-bind="form" title="Ubah Karyawan Terlibat Simulasi Tanggap Darurat" submit-label="Submit" /></template>
