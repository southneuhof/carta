<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { overtimes } from './overtimes.resource'
import type { Overtime } from './overtimes.operations'

</script>

<template>
  <ListView title="Overtime" :resource="overtimes">
    <template #cell:date="{ value, record }">
      <RouterLink :to="overtimes.detailRoute!(record as Overtime)">
        {{ value }}
      </RouterLink>
    </template>
  </ListView>
</template>
