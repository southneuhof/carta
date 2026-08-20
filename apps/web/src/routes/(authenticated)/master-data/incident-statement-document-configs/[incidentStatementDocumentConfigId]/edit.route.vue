<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { incidentStatementDocumentConfigs } from '../incident-statement-document-configs.resource'

const route = useRoute('master-data-incident-statement-document-configs-edit')
const form = { ...incidentStatementDocumentConfigs.update({ id: String(route.params.incidentStatementDocumentConfigId) }), successMessage: 'Berhasil mengubah data!' }
</script>

<template><FormView v-bind="form" title="Dokumen Pernyataan Insiden" submit-label="Submit" /></template>
