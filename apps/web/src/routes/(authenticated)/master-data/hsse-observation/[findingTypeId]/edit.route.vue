<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { findingTypes } from '../hsse-observation.resource'

const route = useRoute('master-data-hsse-observation-edit')
const form = { ...findingTypes.update({ id: String(route.params.findingTypeId) }), successMessage: 'Berhasil mengubah data!' }
</script>

<template><FormView v-bind="form" title="Jenis Temuan" submit-label="Submit" /></template>
