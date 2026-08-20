<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ListView } from '@southneuhof/is-vue-framework'
import ChipFilter from '@southneuhof/is-vue-framework/components/composites/ChipFilter.vue'
import { findingCriteriaLookup, findingTypes } from './hsse-observation.resource'
import type { FindingCriteria } from './hsse-observation.schema'

const query = ref<Record<string, unknown>>({ findingCriteriaCode: 'negative' })
const selectedCriteria = ref('negative')
const criteria = ref<FindingCriteria[]>([])

const criteriaItems = computed(() => criteria.value.map((item) => ({ id: item.code ?? item.id, label: item.name })))

async function loadCriteria() {
  const action = findingCriteriaLookup.list()
  const result = await action.run({ query: { page: 1, limit: 100 }, searchParameters: { page: 1, limit: 100 } })
  criteria.value = result.data as FindingCriteria[]
}

function setCriteria(value: unknown) {
  const code = criteria.value.find((item) => (item.code ?? item.id) === value)?.code ?? (value === 'positive' ? 'positive' : 'negative')
  selectedCriteria.value = code
  query.value = { ...query.value, findingCriteriaCode: code, page: 1 }
}

onMounted(() => void loadCriteria())
</script>

<template>
  <ListView v-bind="findingTypes.list()" title="Kriteria Temuan Observation" :query="query" @update:query="query = $event">
    <template #filters>
      <ChipFilter v-model="selectedCriteria" :items="criteriaItems" @update:model-value="setCriteria" />
    </template>
  </ListView>
</template>
