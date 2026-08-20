<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { syllabi } from './syllabus.resource'

const form = { ...syllabi.create(), successMessage: 'Berhasil menambahkan data!' }
</script>

<template><FormView v-bind="form" title="Tambah Silabus" submit-label="Submit" /></template>
