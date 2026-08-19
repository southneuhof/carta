<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ListView } from '@southneuhof/is-vue-framework'
import { permitApds } from '../../../permit-category-apd.resource'

const route = useRoute('master-data-permit-category-apd-detail-apd')
const parentId = String(route.params.permitCategoryApdId)
const resource = permitApds(parentId)
</script>

<template>
  <ListView v-bind="resource.list({ namespace: `permit-apd.${parentId}` })" title="APD" />
</template>
