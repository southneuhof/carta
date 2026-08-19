<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { emergencySimulationEmployees } from './emergency-simulation-employees.resource'
</script>

<template><ListView v-bind="emergencySimulationEmployees.list()" title="Karyawan Terlibat Simulasi Tanggap Darurat" /></template>
