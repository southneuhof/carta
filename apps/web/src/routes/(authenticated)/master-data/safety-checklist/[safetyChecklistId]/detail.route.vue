<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { safetyChecklists } from '../safety-checklist.resource'

const route = useRoute('master-data-safety-checklist-detail')
</script>

<template><DetailView v-bind="safetyChecklists.detail({ id: String(route.params.safetyChecklistId) })" title="Detail Safety Checklist" :back-to="{ name: 'master-data-safety-checklist' }" /></template>
