<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { permitDangerSources } from './permit-danger-source.resource'
</script>

<template><ListView v-bind="permitDangerSources.list()" title="Sumber Bahaya" /></template>
