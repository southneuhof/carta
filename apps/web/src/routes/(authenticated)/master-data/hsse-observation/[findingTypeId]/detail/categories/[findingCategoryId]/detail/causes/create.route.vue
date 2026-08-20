<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { findingCauses } from '../../../../../../hsse-observation.resource'

const route = useRoute('master-data-hsse-observation-detail-categories-detail-causes-create')
const findingTypeId = String(route.params.findingTypeId)
const findingCategoryId = String(route.params.findingCategoryId)
const form = { ...findingCauses(findingTypeId, findingCategoryId).create(), successMessage: 'Berhasil menambahkan data!' }
</script>

<template><FormView v-bind="form" title="Penyebab Temuan" submit-label="Submit" /></template>
