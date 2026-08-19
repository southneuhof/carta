<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { permitAttachments } from '../permit-attachment.resource'

const route = useRoute('master-data-permit-attachment-detail')
</script>

<template><DetailView v-bind="permitAttachments.detail({ id: String(route.params.permitAttachmentId) })" title="Detail Checklist Dokumen" :back-to="{ name: 'master-data-permit-attachment' }" /></template>
