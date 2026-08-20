<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { toolsBrands } from './tools-brands.resource'

const form = { ...toolsBrands.create(), successMessage: 'Berhasil menambahkan data!' }
</script>

<template><FormView v-bind="form" title="Tambah Merk Alat Berat &amp; Alat Ukur/Uji" submit-label="Submit" /></template>

