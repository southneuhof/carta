<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { findingCategories } from '../../../../hsse-observation.resource'

const route = useRoute('master-data-hsse-observation-detail-categories-edit')
const findingTypeId = String(route.params.findingTypeId)
const form = { ...findingCategories(findingTypeId).update({ id: String(route.params.findingCategoryId) }), successMessage: 'Berhasil mengubah data!' }
</script>

<template><FormView v-bind="form" title="Kategori Penyebab" submit-label="Submit" /></template>
