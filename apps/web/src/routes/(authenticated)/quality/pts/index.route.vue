<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { pts } from './pts.resource'
import type { Pts } from './pts.operations'
</script>

<template>
  <ListView title="PTS" :resource="pts">
    <template #cell:number="{ value, record }">
      <RouterLink :to="pts.detailRoute!(record as Pts)">{{ value }}</RouterLink>
    </template>
  </ListView>
</template>
