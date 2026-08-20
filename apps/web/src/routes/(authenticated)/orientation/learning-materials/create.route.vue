<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { learningMaterials } from './learning-materials.resource'

const form = { ...learningMaterials.create(), successMessage: 'Berhasil menambahkan data!' }
</script>

<template><FormView v-bind="form" title="Tambah Materi" submit-label="Submit" /></template>
