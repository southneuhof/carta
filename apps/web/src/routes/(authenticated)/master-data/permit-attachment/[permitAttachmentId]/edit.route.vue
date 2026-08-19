<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { permitAttachments } from '../permit-attachment.resource'

const route = useRoute('master-data-permit-attachment-edit')
const form = { ...permitAttachments.update({ id: String(route.params.permitAttachmentId) }), successMessage: 'Berhasil mengubah data!' }
</script>

<template><FormView v-bind="form" title="Perbarui Checklist Dokumen" submit-label="Submit" /></template>
