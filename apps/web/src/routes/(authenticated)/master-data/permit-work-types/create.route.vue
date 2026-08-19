<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { permitWorkTypes } from './permit-work-types.resource'

const form = { ...permitWorkTypes.create(), successMessage: 'Berhasil menambahkan data!' }
</script>

<template><FormView v-bind="form" title="Tambah Tipe Pekerjaan" submit-label="Submit" /></template>
