<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ListView } from '@southneuhof/is-vue-framework'
import { findingCauses } from '../../../../../../hsse-observation.resource'

const route = useRoute('master-data-hsse-observation-detail-categories-detail-causes')
const findingTypeId = String(route.params.findingTypeId)
const findingCategoryId = String(route.params.findingCategoryId)
</script>

<template><ListView v-bind="findingCauses(findingTypeId, findingCategoryId).list({ namespace: `finding-cause.${findingCategoryId}` })" title="Penyebab Temuan" /></template>
