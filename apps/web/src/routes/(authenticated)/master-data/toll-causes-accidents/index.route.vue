<script setup lang="ts">
import { ref } from 'vue'
import { ListView } from '@southneuhof/is-vue-framework'
import ChipFilter from '@southneuhof/is-vue-framework/components/composites/ChipFilter.vue'
import { tollCausesAccidents } from './toll-causes-accidents.resource'

type CategoryCode = 'driver' | 'vehicle' | 'road' | 'environment'

const query = ref<Record<string, unknown>>({ categoryCode: 'driver' })
const selectedCategory = ref<CategoryCode>('driver')
const filterItems = [
  { id: 'driver', label: 'Pengemudi' },
  { id: 'vehicle', label: 'Kendaraan' },
  { id: 'road', label: 'Jalan' },
  { id: 'environment', label: 'Lingkungan' },
]

function setCategory(value: unknown) {
  const categoryCode = filterItems.some((item) => item.id === value) ? value as CategoryCode : 'driver'
  selectedCategory.value = categoryCode
  query.value = { ...query.value, categoryCode, page: 1 }
}
</script>

<template>
  <ListView v-bind="tollCausesAccidents.list()" title="Faktor Kecelakaan" :query="query" @update:query="query = $event">
    <template #filters>
      <ChipFilter v-model="selectedCategory" :items="filterItems" @update:model-value="setCategory" />
    </template>
  </ListView>
</template>
