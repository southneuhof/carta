<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { permitCategoryApds } from './permit-category-apd.resource'

const form = { ...permitCategoryApds.create(), successMessage: 'Berhasil menambahkan data!' }
</script>

<template><FormView v-bind="form" title="Tambah Kategori APD" submit-label="Submit" /></template>
