<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { toolsTypes } from './tools-types.resource'

const form = { ...toolsTypes.create(), successMessage: 'Berhasil menambahkan data!' }
</script>

<template><FormView v-bind="form" title="Tambah Jenis Alat Berat &amp; Alat Ukur/Uji" submit-label="Submit" /></template>

