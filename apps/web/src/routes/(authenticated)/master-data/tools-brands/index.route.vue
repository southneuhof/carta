<script setup lang="ts">
import { ref } from 'vue'
import { ListView } from '@southneuhof/is-vue-framework'
import ChipFilter from '@southneuhof/is-vue-framework/components/composites/ChipFilter.vue'
import { toolsBrandCategoryOptions, toolsBrands } from './tools-brands.resource'

type CategoryCode = (typeof toolsBrandCategoryOptions)[number]['id']
const query = ref<Record<string, unknown>>({ categoryCode: 'heavy-equipments' })
const selectedCategory = ref<CategoryCode>('heavy-equipments')

function setCategory(value: unknown) {
  const categoryCode = toolsBrandCategoryOptions.some((item) => item.id === value) ? value as CategoryCode : 'heavy-equipments'
  selectedCategory.value = categoryCode
  query.value = { ...query.value, categoryCode, page: 1 }
}
</script>

<template>
  <ListView v-bind="toolsBrands.list()" title="Merk Alat Berat &amp; Alat Ukur/Uji" :query="query" @update:query="query = $event">
    <template #filters>
      <ChipFilter v-model="selectedCategory" :items="toolsBrandCategoryOptions.map((item) => ({ id: item.id, label: item.name }))" @update:model-value="setCategory" />
    </template>
  </ListView>
</template>
