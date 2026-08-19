<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { permitDangerSources } from './permit-danger-source.resource'

const form = { ...permitDangerSources.create(), successMessage: 'Berhasil menambahkan data!' }
</script>

<template><FormView v-bind="form" title="Tambah Sumber Bahaya" submit-label="Submit" /></template>
