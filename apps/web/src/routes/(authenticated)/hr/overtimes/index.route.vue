<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { overtimeListFilters, overtimes } from './overtimes.resource'
import type { Overtime } from './overtimes.operations'

</script>

<template>
  <ListView title="Lembur" :resource="overtimes" :filters="overtimeListFilters">
    <template #cell:date="{ value, record }">
      <RouterLink :to="overtimes.detailRoute!(record as Overtime)">
        {{ value }}
      </RouterLink>
    </template>
  </ListView>
</template>
