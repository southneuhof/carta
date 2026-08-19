<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { safetyChecklists } from './safety-checklist.resource'

const form = { ...safetyChecklists.create(), successMessage: 'Berhasil menambahkan data!' }
</script>

<template><FormView v-bind="form" title="Tambah Safety Checklist" submit-label="Submit" /></template>
