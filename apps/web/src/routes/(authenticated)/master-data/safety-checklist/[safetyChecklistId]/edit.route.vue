<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { safetyChecklists } from '../safety-checklist.resource'

const route = useRoute('master-data-safety-checklist-edit')
const form = { ...safetyChecklists.update({ id: String(route.params.safetyChecklistId) }), successMessage: 'Berhasil mengubah data!' }
</script>

<template><FormView v-bind="form" title="Perbarui Safety Checklist" submit-label="Submit" /></template>
