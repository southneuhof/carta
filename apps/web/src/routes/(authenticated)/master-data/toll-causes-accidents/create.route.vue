<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { tollCausesAccidents } from './toll-causes-accidents.resource'

const form = { ...tollCausesAccidents.create(), successMessage: 'Berhasil menambahkan data!' }
</script>

<template><FormView v-bind="form" title="Tambah Faktor Kecelakaan" submit-label="Submit" /></template>
