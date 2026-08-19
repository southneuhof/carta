<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { permitAttachments } from './permit-attachment.resource'

const form = { ...permitAttachments.create(), successMessage: 'Berhasil menambahkan data!' }
</script>

<template><FormView v-bind="form" title="Tambah Checklist Dokumen" submit-label="Submit" /></template>
