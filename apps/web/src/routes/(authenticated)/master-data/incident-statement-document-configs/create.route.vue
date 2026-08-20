<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { incidentStatementDocumentConfigs } from './incident-statement-document-configs.resource'

const form = { ...incidentStatementDocumentConfigs.create(), successMessage: 'Berhasil menambahkan data!' }
</script>

<template><FormView v-bind="form" title="Dokumen Pernyataan Insiden" submit-label="Submit" /></template>
