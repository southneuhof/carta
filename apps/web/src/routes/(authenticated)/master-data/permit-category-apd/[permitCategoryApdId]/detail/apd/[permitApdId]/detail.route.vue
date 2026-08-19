<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { permitApds } from '../../../../permit-category-apd.resource'

const route = useRoute('master-data-permit-category-apd-detail-apd-detail')
const parentId = String(route.params.permitCategoryApdId)
</script>

<template>
  <DetailView
    v-bind="permitApds(parentId).detail({ id: String(route.params.permitApdId) })"
    title="Detail APD"
    :back-to="{ name: 'master-data-permit-category-apd-detail', params: { permitCategoryApdId: parentId } }"
  />
</template>
