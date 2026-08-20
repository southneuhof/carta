<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { incidentStatementDocumentConfigs } from './incident-statement-document-configs.resource'
</script>

<template><ListView v-bind="incidentStatementDocumentConfigs.list()" title="Dokumen Pernyataan Insiden" /></template>
