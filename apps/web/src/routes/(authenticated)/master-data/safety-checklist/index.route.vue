<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { safetyChecklists } from './safety-checklist.resource'
</script>

<template><ListView v-bind="safetyChecklists.list()" title="Safety Checklist" /></template>
