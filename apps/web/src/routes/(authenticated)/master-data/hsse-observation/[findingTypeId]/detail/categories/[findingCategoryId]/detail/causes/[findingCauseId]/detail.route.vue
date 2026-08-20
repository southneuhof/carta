<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { findingCauses } from '../../../../../../../hsse-observation.resource'

const route = useRoute('master-data-hsse-observation-detail-categories-detail-causes-detail')
</script>

<template>
  <DetailView
    v-bind="findingCauses(String(route.params.findingTypeId), String(route.params.findingCategoryId)).detail({ id: String(route.params.findingCauseId) })"
    title="Penyebab Temuan"
    :back-to="{ name: 'master-data-hsse-observation-detail-categories-detail-causes', params: { findingTypeId: route.params.findingTypeId, findingCategoryId: route.params.findingCategoryId } }"
  />
</template>
