<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { overtimes, type Overtime } from '@/framework/adapters/resources/overtimes'


</script>

<template>
  <ListView title="Lembur" :resource="overtimes">
    <template #cell:date="{ value, record }">
      <RouterLink :to="overtimes.rowLink!(record as Overtime)">
        {{ value }}
      </RouterLink>
    </template>
  </ListView>
</template>
