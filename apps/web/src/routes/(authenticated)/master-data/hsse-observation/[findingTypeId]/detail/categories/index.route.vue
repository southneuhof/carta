<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ListView } from '@southneuhof/is-vue-framework'
import { findingCategories } from '../../../hsse-observation.resource'

const route = useRoute('master-data-hsse-observation-detail-categories')
const findingTypeId = String(route.params.findingTypeId)
</script>

<template><ListView v-bind="findingCategories(findingTypeId).list({ namespace: `finding-categories.${findingTypeId}` })" title="Kategori Penyebab" /></template>
