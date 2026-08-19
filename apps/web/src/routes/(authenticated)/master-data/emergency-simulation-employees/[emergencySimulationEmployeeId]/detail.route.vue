<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { emergencySimulationEmployees } from '../emergency-simulation-employees.resource'

const route = useRoute('master-data-emergency-simulation-employees-detail')
</script>

<template>
  <DetailView
    v-bind="emergencySimulationEmployees.detail({ id: String(route.params.emergencySimulationEmployeeId) })"
    title="Detail Karyawan Terlibat Simulasi Tanggap Darurat"
    :back-to="{ name: 'master-data-emergency-simulation-employees' }"
  />
</template>
