<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { permitAttachments } from './permit-attachment.resource'
</script>

<template><ListView v-bind="permitAttachments.list()" title="Checklist Dokumen" /></template>
