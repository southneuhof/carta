<script setup lang="ts">
import { ref } from 'vue'
import { ListView } from '@southneuhof/is-vue-framework'
import ChipFilter from '@southneuhof/is-vue-framework/components/composites/ChipFilter.vue'
import { projects } from './projects.resource'
import type { ProjectQuery } from './projects.operations'

type ProjectFilter = 'all' | 'active' | 'inactive' | 'incomplete'

const query = ref<Record<string, unknown>>({})
const selectedFilter = ref<ProjectFilter | null>('all')
const filterItems = [
  { id: 'all', label: 'Semua Data' },
  { id: 'active', label: 'Proyek Aktif' },
  { id: 'inactive', label: 'Proyek Tidak Aktif' },
  { id: 'incomplete', label: 'Belum Lengkap' },
]
const filterQueries: Record<ProjectFilter, Partial<ProjectQuery>> = {
  all: {},
  active: { statusCode: 'completed', implementationStatusCode: 'on-progress' },
  inactive: { statusCode: 'completed', implementationStatusCode: 'finished' },
  incomplete: { statusCode: 'draft' },
}

function setFilter(value: unknown) {
  const next = { ...query.value }
  for (const key of ['active', 'statusCode', 'implementationStatusCode']) delete next[key]
  const filter = typeof value === 'string' && value in filterQueries ? (value as ProjectFilter) : 'all'
  Object.assign(next, filterQueries[filter], { page: 1 })
  selectedFilter.value = filter
  query.value = next
}
</script>
<template>
  <ListView title="Proyek" :resource="projects" :query="query" @update:query="query = $event">
    <template #filters>
      <ChipFilter v-model="selectedFilter" :items="filterItems" @update:model-value="setFilter" />
    </template>
  </ListView>
</template>
