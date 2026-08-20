<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { syllabusCategories } from './syllabus-categories.resource'

const form = { ...syllabusCategories.create(), successMessage: 'Berhasil menambahkan data!' }
</script>

<template><FormView v-bind="form" title="Tambah Kategori Silabus" submit-label="Submit" /></template>
