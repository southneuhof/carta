<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { incidentStatementDocumentConfigs } from '../incident-statement-document-configs.resource'

const route = useRoute('master-data-incident-statement-document-configs-detail')
</script>

<template>
  <DetailView
    v-bind="incidentStatementDocumentConfigs.detail({ id: String(route.params.incidentStatementDocumentConfigId) })"
    title="Dokumen Pernyataan Insiden"
    :back-to="{ name: 'master-data-incident-statement-document-configs' }"
  />
</template>
